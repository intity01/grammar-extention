// Shared type definitions for the Grammar Checker Extension

export enum Language {
  THAI = 'th',
  ENGLISH = 'en',
  JAPANESE = 'ja',
  UNKNOWN = 'unknown',
}

export type CorrectionMode = 'inline' | 'clipboard';
export type PerformanceMode = 'balanced' | 'fast' | 'accurate';

export interface GrammarError {
  start: number;
  end: number;
  type: string;
  message: string;
  language: Language;
  ruleId: string;
}

export interface Correction {
  error: GrammarError;
  original: string;
  corrected: string;
  confidence: number;
}

export interface AnalysisResult {
  errors: GrammarError[];
  corrections: Correction[];
  segments: LanguageSegment[];
  processingTime: number;
}

export interface LanguageSegment {
  text: string;
  start: number;
  end: number;
  language: Language;
}

export interface ExtensionSettings {
  enabled: boolean;
  correctionMode: CorrectionMode;
  languages: Language[];
  debounceDelay: number;
  performanceMode: PerformanceMode;
}

export interface GrammarRule {
  id: string;
  language: Language;
  pattern: string;
  errorType: string;
  message: string;
  correction: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface Token {
  text: string;
  start: number;
  end: number;
  pos?: string;
  features?: string[];
}

export interface DictionaryEntry {
  word: string;
  pos: string;
  frequency?: number;
  features?: Record<string, any>;
}

export interface OffscreenMessage {
  type: 'WRITE_TO_CLIPBOARD';
  text: string;
}

export interface OffscreenResponse {
  success: boolean;
  error?: string;
}
