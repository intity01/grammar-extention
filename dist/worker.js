// Grammar Checker Extension - Web Worker
// Handles grammar analysis in a separate thread

// Language enum
const Language = {
  THAI: "th",
  ENGLISH: "en",
  JAPANESE: "ja",
  UNKNOWN: "unknown"
};

// Character ranges for language detection
const THAI_RANGE = { start: 0x0E00, end: 0x0E7F };
const ENGLISH_UPPER = { start: 65, end: 90 };
const ENGLISH_LOWER = { start: 97, end: 122 };
const HIRAGANA = { start: 0x3040, end: 0x309F };
const KATAKANA = { start: 0x30A0, end: 0x30FF };
const CJK = { start: 0x4E00, end: 0x9FAF };

// Cache for loaded dictionaries and rules
const dictionaries = new Map();
const rules = new Map();

// Detect language of a character
function detectCharLanguage(char) {
  const code = char.charCodeAt(0);
  
  if (code >= THAI_RANGE.start && code <= THAI_RANGE.end) {
    return Language.THAI;
  }
  if ((code >= ENGLISH_UPPER.start && code <= ENGLISH_UPPER.end) ||
      (code >= ENGLISH_LOWER.start && code <= ENGLISH_LOWER.end)) {
    return Language.ENGLISH;
  }
  if ((code >= HIRAGANA.start && code <= HIRAGANA.end) ||
      (code >= KATAKANA.start && code <= KATAKANA.end) ||
      (code >= CJK.start && code <= CJK.end)) {
    return Language.JAPANESE;
  }
  return Language.UNKNOWN;
}

// Detect primary language of text
function detectLanguage(text) {
  const counts = {
    [Language.THAI]: 0,
    [Language.ENGLISH]: 0,
    [Language.JAPANESE]: 0,
    [Language.UNKNOWN]: 0
  };

  for (const char of text) {
    if (char.trim()) {
      counts[detectCharLanguage(char)]++;
    }
  }

  let maxLang = Language.UNKNOWN;
  let maxCount = 0;
  
  for (const [lang, count] of Object.entries(counts)) {
    if (count > maxCount && lang !== Language.UNKNOWN) {
      maxCount = count;
      maxLang = lang;
    }
  }

  return maxLang;
}

// Analyze text for grammar errors
function analyzeText(text, loadedRules) {
  if (!text || text.trim().length < 3) {
    return { errors: [], language: Language.UNKNOWN };
  }

  const language = detectLanguage(text);
  const languageRules = loadedRules.get(language) || [];
  const errors = [];

  for (const rule of languageRules) {
    if (!rule.enabled) continue;
    
    try {
      const pattern = new RegExp(rule.pattern, "gu");
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        errors.push({
          start: match.index,
          end: match.index + match[0].length,
          type: rule.errorType,
          message: rule.message,
          correction: rule.correction,
          severity: rule.severity,
          ruleId: rule.id
        });
      }
    } catch (e) {
      // Skip this rule if regex fails
    }
  }

  return { errors, language };
}

// Handle messages from main thread
self.onmessage = function(event) {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case "ANALYZE": {
        const result = analyzeText(payload.text, rules);
        self.postMessage({ id, type: "RESULT", payload: result });
        break;
      }

      case "LOAD_DICTIONARY": {
        dictionaries.set(payload.language, payload.data);
        self.postMessage({ id, type: "RESULT", payload: true });
        break;
      }

      case "LOAD_RULES": {
        rules.set(payload.language, payload.rules);
        self.postMessage({ id, type: "RESULT", payload: true });
        break;
      }

      default:
        self.postMessage({ id, type: "ERROR", error: "Unknown message type" });
    }
  } catch (error) {
    self.postMessage({ 
      id, 
      type: "ERROR", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
