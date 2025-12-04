// Unit tests for grammar rule loader and compiler

import {
  loadGrammarRules,
  compileGrammarRule,
  compileGrammarRules,
  clearRegexCache,
  getRegexCacheSize,
  RuleFileSchema,
} from "../../src/lib/grammarRules";
import { GrammarRule, Language } from "../../src/lib/types";

// Mock chrome.runtime.getURL
global.chrome = {
  runtime: {
    getURL: (path: string) => `chrome-extension://test/${path}`,
  },
} as any;

// Mock fetch
global.fetch = jest.fn();

describe("Grammar Rules", () => {
  beforeEach(() => {
    clearRegexCache();
    jest.clearAllMocks();
  });

  describe("compileGrammarRule", () => {
    it("should compile a grammar rule with regex pattern", () => {
      const rule: GrammarRule = {
        id: "test_001",
        language: Language.ENGLISH,
        pattern: "\\btest\\b",
        errorType: "test",
        message: "Test message",
        correction: "corrected",
        severity: "error",
        enabled: true,
      };

      const compiled = compileGrammarRule(rule);

      expect(compiled).toHaveProperty("compiledPattern");
      expect(compiled.compiledPattern).toBeInstanceOf(RegExp);
      expect(compiled.compiledPattern.test("test")).toBe(true);
      expect(compiled.compiledPattern.test("testing")).toBe(false);
    });

    it("should cache compiled regex patterns", () => {
      const rule: GrammarRule = {
        id: "test_001",
        language: Language.ENGLISH,
        pattern: "\\btest\\b",
        errorType: "test",
        message: "Test message",
        correction: "corrected",
        severity: "error",
        enabled: true,
      };

      expect(getRegexCacheSize()).toBe(0);

      compileGrammarRule(rule);
      expect(getRegexCacheSize()).toBe(1);

      // Compile again - should use cache
      compileGrammarRule(rule);
      expect(getRegexCacheSize()).toBe(1);
    });

    it("should handle invalid regex patterns gracefully", () => {
      const rule: GrammarRule = {
        id: "test_002",
        language: Language.ENGLISH,
        pattern: "[invalid(regex",
        errorType: "test",
        message: "Test message",
        correction: "corrected",
        severity: "error",
        enabled: true,
      };

      const compiled = compileGrammarRule(rule);

      expect(compiled).toHaveProperty("compiledPattern");
      expect(compiled.compiledPattern).toBeInstanceOf(RegExp);
      // Should create a pattern that never matches
      expect(compiled.compiledPattern.test("anything")).toBe(false);
    });
  });

  describe("compileGrammarRules", () => {
    it("should compile multiple grammar rules", () => {
      const rules: GrammarRule[] = [
        {
          id: "test_001",
          language: Language.ENGLISH,
          pattern: "\\btest1\\b",
          errorType: "test",
          message: "Test message 1",
          correction: "corrected1",
          severity: "error",
          enabled: true,
        },
        {
          id: "test_002",
          language: Language.ENGLISH,
          pattern: "\\btest2\\b",
          errorType: "test",
          message: "Test message 2",
          correction: "corrected2",
          severity: "warning",
          enabled: true,
        },
      ];

      const compiled = compileGrammarRules(rules);

      expect(compiled).toHaveLength(2);
      expect(compiled[0]).toHaveProperty("compiledPattern");
      expect(compiled[1]).toHaveProperty("compiledPattern");
      expect(compiled[0].compiledPattern.test("test1")).toBe(true);
      expect(compiled[1].compiledPattern.test("test2")).toBe(true);
    });
  });

  describe("loadGrammarRules", () => {
    it("should return empty array for UNKNOWN language", async () => {
      const rules = await loadGrammarRules(Language.UNKNOWN);
      expect(rules).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should load grammar rules from JSON file", async () => {
      const mockRuleFile: RuleFileSchema = {
        language: Language.ENGLISH,
        version: "1.0.0",
        rules: [
          {
            id: "en_001",
            language: Language.ENGLISH,
            pattern: "\\btest\\b",
            errorType: "test",
            message: "Test message",
            correction: "corrected",
            severity: "error",
            enabled: true,
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRuleFile,
      });

      const rules = await loadGrammarRules(Language.ENGLISH);

      expect(fetch).toHaveBeenCalledWith(
        "chrome-extension://test/rules/en.json",
      );
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe("en_001");
    });

    it("should return empty array on fetch error", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      const rules = await loadGrammarRules(Language.ENGLISH);

      expect(rules).toEqual([]);
    });

    it("should return empty array on invalid schema", async () => {
      const invalidRuleFile = {
        language: Language.ENGLISH,
        // Missing version and rules
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => invalidRuleFile,
      });

      const rules = await loadGrammarRules(Language.ENGLISH);

      expect(rules).toEqual([]);
    });

    it("should handle JSON parse errors", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const rules = await loadGrammarRules(Language.ENGLISH);

      expect(rules).toEqual([]);
    });
  });

  describe("clearRegexCache", () => {
    it("should clear the regex cache", () => {
      const rule: GrammarRule = {
        id: "test_001",
        language: Language.ENGLISH,
        pattern: "\\btest\\b",
        errorType: "test",
        message: "Test message",
        correction: "corrected",
        severity: "error",
        enabled: true,
      };

      compileGrammarRule(rule);
      expect(getRegexCacheSize()).toBe(1);

      clearRegexCache();
      expect(getRegexCacheSize()).toBe(0);
    });
  });
});
