import { Language, LanguageSegment } from "./types";

/**
 * Language Detector using Unicode character ranges
 * Implements character-based language detection without AI/ML
 */

// Unicode character ranges for language detection
const UNICODE_RANGES = {
  // Thai: U+0E00 to U+0E7F
  THAI: { start: 0x0e00, end: 0x0e7f },

  // English: U+0041 to U+005A (A-Z), U+0061 to U+007A (a-z)
  ENGLISH_UPPER: { start: 0x0041, end: 0x005a },
  ENGLISH_LOWER: { start: 0x0061, end: 0x007a },

  // Japanese Hiragana: U+3040 to U+309F
  HIRAGANA: { start: 0x3040, end: 0x309f },

  // Japanese Katakana: U+30A0 to U+30FF
  KATAKANA: { start: 0x30a0, end: 0x30ff },

  // Japanese Kanji: U+4E00 to U+9FAF
  KANJI: { start: 0x4e00, end: 0x9faf },
} as const;

/**
 * Check if a character belongs to Thai Unicode range
 */
function isThaiChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= UNICODE_RANGES.THAI.start && code <= UNICODE_RANGES.THAI.end;
}

/**
 * Check if a character belongs to English Unicode ranges
 */
function isEnglishChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= UNICODE_RANGES.ENGLISH_UPPER.start &&
      code <= UNICODE_RANGES.ENGLISH_UPPER.end) ||
    (code >= UNICODE_RANGES.ENGLISH_LOWER.start &&
      code <= UNICODE_RANGES.ENGLISH_LOWER.end)
  );
}

/**
 * Check if a character belongs to Japanese Unicode ranges
 */
function isJapaneseChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= UNICODE_RANGES.HIRAGANA.start &&
      code <= UNICODE_RANGES.HIRAGANA.end) ||
    (code >= UNICODE_RANGES.KATAKANA.start &&
      code <= UNICODE_RANGES.KATAKANA.end) ||
    (code >= UNICODE_RANGES.KANJI.start && code <= UNICODE_RANGES.KANJI.end)
  );
}

/**
 * Detect the language of a single character
 */
function detectCharLanguage(char: string): Language {
  if (isThaiChar(char)) {
    return Language.THAI;
  }
  if (isEnglishChar(char)) {
    return Language.ENGLISH;
  }
  if (isJapaneseChar(char)) {
    return Language.JAPANESE;
  }
  return Language.UNKNOWN;
}

/**
 * Detect all languages present in the text
 * Returns an array of unique languages found
 */
export function detect(text: string): Language[] {
  const languagesSet = new Set<Language>();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lang = detectCharLanguage(char);

    // Only add known languages (skip UNKNOWN)
    if (lang !== Language.UNKNOWN) {
      languagesSet.add(lang);
    }
  }

  return Array.from(languagesSet);
}

/**
 * Segment mixed-language text into language-specific segments
 * Ensures each segment contains only one language
 * Ensures all characters are assigned to exactly one segment
 */
export function segment(text: string): LanguageSegment[] {
  if (text.length === 0) {
    return [];
  }

  const segments: LanguageSegment[] = [];
  let currentLanguage = detectCharLanguage(text[0]);
  let segmentStart = 0;

  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    const charLanguage = detectCharLanguage(char);

    // If language changes, create a new segment
    if (charLanguage !== currentLanguage) {
      // Save the current segment
      segments.push({
        text: text.substring(segmentStart, i),
        start: segmentStart,
        end: i,
        language: currentLanguage,
      });

      // Start a new segment
      currentLanguage = charLanguage;
      segmentStart = i;
    }
  }

  // Add the final segment
  segments.push({
    text: text.substring(segmentStart),
    start: segmentStart,
    end: text.length,
    language: currentLanguage,
  });

  return segments;
}

/**
 * Check if a specific character belongs to a given language
 */
export function isLanguage(char: string, language: Language): boolean {
  switch (language) {
    case Language.THAI:
      return isThaiChar(char);
    case Language.ENGLISH:
      return isEnglishChar(char);
    case Language.JAPANESE:
      return isJapaneseChar(char);
    case Language.UNKNOWN:
      return detectCharLanguage(char) === Language.UNKNOWN;
    default:
      return false;
  }
}

/**
 * Language Detector interface
 */
export const LanguageDetector = {
  detect,
  segment,
  isLanguage,
};
