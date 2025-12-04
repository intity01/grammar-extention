// Grammar Checker Extension - Background Service Worker
// Handles grammar analysis, settings, and communication with content scripts

const DEBUG_MODE = false;
const log = (...args) => DEBUG_MODE && console.log(...args);
const warn = (...args) => console.warn(...args);
const error = (...args) => console.error(...args);

// Performance monitoring
const perf = {
  start: (label) => DEBUG_MODE && console.time(label),
  end: (label) => DEBUG_MODE && console.timeEnd(label)
};

log("🔧 Grammar Checker: Background script loaded!");

// Language enum
const Language = {
  THAI: "th",
  ENGLISH: "en",
  JAPANESE: "ja",
  UNKNOWN: "unknown"
};

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  correctionMode: "inline",
  autoCorrect: false,
  languages: [Language.THAI, Language.ENGLISH, Language.JAPANESE],
  debounceDelay: 300,
  performanceMode: "balanced",
  ignoredWords: [],
  disabledSites: [],
  enabledSites: [],
  siteMode: "all", // "all", "whitelist", "blacklist"
  useLanguageTool: false,
  languageToolApiKey: "",
  stats: {
    totalErrors: 0,
    totalCorrections: 0,
    errorsByType: {},
    lastReset: Date.now()
  }
};

// Extended English Grammar Rules
const ENGLISH_RULES = [
  // Articles
  {
    id: "en_001",
    pattern: "\\ba\\s+([aeiouAEIOU]\\w*)",
    errorType: "article",
    message: "Use 'an' before words starting with a vowel sound",
    correction: "an $1",
    severity: "error",
    enabled: true
  },
  {
    id: "en_002",
    pattern: "\\ban\\s+((?!hour|honest|honor|heir|herb)[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]\\w*)",
    errorType: "article",
    message: "Use 'a' before words starting with a consonant sound",
    correction: "a $1",
    severity: "error",
    enabled: true
  },
  
  // Their/There/They're
  {
    id: "en_003",
    pattern: "\\btheir\\s+is\\b",
    errorType: "spelling",
    message: "Did you mean 'there is'?",
    correction: "there is",
    severity: "error",
    enabled: true
  },
  {
    id: "en_004",
    pattern: "\\btheir\\s+are\\b",
    errorType: "spelling",
    message: "Did you mean 'there are'?",
    correction: "there are",
    severity: "error",
    enabled: true
  },
  {
    id: "en_005",
    pattern: "\\btheir\\s+was\\b",
    errorType: "spelling",
    message: "Did you mean 'there was'?",
    correction: "there was",
    severity: "error",
    enabled: true
  },
  {
    id: "en_006",
    pattern: "\\btheir\\s+were\\b",
    errorType: "spelling",
    message: "Did you mean 'there were'?",
    correction: "there were",
    severity: "error",
    enabled: true
  },
  
  // Could/Should/Would of
  {
    id: "en_007",
    pattern: "\\bcould\\s+of\\b",
    errorType: "grammar",
    message: "Use 'could have' instead of 'could of'",
    correction: "could have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_008",
    pattern: "\\bshould\\s+of\\b",
    errorType: "grammar",
    message: "Use 'should have' instead of 'should of'",
    correction: "should have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_009",
    pattern: "\\bwould\\s+of\\b",
    errorType: "grammar",
    message: "Use 'would have' instead of 'would of'",
    correction: "would have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_010",
    pattern: "\\bmight\\s+of\\b",
    errorType: "grammar",
    message: "Use 'might have' instead of 'might of'",
    correction: "might have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_011",
    pattern: "\\bmust\\s+of\\b",
    errorType: "grammar",
    message: "Use 'must have' instead of 'must of'",
    correction: "must have",
    severity: "error",
    enabled: true
  },
  
  // Subject-Verb Agreement
  {
    id: "en_012",
    pattern: "\\b(he|she|it)\\s+don't\\b",
    errorType: "subject-verb",
    message: "Use 'doesn't' with he/she/it",
    correction: "$1 doesn't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_013",
    pattern: "\\b(I|you|we|they)\\s+doesn't\\b",
    errorType: "subject-verb",
    message: "Use 'don't' with I/you/we/they",
    correction: "$1 don't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_014",
    pattern: "\\b(he|she|it)\\s+have\\s+been\\b",
    errorType: "subject-verb",
    message: "Use 'has been' with he/she/it",
    correction: "$1 has been",
    severity: "error",
    enabled: true
  },
  {
    id: "en_015",
    pattern: "\\bI\\s+has\\b",
    errorType: "subject-verb",
    message: "Use 'have' with 'I'",
    correction: "I have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_016",
    pattern: "\\b(he|she|it)\\s+were\\b",
    errorType: "subject-verb",
    message: "Use 'was' with he/she/it (except subjunctive)",
    correction: "$1 was",
    severity: "warning",
    enabled: true
  },
  {
    id: "en_017",
    pattern: "\\b(we|they|you)\\s+was\\b",
    errorType: "subject-verb",
    message: "Use 'were' with we/they/you",
    correction: "$1 were",
    severity: "error",
    enabled: true
  },
  
  // Double Negatives
  {
    id: "en_018",
    pattern: "\\bdon't\\s+have\\s+no\\b",
    errorType: "double-negative",
    message: "Avoid double negatives. Use 'don't have any'",
    correction: "don't have any",
    severity: "error",
    enabled: true
  },
  {
    id: "en_019",
    pattern: "\\bcan't\\s+find\\s+no\\b",
    errorType: "double-negative",
    message: "Avoid double negatives. Use 'can't find any'",
    correction: "can't find any",
    severity: "error",
    enabled: true
  },
  {
    id: "en_020",
    pattern: "\\bwon't\\s+get\\s+no\\b",
    errorType: "double-negative",
    message: "Avoid double negatives. Use 'won't get any'",
    correction: "won't get any",
    severity: "error",
    enabled: true
  },
  {
    id: "en_021",
    pattern: "\\bnot\\s+\\w+\\s+nothing\\b",
    errorType: "double-negative",
    message: "Avoid double negatives",
    correction: "",
    severity: "warning",
    enabled: true
  },
  
  // Common Spelling Mistakes
  {
    id: "en_022",
    pattern: "\\balot\\b",
    errorType: "spelling",
    message: "Did you mean 'a lot' (two words)?",
    correction: "a lot",
    severity: "error",
    enabled: true
  },
  {
    id: "en_023",
    pattern: "\\brecieve\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'receive'",
    correction: "receive",
    severity: "error",
    enabled: true
  },
  {
    id: "en_024",
    pattern: "\\bseperate\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'separate'",
    correction: "separate",
    severity: "error",
    enabled: true
  },
  {
    id: "en_025",
    pattern: "\\bdefinately\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'definitely'",
    correction: "definitely",
    severity: "error",
    enabled: true
  },
  {
    id: "en_026",
    pattern: "\\boccured\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'occurred'",
    correction: "occurred",
    severity: "error",
    enabled: true
  },
  {
    id: "en_027",
    pattern: "\\buntill\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'until'",
    correction: "until",
    severity: "error",
    enabled: true
  },
  {
    id: "en_028",
    pattern: "\\bwich\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'which'",
    correction: "which",
    severity: "error",
    enabled: true
  },
  {
    id: "en_029",
    pattern: "\\bthier\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'their'",
    correction: "their",
    severity: "error",
    enabled: true
  },
  {
    id: "en_030",
    pattern: "\\bbeleive\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'believe'",
    correction: "believe",
    severity: "error",
    enabled: true
  },
  {
    id: "en_031",
    pattern: "\\bweird\\b",
    errorType: "spelling",
    message: "Correct! (Common mistake: wierd)",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "en_032",
    pattern: "\\bwierd\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'weird'",
    correction: "weird",
    severity: "error",
    enabled: true
  },
  {
    id: "en_033",
    pattern: "\\baccommodate\\b",
    errorType: "spelling",
    message: "Correct! (Common mistake: accomodate)",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "en_034",
    pattern: "\\baccomodate\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'accommodate'",
    correction: "accommodate",
    severity: "error",
    enabled: true
  },
  {
    id: "en_035",
    pattern: "\\bneccessary\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'necessary'",
    correction: "necessary",
    severity: "error",
    enabled: true
  },
  {
    id: "en_036",
    pattern: "\\boccasion\\b",
    errorType: "spelling",
    message: "Correct! (Common mistake: occassion)",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "en_037",
    pattern: "\\boccassion\\b",
    errorType: "spelling",
    message: "Incorrect spelling. Use 'occasion'",
    correction: "occasion",
    severity: "error",
    enabled: true
  },
  {
    id: "en_038",
    pattern: "\\bteh\\b",
    errorType: "typo",
    message: "Typo: Did you mean 'the'?",
    correction: "the",
    severity: "error",
    enabled: true
  },
  {
    id: "en_039",
    pattern: "\\badn\\b",
    errorType: "typo",
    message: "Typo: Did you mean 'and'?",
    correction: "and",
    severity: "error",
    enabled: true
  },
  {
    id: "en_040",
    pattern: "\\btaht\\b",
    errorType: "typo",
    message: "Typo: Did you mean 'that'?",
    correction: "that",
    severity: "error",
    enabled: true
  },
  {
    id: "en_041",
    pattern: "\\bwaht\\b",
    errorType: "typo",
    message: "Typo: Did you mean 'what'?",
    correction: "what",
    severity: "error",
    enabled: true
  },
  
  // Your/You're
  {
    id: "en_042",
    pattern: "\\byour\\s+welcome\\b",
    errorType: "spelling",
    message: "Did you mean 'you're welcome'?",
    correction: "you're welcome",
    severity: "error",
    enabled: true
  },
  {
    id: "en_043",
    pattern: "\\byour\\s+(going|coming|doing|being|trying|making|taking|getting|having|looking)\\b",
    errorType: "spelling",
    message: "Did you mean 'you're' (you are)?",
    correction: "you're $1",
    severity: "error",
    enabled: true
  },
  
  // Its/It's
  {
    id: "en_044",
    pattern: "\\bits\\s+(a|the|going|not|been|too|very|quite|really)\\b",
    errorType: "spelling",
    message: "Did you mean 'it's' (it is)?",
    correction: "it's $1",
    severity: "warning",
    enabled: true
  },
  
  // Duplicate words
  {
    id: "en_045",
    pattern: "\\b(the|a|an|is|are|was|were|have|has|had|will|would|could|should|can|to|of|in|for|and|or|but|if|at|by|on|with)\\s+\\1\\b",
    errorType: "redundancy",
    message: "Duplicate word detected",
    correction: "$1",
    severity: "warning",
    enabled: true
  },
  
  // Affect/Effect
  {
    id: "en_046",
    pattern: "\\bthe\\s+affect\\b",
    errorType: "word-choice",
    message: "Did you mean 'the effect' (noun)?",
    correction: "the effect",
    severity: "warning",
    enabled: true
  },
  {
    id: "en_047",
    pattern: "\\ban\\s+affect\\b",
    errorType: "word-choice",
    message: "Did you mean 'an effect' (noun)?",
    correction: "an effect",
    severity: "warning",
    enabled: true
  },
  
  // Then/Than
  {
    id: "en_048",
    pattern: "\\bmore\\s+then\\b",
    errorType: "word-choice",
    message: "Use 'than' for comparisons",
    correction: "more than",
    severity: "error",
    enabled: true
  },
  {
    id: "en_049",
    pattern: "\\bbetter\\s+then\\b",
    errorType: "word-choice",
    message: "Use 'than' for comparisons",
    correction: "better than",
    severity: "error",
    enabled: true
  },
  {
    id: "en_050",
    pattern: "\\bworse\\s+then\\b",
    errorType: "word-choice",
    message: "Use 'than' for comparisons",
    correction: "worse than",
    severity: "error",
    enabled: true
  },
  
  // Lose/Loose
  {
    id: "en_051",
    pattern: "\\bloose\\s+(weight|money|time|hope|faith|interest|patience)\\b",
    errorType: "word-choice",
    message: "Did you mean 'lose' (verb)?",
    correction: "lose $1",
    severity: "error",
    enabled: true
  },
  
  // Who's/Whose
  {
    id: "en_052",
    pattern: "\\bwho's\\s+(car|house|book|phone|computer|idea|fault|turn)\\b",
    errorType: "word-choice",
    message: "Did you mean 'whose' (possessive)?",
    correction: "whose $1",
    severity: "error",
    enabled: true
  },
  
  // Additional common mistakes
  {
    id: "en_053",
    pattern: "\\bto\\s+much\\b",
    errorType: "spelling",
    message: "Did you mean 'too much'?",
    correction: "too much",
    severity: "error",
    enabled: true
  },
  {
    id: "en_054",
    pattern: "\\bto\\s+many\\b",
    errorType: "spelling",
    message: "Did you mean 'too many'?",
    correction: "too many",
    severity: "error",
    enabled: true
  },
  {
    id: "en_055",
    pattern: "\\bshould\\s+be\\s+able\\s+too\\b",
    errorType: "spelling",
    message: "Did you mean 'to' (infinitive)?",
    correction: "should be able to",
    severity: "error",
    enabled: true
  },
  {
    id: "en_056",
    pattern: "\\bi\\b",
    errorType: "capitalization",
    message: "The pronoun 'I' should be capitalized",
    correction: "I",
    severity: "error",
    enabled: true
  },
  {
    id: "en_057",
    pattern: "\\bdidnt\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'didn't'",
    correction: "didn't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_058",
    pattern: "\\bdont\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'don't'",
    correction: "don't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_059",
    pattern: "\\bcant\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'can't'",
    correction: "can't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_060",
    pattern: "\\bwont\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'won't'",
    correction: "won't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_061",
    pattern: "\\bim\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'I'm'",
    correction: "I'm",
    severity: "error",
    enabled: true
  },
  {
    id: "en_062",
    pattern: "\\bive\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'I've'",
    correction: "I've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_063",
    pattern: "\\bweve\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'we've'",
    correction: "we've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_064",
    pattern: "\\btheyve\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'they've'",
    correction: "they've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_065",
    pattern: "\\bwouldve\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'would've'",
    correction: "would've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_066",
    pattern: "\\bcouldve\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'could've'",
    correction: "could've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_067",
    pattern: "\\bshouldve\\b",
    errorType: "apostrophe",
    message: "Missing apostrophe in 'should've'",
    correction: "should've",
    severity: "error",
    enabled: true
  },
  {
    id: "en_068",
    pattern: "\\blet\\s+me\\s+knows?\\b",
    errorType: "grammar",
    message: "Use 'let me know' (base form after 'let')",
    correction: "let me know",
    severity: "error",
    enabled: true
  },
  {
    id: "en_069",
    pattern: "\\bmake\\s+(him|her|me|us|them)\\s+(goes|comes|does|has)\\b",
    errorType: "grammar",
    message: "Use base form after 'make someone'",
    correction: "make $1",
    severity: "error",
    enabled: true
  },
  {
    id: "en_070",
    pattern: "\\blooking\\s+forward\\s+to\\s+(meet|see|hear|receive)\\b",
    errorType: "grammar",
    message: "Use '-ing' form after 'looking forward to'",
    correction: "looking forward to $1ing",
    severity: "error",
    enabled: true
  },
  
  // More common errors
  {
    id: "en_071",
    pattern: "\\balot\\b",
    errorType: "spelling",
    message: "'alot' should be two words: 'a lot'",
    correction: "a lot",
    severity: "error",
    enabled: true
  },
  {
    id: "en_072",
    pattern: "\\binfact\\b",
    errorType: "spelling",
    message: "'infact' should be two words: 'in fact'",
    correction: "in fact",
    severity: "error",
    enabled: true
  },
  {
    id: "en_073",
    pattern: "\\bincase\\b",
    errorType: "spelling",
    message: "'incase' should be two words: 'in case'",
    correction: "in case",
    severity: "error",
    enabled: true
  },
  {
    id: "en_074",
    pattern: "\\binfont\\s+of\\b",
    errorType: "spelling",
    message: "Did you mean 'in front of'?",
    correction: "in front of",
    severity: "error",
    enabled: true
  },
  {
    id: "en_075",
    pattern: "\\b(he|she|it)\\s+don't\\b",
    errorType: "grammar",
    message: "Use 'doesn't' with he/she/it",
    correction: "$1 doesn't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_076",
    pattern: "\\b(I|we|you|they)\\s+doesn't\\b",
    errorType: "grammar",
    message: "Use 'don't' with I/we/you/they",
    correction: "$1 don't",
    severity: "error",
    enabled: true
  },
  {
    id: "en_077",
    pattern: "\\bmore\\s+better\\b",
    errorType: "grammar",
    message: "'more better' is redundant. Use 'better' or 'much better'",
    correction: "better",
    severity: "error",
    enabled: true
  },
  {
    id: "en_078",
    pattern: "\\bmost\\s+best\\b",
    errorType: "grammar",
    message: "'most best' is redundant. Use 'best'",
    correction: "best",
    severity: "error",
    enabled: true
  },
  {
    id: "en_079",
    pattern: "\\birregardless\\b",
    errorType: "grammar",
    message: "'irregardless' is non-standard. Use 'regardless'",
    correction: "regardless",
    severity: "warning",
    enabled: true
  },
  {
    id: "en_080",
    pattern: "\\bsuppose\\s+to\\b",
    errorType: "grammar",
    message: "Use 'supposed to' (with -d)",
    correction: "supposed to",
    severity: "error",
    enabled: true
  },
  {
    id: "en_081",
    pattern: "\\buse\\s+to\\b",
    errorType: "grammar",
    message: "Use 'used to' (with -d)",
    correction: "used to",
    severity: "error",
    enabled: true
  },
  {
    id: "en_082",
    pattern: "\\bwould\\s+of\\b",
    errorType: "grammar",
    message: "Use 'would have' instead of 'would of'",
    correction: "would have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_083",
    pattern: "\\bmight\\s+of\\b",
    errorType: "grammar",
    message: "Use 'might have' instead of 'might of'",
    correction: "might have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_084",
    pattern: "\\bmust\\s+of\\b",
    errorType: "grammar",
    message: "Use 'must have' instead of 'must of'",
    correction: "must have",
    severity: "error",
    enabled: true
  },
  {
    id: "en_085",
    pattern: "\\bfor\\s+sell\\b",
    errorType: "grammar",
    message: "Use 'for sale'",
    correction: "for sale",
    severity: "error",
    enabled: true
  },
  
  // Tense errors
  {
    id: "en_086",
    pattern: "\\bhave\\s+went\\b",
    errorType: "grammar",
    message: "Use past participle 'gone' with 'have'",
    correction: "have gone",
    severity: "error",
    enabled: true
  },
  {
    id: "en_087",
    pattern: "\\bhas\\s+went\\b",
    errorType: "grammar",
    message: "Use past participle 'gone' with 'has'",
    correction: "has gone",
    severity: "error",
    enabled: true
  },
  {
    id: "en_088",
    pattern: "\\bhave\\s+came\\b",
    errorType: "grammar",
    message: "Use past participle 'come' with 'have'",
    correction: "have come",
    severity: "error",
    enabled: true
  },
  {
    id: "en_089",
    pattern: "\\bhave\\s+did\\b",
    errorType: "grammar",
    message: "Use past participle 'done' with 'have'",
    correction: "have done",
    severity: "error",
    enabled: true
  },
  {
    id: "en_090",
    pattern: "\\bhave\\s+saw\\b",
    errorType: "grammar",
    message: "Use past participle 'seen' with 'have'",
    correction: "have seen",
    severity: "error",
    enabled: true
  },
  {
    id: "en_091",
    pattern: "\\bhave\\s+ate\\b",
    errorType: "grammar",
    message: "Use past participle 'eaten' with 'have'",
    correction: "have eaten",
    severity: "error",
    enabled: true
  },
  {
    id: "en_092",
    pattern: "\\bhave\\s+ran\\b",
    errorType: "grammar",
    message: "Use past participle 'run' with 'have'",
    correction: "have run",
    severity: "error",
    enabled: true
  },
  {
    id: "en_093",
    pattern: "\\bhave\\s+wrote\\b",
    errorType: "grammar",
    message: "Use past participle 'written' with 'have'",
    correction: "have written",
    severity: "error",
    enabled: true
  },
  {
    id: "en_094",
    pattern: "\\bhave\\s+spoke\\b",
    errorType: "grammar",
    message: "Use past participle 'spoken' with 'have'",
    correction: "have spoken",
    severity: "error",
    enabled: true
  },
  {
    id: "en_095",
    pattern: "\\bhave\\s+broke\\b",
    errorType: "grammar",
    message: "Use past participle 'broken' with 'have'",
    correction: "have broken",
    severity: "error",
    enabled: true
  },
  {
    id: "en_096",
    pattern: "\\bhave\\s+took\\b",
    errorType: "grammar",
    message: "Use past participle 'taken' with 'have'",
    correction: "have taken",
    severity: "error",
    enabled: true
  },
  {
    id: "en_097",
    pattern: "\\bhave\\s+drove\\b",
    errorType: "grammar",
    message: "Use past participle 'driven' with 'have'",
    correction: "have driven",
    severity: "error",
    enabled: true
  },
  {
    id: "en_098",
    pattern: "\\bhave\\s+gave\\b",
    errorType: "grammar",
    message: "Use past participle 'given' with 'have'",
    correction: "have given",
    severity: "error",
    enabled: true
  },
  
  // More common misspellings
  {
    id: "en_099",
    pattern: "\\bdefinate\\b",
    errorType: "spelling",
    message: "Correct spelling is 'definite'",
    correction: "definite",
    severity: "error",
    enabled: true
  },
  {
    id: "en_100",
    pattern: "\\bdefinately\\b",
    errorType: "spelling",
    message: "Correct spelling is 'definitely'",
    correction: "definitely",
    severity: "error",
    enabled: true
  },
  {
    id: "en_101",
    pattern: "\\bseperate\\b",
    errorType: "spelling",
    message: "Correct spelling is 'separate'",
    correction: "separate",
    severity: "error",
    enabled: true
  },
  {
    id: "en_102",
    pattern: "\\boccured\\b",
    errorType: "spelling",
    message: "Correct spelling is 'occurred'",
    correction: "occurred",
    severity: "error",
    enabled: true
  },
  {
    id: "en_103",
    pattern: "\\buntill\\b",
    errorType: "spelling",
    message: "Correct spelling is 'until'",
    correction: "until",
    severity: "error",
    enabled: true
  },
  {
    id: "en_104",
    pattern: "\\baccross\\b",
    errorType: "spelling",
    message: "Correct spelling is 'across'",
    correction: "across",
    severity: "error",
    enabled: true
  },
  {
    id: "en_105",
    pattern: "\\bbeggining\\b",
    errorType: "spelling",
    message: "Correct spelling is 'beginning'",
    correction: "beginning",
    severity: "error",
    enabled: true
  },
  {
    id: "en_106",
    pattern: "\\bbeleive\\b",
    errorType: "spelling",
    message: "Correct spelling is 'believe'",
    correction: "believe",
    severity: "error",
    enabled: true
  },
  {
    id: "en_107",
    pattern: "\\bbuisness\\b",
    errorType: "spelling",
    message: "Correct spelling is 'business'",
    correction: "business",
    severity: "error",
    enabled: true
  },
  {
    id: "en_108",
    pattern: "\\bcalender\\b",
    errorType: "spelling",
    message: "Correct spelling is 'calendar'",
    correction: "calendar",
    severity: "error",
    enabled: true
  },
  {
    id: "en_109",
    pattern: "\\bcommited\\b",
    errorType: "spelling",
    message: "Correct spelling is 'committed'",
    correction: "committed",
    severity: "error",
    enabled: true
  },
  {
    id: "en_110",
    pattern: "\\bconvinient\\b",
    errorType: "spelling",
    message: "Correct spelling is 'convenient'",
    correction: "convenient",
    severity: "error",
    enabled: true
  }
];

// Extended Thai Grammar Rules  
const THAI_RULES = [
  // Spacing errors
  {
    id: "th_001",
    pattern: "ได้\\s+รับ",
    errorType: "spacing",
    message: "'ได้รับ' ไม่ต้องเว้นวรรค",
    correction: "ได้รับ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_002",
    pattern: "เนื่อง\\s+จาก",
    errorType: "spacing",
    message: "'เนื่องจาก' ไม่ต้องเว้นวรรค",
    correction: "เนื่องจาก",
    severity: "error",
    enabled: true
  },
  {
    id: "th_003",
    pattern: "สวัสดี\\s+ครับ",
    errorType: "spacing",
    message: "'สวัสดีครับ' ไม่ต้องเว้นวรรค",
    correction: "สวัสดีครับ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_004",
    pattern: "สวัสดี\\s+ค่ะ",
    errorType: "spacing",
    message: "'สวัสดีค่ะ' ไม่ต้องเว้นวรรค",
    correction: "สวัสดีค่ะ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_005",
    pattern: "ขอบ\\s+คุณ",
    errorType: "spacing",
    message: "'ขอบคุณ' ไม่ต้องเว้นวรรค",
    correction: "ขอบคุณ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_006",
    pattern: "ประ\\s+เทศ",
    errorType: "spacing",
    message: "'ประเทศ' ไม่ต้องเว้นวรรค",
    correction: "ประเทศ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_007",
    pattern: "เพราะ\\s+ว่า",
    errorType: "spacing",
    message: "'เพราะว่า' ไม่ต้องเว้นวรรค",
    correction: "เพราะว่า",
    severity: "error",
    enabled: true
  },
  
  // Common Thai Typos
  {
    id: "th_008",
    pattern: "เเ",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แ'",
    correction: "แ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_009",
    pattern: "กะ(?!รุณา|รี|บะ|ปิ|ทิ|เพรา|ทัดรัด|ทะ|เทาะ|หรี่|โหลก|พริบ|เปาะ|ดึก)",
    errorType: "spelling",
    message: "อาจต้องการใช้ 'กับ' แทน 'กะ'",
    correction: "กับ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_010",
    pattern: "มั้ย",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'ไหม'",
    correction: "ไหม",
    severity: "info",
    enabled: true
  },
  {
    id: "th_011",
    pattern: "น่ะ(?!ครับ|ค่ะ)",
    errorType: "formal",
    message: "คำไม่เป็นทางการ อาจใช้ 'นะ' แทน",
    correction: "นะ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_012",
    pattern: "เหรอ",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'หรือ'",
    correction: "หรือ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_013",
    pattern: "อะ(?!ไร|ะไร|ะ)",
    errorType: "formal",
    message: "คำลงท้าย 'อะ' ไม่เป็นทางการ",
    correction: "",
    severity: "info",
    enabled: true
  },
  
  // Thai Grammar
  {
    id: "th_014",
    pattern: "ซึ้ง",
    errorType: "spelling",
    message: "คำนี้หมายถึง 'ซาบซึ้ง' ถ้าต้องการคำเชื่อมใช้ 'ซึ่ง'",
    correction: "ซึ่ง",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_015",
    pattern: "ลายเซ็นต์",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ลายเซ็น' (ไม่มี ต์)",
    correction: "ลายเซ็น",
    severity: "error",
    enabled: true
  },
  {
    id: "th_016",
    pattern: "เบอร์เกอร์",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'เบอร์เกอร์' หรือ 'เบอร์กเกอร์'",
    correction: "เบอร์เกอร์",
    severity: "info",
    enabled: true
  },
  {
    id: "th_017",
    pattern: "(?<=[ก-๙])คะ$",
    errorType: "spelling",
    message: "ถ้าเป็นคำลงท้ายควรใช้ 'ค่ะ' (ไม้เอก)",
    correction: "ค่ะ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_018",
    pattern: "ทำให้",
    errorType: "style",
    message: "พิจารณาใช้กริยาที่ชัดเจนกว่า เช่น 'ส่งผลให้', 'เป็นเหตุให้'",
    correction: "",
    severity: "info",
    enabled: false
  },
  
  // Additional Thai rules
  {
    id: "th_019",
    pattern: "แน่ะ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'แหนะ' หรือ 'แน่' หรือ 'นะ'",
    correction: "นะ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_020",
    pattern: "เกิ้น",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'เกิน'",
    correction: "เกิน",
    severity: "error",
    enabled: true
  },
  {
    id: "th_021",
    pattern: "เปน",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'เป็น'",
    correction: "เป็น",
    severity: "error",
    enabled: true
  },
  {
    id: "th_022",
    pattern: "เพือ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'เพื่อ'",
    correction: "เพื่อ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_023",
    pattern: "มาก\\s+ๆ",
    errorType: "spacing",
    message: "'มากๆ' ไม่ต้องเว้นวรรค",
    correction: "มากๆ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_024",
    pattern: "ดี\\s+ๆ",
    errorType: "spacing",
    message: "'ดีๆ' ไม่ต้องเว้นวรรค",
    correction: "ดีๆ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_025",
    pattern: "เยอะ\\s+ๆ",
    errorType: "spacing",
    message: "'เยอะๆ' ไม่ต้องเว้นวรรค",
    correction: "เยอะๆ",
    severity: "warning",
    enabled: true
  },
  {
    id: "th_026",
    pattern: "ครับผม",
    errorType: "redundancy",
    message: "คำซ้ำซ้อน ใช้ 'ครับ' หรือ 'ผม' อย่างเดียว",
    correction: "ครับ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_027",
    pattern: "อันที่จริงแล้ว",
    errorType: "style",
    message: "พิจารณาใช้ 'ที่จริงแล้ว' หรือ 'อันที่จริง'",
    correction: "ที่จริงแล้ว",
    severity: "info",
    enabled: false
  },
  {
    id: "th_028",
    pattern: "รึ(?!เปล่า)",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'หรือ'",
    correction: "หรือ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_029",
    pattern: "งัย",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'อย่างไร'",
    correction: "อย่างไร",
    severity: "info",
    enabled: true
  },
  {
    id: "th_030",
    pattern: "ไง",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'อย่างไร'",
    correction: "อย่างไร",
    severity: "info",
    enabled: true
  },
  
  // More common Thai typos
  {
    id: "th_031",
    pattern: "ทำมัย",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ทำไม'",
    correction: "ทำไม",
    severity: "error",
    enabled: true
  },
  {
    id: "th_032",
    pattern: "ทำไหม",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ทำไม'",
    correction: "ทำไม",
    severity: "error",
    enabled: true
  },
  {
    id: "th_033",
    pattern: "สะดวด",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'สะดวก'",
    correction: "สะดวก",
    severity: "error",
    enabled: true
  },
  {
    id: "th_034",
    pattern: "อนุญาติ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'อนุญาต'",
    correction: "อนุญาต",
    severity: "error",
    enabled: true
  },
  {
    id: "th_035",
    pattern: "ผิดหวัง",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ผิดหวัง' (ถูกแล้ว) หรือ 'ผิดพลาด'",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "th_036",
    pattern: "บังเอินญ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'บังเอิญ'",
    correction: "บังเอิญ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_037",
    pattern: "สนุ้ก",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'สนุก'",
    correction: "สนุก",
    severity: "error",
    enabled: true
  },
  {
    id: "th_038",
    pattern: "เค้า",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'เขา'",
    correction: "เขา",
    severity: "info",
    enabled: true
  },
  {
    id: "th_039",
    pattern: "ไม้",
    errorType: "context",
    message: "ตรวจสอบว่าต้องการ 'ไม่' (ปฏิเสธ) หรือ 'ไม้' (ต้นไม้)",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "th_040",
    pattern: "เเล้ว",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แล้ว'",
    correction: "แล้ว",
    severity: "error",
    enabled: true
  },
  {
    id: "th_041",
    pattern: "เเบบ",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แบบ'",
    correction: "แบบ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_042",
    pattern: "เเค่",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แค่'",
    correction: "แค่",
    severity: "error",
    enabled: true
  },
  {
    id: "th_043",
    pattern: "เเต่",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แต่'",
    correction: "แต่",
    severity: "error",
    enabled: true
  },
  {
    id: "th_044",
    pattern: "เเนะนำ",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แนะนำ'",
    correction: "แนะนำ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_045",
    pattern: "เเก้",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แก้'",
    correction: "แก้",
    severity: "error",
    enabled: true
  },
  {
    id: "th_046",
    pattern: "เเรก",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แรก'",
    correction: "แรก",
    severity: "error",
    enabled: true
  },
  {
    id: "th_047",
    pattern: "ป่าว",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'เปล่า' หรือ 'หรือเปล่า'",
    correction: "เปล่า",
    severity: "info",
    enabled: true
  },
  {
    id: "th_048",
    pattern: "เกมส์",
    errorType: "spelling",
    message: "คำที่ถูกต้องตามราชบัณฑิตคือ 'เกม'",
    correction: "เกม",
    severity: "info",
    enabled: true
  },
  {
    id: "th_049",
    pattern: "โปรเเกรม",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'โปรแกรม'",
    correction: "โปรแกรม",
    severity: "error",
    enabled: true
  },
  {
    id: "th_050",
    pattern: "สารมารถ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'สามารถ'",
    correction: "สามารถ",
    severity: "error",
    enabled: true
  },
  
  // More Thai typos and misspellings
  {
    id: "th_051",
    pattern: "เเต่",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แต่'",
    correction: "แต่",
    severity: "error",
    enabled: true
  },
  {
    id: "th_052",
    pattern: "เเม้",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แม้'",
    correction: "แม้",
    severity: "error",
    enabled: true
  },
  {
    id: "th_053",
    pattern: "เเรก",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แรก'",
    correction: "แรก",
    severity: "error",
    enabled: true
  },
  {
    id: "th_054",
    pattern: "เเพง",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แพง'",
    correction: "แพง",
    severity: "error",
    enabled: true
  },
  {
    id: "th_055",
    pattern: "เเน่",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แน่'",
    correction: "แน่",
    severity: "error",
    enabled: true
  },
  {
    id: "th_056",
    pattern: "เเบบ",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แบบ'",
    correction: "แบบ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_057",
    pattern: "เเนะนำ",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แนะนำ'",
    correction: "แนะนำ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_058",
    pattern: "เเสดง",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แสดง'",
    correction: "แสดง",
    severity: "error",
    enabled: true
  },
  {
    id: "th_059",
    pattern: "เเจ้ง",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แจ้ง'",
    correction: "แจ้ง",
    severity: "error",
    enabled: true
  },
  {
    id: "th_060",
    pattern: "เเผน",
    errorType: "typo",
    message: "พิมพ์ 'เเ' (เ สองตัว) ควรเป็น 'แผน'",
    correction: "แผน",
    severity: "error",
    enabled: true
  },
  
  // Common misspellings in Thai
  {
    id: "th_061",
    pattern: "ปะมาณ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ประมาณ'",
    correction: "ประมาณ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_062",
    pattern: "คว่าม",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ความ'",
    correction: "ความ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_063",
    pattern: "กระทั่ง",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'กระทั้ง'",
    correction: "กระทั้ง",
    severity: "error",
    enabled: true
  },
  {
    id: "th_064",
    pattern: "สะดวก",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'สดวก' หรือ 'สะดวก' (ทั้งสองถูกต้อง)",
    correction: "สะดวก",
    severity: "info",
    enabled: false
  },
  {
    id: "th_065",
    pattern: "อนุญาติ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'อนุญาต'",
    correction: "อนุญาต",
    severity: "error",
    enabled: true
  },
  {
    id: "th_066",
    pattern: "ลายเซ็นต์",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'ลายเซ็น'",
    correction: "ลายเซ็น",
    severity: "error",
    enabled: true
  },
  {
    id: "th_067",
    pattern: "คอนเสิร์ต",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'คอนเสิร์ต' หรือ 'คอนเสิร์ท'",
    correction: "คอนเสิร์ต",
    severity: "info",
    enabled: false
  },
  {
    id: "th_068",
    pattern: "โปรเจค",
    errorType: "spelling",
    message: "คำทับศัพท์ที่นิยมคือ 'โปรเจกต์'",
    correction: "โปรเจกต์",
    severity: "info",
    enabled: true
  },
  {
    id: "th_069",
    pattern: "เบอเกอร์",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'เบอร์เกอร์'",
    correction: "เบอร์เกอร์",
    severity: "error",
    enabled: true
  },
  {
    id: "th_070",
    pattern: "แอปเปิ้ล",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'แอปเปิล'",
    correction: "แอปเปิล",
    severity: "error",
    enabled: true
  },
  
  // Tone mark errors
  {
    id: "th_071",
    pattern: "สังเกตุ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'สังเกต'",
    correction: "สังเกต",
    severity: "error",
    enabled: true
  },
  {
    id: "th_072",
    pattern: "เกียรติ์",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'เกียรติ'",
    correction: "เกียรติ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_073",
    pattern: "บังเอิญ",
    errorType: "spelling",
    message: "คำที่ถูกต้องคือ 'บังเอิญ' ✓",
    correction: "บังเอิญ",
    severity: "info",
    enabled: false
  },
  {
    id: "th_074",
    pattern: "ณัฐ",
    errorType: "info",
    message: "ชื่อ 'ณัฐ' สะกดถูกต้องแล้ว",
    correction: "ณัฐ",
    severity: "info",
    enabled: false
  },
  
  // Redundant words
  {
    id: "th_075",
    pattern: "เมื่อตอน",
    errorType: "redundancy",
    message: "คำซ้ำซ้อน ใช้ 'เมื่อ' หรือ 'ตอน' อย่างใดอย่างหนึ่ง",
    correction: "เมื่อ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_076",
    pattern: "ตั้งเเต่เมื่อ",
    errorType: "redundancy",
    message: "คำซ้ำซ้อน ใช้ 'ตั้งแต่'",
    correction: "ตั้งแต่",
    severity: "info",
    enabled: true
  },
  {
    id: "th_077",
    pattern: "กลับคืนมา",
    errorType: "redundancy",
    message: "คำซ้ำซ้อน ใช้ 'กลับมา' หรือ 'คืนมา'",
    correction: "กลับมา",
    severity: "info",
    enabled: true
  },
  
  // Formal/Informal
  {
    id: "th_078",
    pattern: "เค้า",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'เขา'",
    correction: "เขา",
    severity: "info",
    enabled: true
  },
  {
    id: "th_079",
    pattern: "ป่าว",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'หรือเปล่า'",
    correction: "หรือเปล่า",
    severity: "info",
    enabled: true
  },
  {
    id: "th_080",
    pattern: "มั้ย",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'ไหม'",
    correction: "ไหม",
    severity: "info",
    enabled: true
  },
  {
    id: "th_081",
    pattern: "เหรอ",
    errorType: "formal",
    message: "คำไม่เป็นทางการ ถ้าต้องการภาษาทางการใช้ 'หรือ'",
    correction: "หรือ",
    severity: "info",
    enabled: true
  },
  {
    id: "th_082",
    pattern: "จะ\\s+ๆ",
    errorType: "formal",
    message: "คำไม่เป็นทางการ",
    correction: "เร็วๆ",
    severity: "info",
    enabled: false
  },
  
  // Common errors in loanwords
  {
    id: "th_083",
    pattern: "อีเมล์",
    errorType: "spelling",
    message: "คำทับศัพท์ราชบัณฑิตคือ 'อีเมล'",
    correction: "อีเมล",
    severity: "info",
    enabled: true
  },
  {
    id: "th_084",
    pattern: "โซเชี่ยล",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'โซเชียล'",
    correction: "โซเชียล",
    severity: "error",
    enabled: true
  },
  {
    id: "th_085",
    pattern: "เซอร์ไพรส์",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'เซอร์ไพรซ์'",
    correction: "เซอร์ไพรซ์",
    severity: "error",
    enabled: true
  },
  {
    id: "th_086",
    pattern: "ดีไซน์",
    errorType: "spelling",
    message: "คำทับศัพท์ราชบัณฑิตคือ 'ดีไซน์' ✓",
    correction: "ดีไซน์",
    severity: "info",
    enabled: false
  },
  {
    id: "th_087",
    pattern: "วีดีโอ",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'วิดีโอ'",
    correction: "วิดีโอ",
    severity: "error",
    enabled: true
  },
  {
    id: "th_088",
    pattern: "คอมพิวเตอ(?!ร์)",
    errorType: "spelling",
    message: "คำทับศัพท์ที่ถูกต้องคือ 'คอมพิวเตอร์'",
    correction: "คอมพิวเตอร์",
    severity: "error",
    enabled: true
  },
  {
    id: "th_089",
    pattern: "แอร์(?!โฮสเตส|พอร์ต)",
    errorType: "info",
    message: "คำทับศัพท์ 'แอร์' ถูกต้อง",
    correction: "แอร์",
    severity: "info",
    enabled: false
  },
  {
    id: "th_090",
    pattern: "อินเตอร์เน็ต",
    errorType: "spelling",
    message: "คำทับศัพท์ราชบัณฑิตคือ 'อินเทอร์เน็ต'",
    correction: "อินเทอร์เน็ต",
    severity: "info",
    enabled: true
  }
];

// Extended Japanese Rules
const JAPANESE_RULES = [
  {
    id: "ja_001",
    pattern: "\\s{2,}",
    errorType: "spacing",
    message: "複数のスペースが検出されました",
    correction: " ",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_002",
    pattern: "。。",
    errorType: "punctuation",
    message: "句点が重複しています",
    correction: "。",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_003",
    pattern: "、、",
    errorType: "punctuation",
    message: "読点が重複しています",
    correction: "、",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_004",
    pattern: "\\?\\?",
    errorType: "punctuation",
    message: "疑問符が重複しています",
    correction: "?",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_005",
    pattern: "!!",
    errorType: "punctuation",
    message: "感嘆符が重複しています",
    correction: "!",
    severity: "warning",
    enabled: true
  },
  
  // ら抜き言葉 (Ra-nuki kotoba) - common grammar errors
  {
    id: "ja_006",
    pattern: "見れる",
    errorType: "grammar",
    message: "「見れる」は「ら抜き言葉」です。正しくは「見られる」",
    correction: "見られる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_007",
    pattern: "食べれる",
    errorType: "grammar",
    message: "「食べれる」は「ら抜き言葉」です。正しくは「食べられる」",
    correction: "食べられる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_008",
    pattern: "起きれる",
    errorType: "grammar",
    message: "「起きれる」は「ら抜き言葉」です。正しくは「起きられる」",
    correction: "起きられる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_009",
    pattern: "寝れる",
    errorType: "grammar",
    message: "「寝れる」は「ら抜き言葉」です。正しくは「寝られる」",
    correction: "寝られる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_010",
    pattern: "出れる",
    errorType: "grammar",
    message: "「出れる」は「ら抜き言葉」です。正しくは「出られる」",
    correction: "出られる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_011",
    pattern: "来れる",
    errorType: "grammar",
    message: "「来れる」は「ら抜き言葉」です。正しくは「来られる」",
    correction: "来られる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_012",
    pattern: "着れる",
    errorType: "grammar",
    message: "「着れる」は「ら抜き言葉」です。正しくは「着られる」",
    correction: "着られる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_013",
    pattern: "開けれる",
    errorType: "grammar",
    message: "「開けれる」は「ら抜き言葉」です。正しくは「開けられる」",
    correction: "開けられる",
    severity: "warning",
    enabled: true
  },
  
  // 送り仮名 (Okurigana) errors
  {
    id: "ja_014",
    pattern: "行なう",
    errorType: "spelling",
    message: "送り仮名が不正です。正しくは「行う」",
    correction: "行う",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_015",
    pattern: "行なわ",
    errorType: "spelling",
    message: "送り仮名が不正です。正しくは「行わ」",
    correction: "行わ",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_016",
    pattern: "行なっ",
    errorType: "spelling",
    message: "送り仮名が不正です。正しくは「行っ」",
    correction: "行っ",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_017",
    pattern: "表わす",
    errorType: "spelling",
    message: "送り仮名が不正です。正しくは「表す」",
    correction: "表す",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_018",
    pattern: "著わす",
    errorType: "spelling",
    message: "送り仮名が不正です。正しくは「著す」",
    correction: "著す",
    severity: "error",
    enabled: true
  },
  
  // 二重敬語 (Double honorifics)
  {
    id: "ja_019",
    pattern: "お召し上がりになられる",
    errorType: "grammar",
    message: "二重敬語です。「召し上がる」または「お食べになる」が正しい",
    correction: "召し上がる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_020",
    pattern: "ご覧になられる",
    errorType: "grammar",
    message: "二重敬語です。「ご覧になる」が正しい",
    correction: "ご覧になる",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_021",
    pattern: "おっしゃられる",
    errorType: "grammar",
    message: "二重敬語です。「おっしゃる」が正しい",
    correction: "おっしゃる",
    severity: "warning",
    enabled: true
  },
  
  // Common typos in Japanese
  {
    id: "ja_022",
    pattern: "づつ",
    errorType: "spelling",
    message: "「ずつ」が正しい表記です（例：一人ずつ）",
    correction: "ずつ",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_023",
    pattern: "ずづ",
    errorType: "spelling",
    message: "「ずつ」が正しい表記です",
    correction: "ずつ",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_024",
    pattern: "こんにちわ",
    errorType: "spelling",
    message: "「こんにちは」が正しい表記です",
    correction: "こんにちは",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_025",
    pattern: "こんばんわ",
    errorType: "spelling",
    message: "「こんばんは」が正しい表記です",
    correction: "こんばんは",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_026",
    pattern: "すいません",
    errorType: "spelling",
    message: "正式には「すみません」が正しい",
    correction: "すみません",
    severity: "info",
    enabled: true
  },
  {
    id: "ja_027",
    pattern: "いずれか",
    errorType: "info",
    message: "「いずれか」は正しい表記です ✓",
    correction: "いずれか",
    severity: "info",
    enabled: false
  },
  
  // Particle errors
  {
    id: "ja_028",
    pattern: "私は(?=.*を.*が)",
    errorType: "grammar",
    message: "助詞の使い方を確認してください",
    correction: "",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_029",
    pattern: "をは",
    errorType: "grammar",
    message: "助詞が連続しています。「を」または「は」のいずれかを使用",
    correction: "は",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_030",
    pattern: "がが",
    errorType: "grammar",
    message: "助詞「が」が重複しています",
    correction: "が",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_031",
    pattern: "のの",
    errorType: "grammar",
    message: "助詞「の」が重複しています",
    correction: "の",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_032",
    pattern: "をを",
    errorType: "grammar",
    message: "助詞「を」が重複しています",
    correction: "を",
    severity: "error",
    enabled: true
  },
  
  // Katakana/Hiragana common mistakes
  {
    id: "ja_033",
    pattern: "シミュレーション",
    errorType: "info",
    message: "「シミュレーション」は正しい表記です ✓",
    correction: "シミュレーション",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_034",
    pattern: "シュミレーション",
    errorType: "spelling",
    message: "「シミュレーション」が正しい表記です",
    correction: "シミュレーション",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_035",
    pattern: "コミニュケーション",
    errorType: "spelling",
    message: "「コミュニケーション」が正しい表記です",
    correction: "コミュニケーション",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_036",
    pattern: "ボランティア",
    errorType: "info",
    message: "「ボランティア」は正しい表記です ✓",
    correction: "ボランティア",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_037",
    pattern: "ボランテイア",
    errorType: "spelling",
    message: "「ボランティア」が正しい表記です",
    correction: "ボランティア",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_038",
    pattern: "アボガド",
    errorType: "spelling",
    message: "「アボカド」が正しい表記です",
    correction: "アボカド",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_039",
    pattern: "バトミントン",
    errorType: "spelling",
    message: "「バドミントン」が正しい表記です",
    correction: "バドミントン",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_040",
    pattern: "ベット",
    errorType: "spelling",
    message: "「ベッド」が正しい表記です",
    correction: "ベッド",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_041",
    pattern: "ティーバック",
    errorType: "spelling",
    message: "茶葉の場合は「ティーバッグ」が正しい",
    correction: "ティーバッグ",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_042",
    pattern: "ギブス",
    errorType: "spelling",
    message: "医療用は「ギプス」が正しい表記です",
    correction: "ギプス",
    severity: "warning",
    enabled: true
  },
  
  // Common kanji mistakes
  {
    id: "ja_043",
    pattern: "確率的",
    errorType: "info",
    message: "「確率的」は正しい表記です（probability）",
    correction: "確率的",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_044",
    pattern: "確立的",
    errorType: "spelling",
    message: "「確率的」が正しい可能性があります（確立＝establish）",
    correction: "確率的",
    severity: "warning",
    enabled: true
  },
  {
    id: "ja_045",
    pattern: "意外と",
    errorType: "info",
    message: "「意外と」は正しい表記です ✓",
    correction: "意外と",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_046",
    pattern: "以外と",
    errorType: "spelling",
    message: "「意外と」が正しい表記です（以外＝except）",
    correction: "意外と",
    severity: "error",
    enabled: true
  },
  {
    id: "ja_047",
    pattern: "延々と",
    errorType: "info",
    message: "「延々と」は正しい表記です ✓",
    correction: "延々と",
    severity: "info",
    enabled: false
  },
  {
    id: "ja_048",
    pattern: "永遠と",
    errorType: "spelling",
    message: "「延々と」が正しい表記の可能性があります",
    correction: "延々と",
    severity: "warning",
    enabled: true
  },
  
  // Business Japanese
  {
    id: "ja_049",
    pattern: "了解しました",
    errorType: "style",
    message: "ビジネスでは「承知しました」がより丁寧",
    correction: "承知しました",
    severity: "info",
    enabled: true
  },
  {
    id: "ja_050",
    pattern: "なるほど",
    errorType: "style",
    message: "目上の人には「おっしゃる通りです」がより適切",
    correction: "おっしゃる通りです",
    severity: "info",
    enabled: false
  }
];

// Pre-compiled rules cache
const rulesCache = new Map();

// Analysis result cache (LRU-style)
const analysisCache = new Map();
const CACHE_MAX_SIZE = 50;
const CACHE_TTL = 60000; // 1 minute
const CACHE_CLEANUP_INTERVAL = 120000; // Clean every 2 minutes

// Periodic cache cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    log(`🧼 Cache cleanup: Removed ${cleaned} expired entries`);
  }
}, CACHE_CLEANUP_INTERVAL);

function getCachedAnalysis(text) {
  const hash = simpleHash(text);
  const cached = analysisCache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    log('📦 Using cached analysis result');
    return cached.result;
  }
  return null;
}

function setCachedAnalysis(text, result) {
  const hash = simpleHash(text);
  
  // Remove oldest (true LRU) if cache is full
  if (analysisCache.size >= CACHE_MAX_SIZE) {
    // Find oldest entry by timestamp
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of analysisCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      analysisCache.delete(oldestKey);
    }
  }
  
  analysisCache.set(hash, { result, timestamp: Date.now() });
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Connected ports for keep-alive
const connectedPorts = new Map();

// Character ranges for language detection
const THAI_RANGE = { start: 0x0E00, end: 0x0E7F };
const ENGLISH_UPPER = { start: 65, end: 90 };
const ENGLISH_LOWER = { start: 97, end: 122 };
const HIRAGANA = { start: 0x3040, end: 0x309F };
const KATAKANA = { start: 0x30A0, end: 0x30FF };
const CJK = { start: 0x4E00, end: 0x9FAF };

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

// Detect all languages in text (for mixed content)
function detectAllLanguages(text) {
  const counts = {
    [Language.THAI]: 0,
    [Language.ENGLISH]: 0,
    [Language.JAPANESE]: 0,
  };

  for (const char of text) {
    if (char.trim()) {
      const lang = detectCharLanguage(char);
      if (lang !== Language.UNKNOWN) {
        counts[lang]++;
      }
    }
  }

  // Return languages that have significant presence (>10%)
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const threshold = total * 0.1;
  
  return Object.entries(counts)
    .filter(([lang, count]) => count > threshold)
    .map(([lang]) => lang);
}

// Load grammar rules for a language
function loadRules(language) {
  if (language === Language.UNKNOWN) return [];
  
  if (rulesCache.has(language)) {
    return rulesCache.get(language);
  }

  let rules = [];
  switch (language) {
    case Language.ENGLISH:
      rules = ENGLISH_RULES;
      break;
    case Language.THAI:
      rules = THAI_RULES;
      break;
    case Language.JAPANESE:
      rules = JAPANESE_RULES;
      break;
  }

  // Compile regex patterns
  const compiledRules = rules.map(rule => ({
    ...rule,
    compiledPattern: new RegExp(rule.pattern, "gui")
  }));
  
  rulesCache.set(language, compiledRules);
  console.log(`Loaded ${compiledRules.length} rules for ${language}`);
  return compiledRules;
}

// Check if word is in ignore list
async function isIgnoredWord(word) {
  try {
    const settings = await getSettings();
    return settings.ignoredWords.includes(word.toLowerCase());
  } catch (e) {
    return false;
  }
}

// Analyze text for grammar errors
async function analyzeText(text, options = {}) {
  if (!text || text.trim().length < 3) {
    return { errors: [], language: Language.UNKNOWN };
  }
  
  // Check cache first
  const cached = getCachedAnalysis(text);
  if (cached) {
    return cached;
  }

  const settings = await getSettings();
  const primaryLanguage = detectLanguage(text);
  const allLanguages = detectAllLanguages(text);
  
  console.log(`📝 Analyzing text (${text.length} chars): Primary=${primaryLanguage}, All=[${allLanguages.join(', ')}]`);
  console.log(`📝 Text preview: "${text.substring(0, 100)}..."`);
  
  // Check if should use LanguageTool API
  if (settings.useLanguageTool && settings.languageToolApiKey) {
    try {
      const ltResult = await analyzeWithLanguageTool(text, primaryLanguage, settings.languageToolApiKey);
      if (ltResult) return ltResult;
    } catch (e) {
      console.log("LanguageTool fallback to local rules:", e);
    }
  }
  
  // Collect errors from all detected languages
  const errors = [];
  
  for (const language of allLanguages) {
    const rules = loadRules(language);
    
    for (const rule of rules) {
      if (!rule.enabled) continue;
      
      // Skip rules based on performance mode
      if (settings.performanceMode === 'fast' && rule.severity === 'info') continue;
      if (settings.performanceMode === 'fast' && rule.severity === 'warning') continue;
      
      try {
        // Reset lastIndex to prevent stale state from previous runs
        const regex = rule.compiledPattern;
        regex.lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          // Prevent infinite loop on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          // Check if matched text is in ignore list
          const matchedWord = match[0].trim().toLowerCase();
          if (settings.ignoredWords.includes(matchedWord)) {
            continue;
          }
          
          // Check for duplicate errors at same position
          const existingError = errors.find(e => 
            e.start === match.index && 
            e.end === match.index + match[0].length &&
            e.ruleId !== rule.id // Allow same position if different rule
          );
          if (existingError) {
            // Keep higher severity error
            if (rule.severity === 'error' && existingError.severity !== 'error') {
              // Replace with current error
              const idx = errors.indexOf(existingError);
              errors.splice(idx, 1);
            } else {
              continue; // Skip this error
            }
          }
          
          // Generate correction with captured groups
          let correction = rule.correction;
          if (correction && match.length > 1) {
            for (let i = 1; i < match.length; i++) {
              correction = correction.replace(`$${i}`, match[i] || '');
            }
          }
          
          errors.push({
            start: match.index,
            end: match.index + match[0].length,
            type: rule.errorType,
            message: rule.message,
            correction: correction,
            severity: rule.severity,
            ruleId: rule.id,
            matchedText: match[0],
            language: language
          });
        }
      } catch (e) {
        console.error(`Rule ${rule.id} failed:`, e);
      }
    }
  }

  // Sort errors by position
  errors.sort((a, b) => a.start - b.start);

  // Update stats
  if (errors.length > 0) {
    updateStats(errors);
  }

  console.log(`Analyzed text (${allLanguages.join(', ')}): found ${errors.length} errors`);
  
  const result = { errors, language: primaryLanguage, detectedLanguages: allLanguages };
  setCachedAnalysis(text, result);
  
  return result;
}

// LanguageTool API integration
async function analyzeWithLanguageTool(text, language, apiKey) {
  const langMap = {
    [Language.ENGLISH]: 'en-US',
    [Language.THAI]: 'th',
    [Language.JAPANESE]: 'ja'
  };
  
  const ltLang = langMap[language] || 'auto';
  
  const response = await fetch('https://api.languagetoolplus.com/v2/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text: text,
      language: ltLang,
      apiKey: apiKey
    })
  });
  
  if (!response.ok) {
    throw new Error(`LanguageTool API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data || !Array.isArray(data.matches)) {
    console.warn('Invalid LanguageTool response:', data);
    return { errors: [], language };
  }
  
  const errors = data.matches
    .filter(match => match && match.offset !== undefined && match.length)
    .map((match, idx) => ({
    start: match.offset,
    end: match.offset + match.length,
    type: match.rule.category.id,
    message: match.message,
    correction: match.replacements[0]?.value || '',
    severity: match.rule.issueType === 'typographical' ? 'warning' : 'error',
    ruleId: `lt_${match.rule.id}`,
    matchedText: text.substring(match.offset, match.offset + match.length)
  }));
  
  return { errors, language };
}

// Update statistics
async function updateStats(errors) {
  try {
    const settings = await getSettings();
    settings.stats.totalErrors += errors.length;
    
    for (const error of errors) {
      settings.stats.errorsByType[error.type] = (settings.stats.errorsByType[error.type] || 0) + 1;
    }
    
    await chrome.storage.sync.set({ settings });
  } catch (e) {
    console.error("Failed to update stats:", e);
  }
}

// Record correction
async function recordCorrection() {
  try {
    const settings = await getSettings();
    settings.stats.totalCorrections++;
    await chrome.storage.sync.set({ settings });
  } catch (e) {
    console.error("Failed to record correction:", e);
  }
}

// Add word to ignore list
async function addToIgnoreList(word) {
  try {
    // Validate input
    if (!word || typeof word !== 'string') {
      throw new Error('Invalid word');
    }
    
    const settings = await getSettings();
    const lowerWord = word.toLowerCase().trim();
    
    // Validate word length and characters to prevent abuse
    if (lowerWord.length === 0 || lowerWord.length > 100) {
      throw new Error('Word length must be between 1 and 100 characters');
    }
    
    // Prevent prototype pollution through word names
    if (lowerWord === '__proto__' || lowerWord === 'constructor' || lowerWord === 'prototype') {
      throw new Error('Invalid word name');
    }
    
    if (!settings.ignoredWords.includes(lowerWord)) {
      settings.ignoredWords.push(lowerWord);
      await chrome.storage.sync.set({ settings });
    }
    return settings;
  } catch (e) {
    throw e;
  }
}

// Remove word from ignore list
async function removeFromIgnoreList(word) {
  try {
    const settings = await getSettings();
    const lowerWord = word.toLowerCase().trim();
    settings.ignoredWords = settings.ignoredWords.filter(w => w !== lowerWord);
    await chrome.storage.sync.set({ settings });
    return settings;
  } catch (e) {
    throw e;
  }
}

// Check if site is enabled/disabled
async function isSiteEnabled(url) {
  try {
    const settings = await getSettings();
    const hostname = new URL(url).hostname;
    
    if (settings.siteMode === 'whitelist') {
      return settings.enabledSites.some(site => hostname.includes(site));
    } else if (settings.siteMode === 'blacklist') {
      return !settings.disabledSites.some(site => hostname.includes(site));
    }
    return true; // all mode
  } catch (e) {
    return true;
  }
}

// Add/Remove site from list
async function toggleSite(url, list) {
  try {
    // Validate inputs
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL');
    }
    if (!list || (list !== 'enabled' && list !== 'disabled')) {
      throw new Error('Invalid list type');
    }
    
    const settings = await getSettings();
    const hostname = new URL(url).hostname;
    
    // Validate hostname length
    if (hostname.length > 255) {
      throw new Error('Hostname too long');
    }
    
    if (list === 'enabled') {
      if (!settings.enabledSites.includes(hostname)) {
        settings.enabledSites.push(hostname);
      }
      settings.disabledSites = settings.disabledSites.filter(s => s !== hostname);
    } else {
      if (!settings.disabledSites.includes(hostname)) {
        settings.disabledSites.push(hostname);
      }
      settings.enabledSites = settings.enabledSites.filter(s => s !== hostname);
    }
    
    await chrome.storage.sync.set({ settings });
    return settings;
  } catch (e) {
    throw e;
  }
}

// Get settings from storage
async function getSettings() {
  try {
    const result = await chrome.storage.sync.get("settings");
    if (result.settings && typeof result.settings === 'object') {
      // Protect against prototype pollution
      const safeMerge = Object.assign(Object.create(null), DEFAULT_SETTINGS, result.settings);
      // Remove dangerous keys
      delete safeMerge.__proto__;
      delete safeMerge.constructor;
      delete safeMerge.prototype;
      return { ...DEFAULT_SETTINGS, ...safeMerge };
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

// Save settings to storage
async function saveSettings(settings) {
  try {
    // Validate settings object to prevent prototype pollution
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings object');
    }
    
    // Filter out dangerous keys
    const safeSettings = {};
    for (const key in settings) {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        safeSettings[key] = settings[key];
      }
    }
    
    const merged = { ...await getSettings(), ...safeSettings };
    await chrome.storage.sync.set({ settings: merged });
    return merged;
  } catch (e) {
    throw e;
  }
}

// Initialize context menu
async function setupContextMenu() {
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: "grammar-check-selection",
      title: "Check Grammar",
      contexts: ["selection"]
    });
  } catch (e) {
    // Context menu might already exist
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === "install") {
      await saveSettings(DEFAULT_SETTINGS);
      await setupContextMenu();
    } else if (details.reason === "update") {
      await setupContextMenu();
    }
  } catch (e) {
    console.error("Failed to initialize on install:", e);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    await setupContextMenu();
    await getSettings();
  } catch (e) {
    console.error("Failed to initialize on startup:", e);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "grammar-check-selection" && info.selectionText) {
    try {
      const result = await analyzeText(info.selectionText);
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: "CONTEXT_MENU_ANALYSIS",
            payload: result
          });
        } catch (sendError) {
          // Tab might be closed or extension not loaded in that tab
          console.warn('Could not send to tab:', sendError.message);
        }
      }
    } catch (e) {
      console.error("Context menu analysis failed:", e);
    }
  }
});

// Handle keep-alive connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keep-alive") {
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      connectedPorts.set(tabId, port);
      port.onDisconnect.addListener(() => {
        connectedPorts.delete(tabId);
      });
      port.postMessage({ type: "KEEP_ALIVE_ACK" });
    }
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (connectedPorts.has(tabId)) {
    connectedPorts.delete(tabId);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender is from extension (not from external pages)
  if (!sender.id || sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return true;
  }
  
  (async () => {
    try {
      // Validate message structure
      if (!message || typeof message !== 'object' || !message.type) {
        sendResponse({ success: false, error: 'Invalid message format' });
        return;
      }
      
      switch (message.type) {
        case "ANALYZE_TEXT": {
          // Validate payload
          if (!message.payload || typeof message.payload.text !== 'string') {
            sendResponse({ success: false, error: 'Invalid text payload' });
            break;
          }
          
          // Limit text length to prevent DoS
          if (message.payload.text.length > 100000) {
            sendResponse({ success: false, error: 'Text too long (max 100,000 characters)' });
            break;
          }
          
          const result = await analyzeText(message.payload.text);
          sendResponse({ success: true, result });
          break;
        }
        
        case "GET_SETTINGS": {
          const settings = await getSettings();
          sendResponse({ success: true, settings });
          break;
        }
        
        case "UPDATE_SETTINGS": {
          const settings = await saveSettings(message.payload);
          sendResponse({ success: true, settings });
          break;
        }
        
        case "GET_GRAMMAR_RULES": {
          const { language } = message.payload;
          const rules = await loadRules(language);
          sendResponse({ success: true, rules });
          break;
        }
        
        case "ADD_TO_IGNORE_LIST": {
          if (!message.payload || !message.payload.word || typeof message.payload.word !== 'string') {
            sendResponse({ success: false, error: 'Invalid word' });
            break;
          }
          const settings = await addToIgnoreList(message.payload.word);
          sendResponse({ success: true, settings });
          break;
        }
        
        case "REMOVE_FROM_IGNORE_LIST": {
          const settings = await removeFromIgnoreList(message.payload.word);
          sendResponse({ success: true, settings });
          break;
        }
        
        case "TOGGLE_SITE": {
          const settings = await toggleSite(message.payload.url, message.payload.list);
          sendResponse({ success: true, settings });
          break;
        }
        
        case "CHECK_SITE_ENABLED": {
          const enabled = await isSiteEnabled(message.payload.url);
          sendResponse({ success: true, enabled });
          break;
        }
        
        case "RECORD_CORRECTION": {
          await recordCorrection();
          sendResponse({ success: true });
          break;
        }
        
        case "GET_STATS": {
          const settings = await getSettings();
          sendResponse({ success: true, stats: settings.stats });
          break;
        }
        
        case "RESET_STATS": {
          const settings = await getSettings();
          settings.stats = {
            totalErrors: 0,
            totalCorrections: 0,
            errorsByType: {},
            lastReset: Date.now()
          };
          await chrome.storage.sync.set({ settings });
          sendResponse({ success: true, stats: settings.stats });
          break;
        }
        
        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (e) {
      sendResponse({ 
        success: false, 
        error: e instanceof Error ? e.message : String(e) 
      });
    }
  })();
  
  return true; // Keep message channel open for async response
});
