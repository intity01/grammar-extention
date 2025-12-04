// Grammar rule loader and compiler for the Grammar Checker Extension

import { GrammarRule, Language } from "./types";

/**
 * JSON schema for rule files
 */
export interface RuleFileSchema {
  language: Language;
  version: string;
  rules: GrammarRule[];
}

/**
 * Compiled grammar rule with cached regex pattern
 */
export interface CompiledGrammarRule extends GrammarRule {
  compiledPattern: RegExp;
}

/**
 * Cache for compiled regex patterns
 */
const regexCache = new Map<string, RegExp>();

/**
 * Load grammar rules from a JSON file
 * @param language - The language to load rules for
 * @returns Promise resolving to array of grammar rules
 */
export async function loadGrammarRules(
  language: Language,
): Promise<GrammarRule[]> {
  if (language === Language.UNKNOWN) {
    return [];
  }

  try {
    const ruleFilePath = `rules/${language}.json`;
    const response = await fetch(chrome.runtime.getURL(ruleFilePath));

    if (!response.ok) {
      console.error(
        `Failed to load rules for ${language}: ${response.statusText}`,
      );
      return [];
    }

    const ruleFile: RuleFileSchema = await response.json();

    // Validate schema
    if (!validateRuleFile(ruleFile)) {
      console.error(`Invalid rule file schema for ${language}`);
      return [];
    }

    return ruleFile.rules;
  } catch (error) {
    console.error(`Error loading grammar rules for ${language}:`, error);
    return [];
  }
}

/**
 * Validate rule file schema
 * @param ruleFile - The rule file to validate
 * @returns true if valid, false otherwise
 */
function validateRuleFile(ruleFile: any): ruleFile is RuleFileSchema {
  if (!ruleFile || typeof ruleFile !== "object") {
    return false;
  }

  if (
    !ruleFile.language ||
    !ruleFile.version ||
    !Array.isArray(ruleFile.rules)
  ) {
    return false;
  }

  // Validate each rule
  for (const rule of ruleFile.rules) {
    if (
      !rule.id ||
      !rule.language ||
      !rule.pattern ||
      !rule.errorType ||
      !rule.message ||
      !rule.correction ||
      !rule.severity ||
      typeof rule.enabled !== "boolean"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Compile a grammar rule by caching its regex pattern
 * @param rule - The grammar rule to compile
 * @returns Compiled grammar rule with cached regex
 */
export function compileGrammarRule(rule: GrammarRule): CompiledGrammarRule {
  const cacheKey = `${rule.id}:${rule.pattern}`;

  // Check if pattern is already cached
  let compiledPattern = regexCache.get(cacheKey);

  if (!compiledPattern) {
    try {
      // Compile the regex pattern with global and unicode flags
      compiledPattern = new RegExp(rule.pattern, "gu");
      regexCache.set(cacheKey, compiledPattern);
    } catch (error) {
      console.error(`Failed to compile pattern for rule ${rule.id}:`, error);
      // Fallback to a pattern that never matches
      compiledPattern = /(?!)/;
      regexCache.set(cacheKey, compiledPattern);
    }
  }

  return {
    ...rule,
    compiledPattern,
  };
}

/**
 * Compile multiple grammar rules
 * @param rules - Array of grammar rules to compile
 * @returns Array of compiled grammar rules
 */
export function compileGrammarRules(
  rules: GrammarRule[],
): CompiledGrammarRule[] {
  return rules.map(compileGrammarRule);
}

/**
 * Clear the regex cache (useful for testing or memory management)
 */
export function clearRegexCache(): void {
  regexCache.clear();
}

/**
 * Get the size of the regex cache
 * @returns Number of cached patterns
 */
export function getRegexCacheSize(): number {
  return regexCache.size;
}
