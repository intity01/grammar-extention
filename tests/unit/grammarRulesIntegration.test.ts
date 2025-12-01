// Integration test to verify actual rule files can be loaded and compiled

import {
  loadGrammarRules,
  compileGrammarRules,
  RuleFileSchema,
} from '../../src/lib/grammarRules';
import { Language } from '../../src/lib/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Grammar Rules Integration', () => {
  describe('Rule File Validation', () => {
    it('should have valid Thai rule file', () => {
      const filePath = path.join(__dirname, '../../rules/thai.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      expect(ruleFile.language).toBe('th');
      expect(ruleFile.version).toBeDefined();
      expect(Array.isArray(ruleFile.rules)).toBe(true);
      expect(ruleFile.rules.length).toBeGreaterThanOrEqual(10);
      expect(ruleFile.rules.length).toBeLessThanOrEqual(15);

      // Validate each rule has required fields
      ruleFile.rules.forEach((rule) => {
        expect(rule.id).toBeDefined();
        expect(rule.language).toBe('th');
        expect(rule.pattern).toBeDefined();
        expect(rule.errorType).toBeDefined();
        expect(rule.message).toBeDefined();
        expect(rule.correction).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(typeof rule.enabled).toBe('boolean');
      });
    });

    it('should have valid English rule file', () => {
      const filePath = path.join(__dirname, '../../rules/english.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      expect(ruleFile.language).toBe('en');
      expect(ruleFile.version).toBeDefined();
      expect(Array.isArray(ruleFile.rules)).toBe(true);
      expect(ruleFile.rules.length).toBeGreaterThanOrEqual(15);
      expect(ruleFile.rules.length).toBeLessThanOrEqual(20);

      // Validate each rule has required fields
      ruleFile.rules.forEach((rule) => {
        expect(rule.id).toBeDefined();
        expect(rule.language).toBe('en');
        expect(rule.pattern).toBeDefined();
        expect(rule.errorType).toBeDefined();
        expect(rule.message).toBeDefined();
        expect(rule.correction).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(typeof rule.enabled).toBe('boolean');
      });
    });

    it('should have valid Japanese rule file', () => {
      const filePath = path.join(__dirname, '../../rules/japanese.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      expect(ruleFile.language).toBe('ja');
      expect(ruleFile.version).toBeDefined();
      expect(Array.isArray(ruleFile.rules)).toBe(true);
      expect(ruleFile.rules.length).toBeGreaterThanOrEqual(10);
      expect(ruleFile.rules.length).toBeLessThanOrEqual(15);

      // Validate each rule has required fields
      ruleFile.rules.forEach((rule) => {
        expect(rule.id).toBeDefined();
        expect(rule.language).toBe('ja');
        expect(rule.pattern).toBeDefined();
        expect(rule.errorType).toBeDefined();
        expect(rule.message).toBeDefined();
        expect(rule.correction).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(typeof rule.enabled).toBe('boolean');
      });
    });
  });

  describe('Rule Compilation', () => {
    it('should compile all Thai rules without errors', () => {
      const filePath = path.join(__dirname, '../../rules/thai.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);

      expect(compiled.length).toBe(ruleFile.rules.length);
      compiled.forEach((rule) => {
        expect(rule.compiledPattern).toBeInstanceOf(RegExp);
      });
    });

    it('should compile all English rules without errors', () => {
      const filePath = path.join(__dirname, '../../rules/english.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);

      expect(compiled.length).toBe(ruleFile.rules.length);
      compiled.forEach((rule) => {
        expect(rule.compiledPattern).toBeInstanceOf(RegExp);
      });
    });

    it('should compile all Japanese rules without errors', () => {
      const filePath = path.join(__dirname, '../../rules/japanese.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);

      expect(compiled.length).toBe(ruleFile.rules.length);
      compiled.forEach((rule) => {
        expect(rule.compiledPattern).toBeInstanceOf(RegExp);
      });
    });
  });

  describe('Rule Pattern Matching', () => {
    it('should match Thai spacing errors', () => {
      const filePath = path.join(__dirname, '../../rules/thai.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);
      const spacingRule = compiled.find((r) => r.id === 'th_002');

      expect(spacingRule).toBeDefined();
      expect(spacingRule!.compiledPattern.test('ได้ รับ')).toBe(true);
      expect(spacingRule!.compiledPattern.test('ได้รับ')).toBe(false);
    });

    it('should match English article errors', () => {
      const filePath = path.join(__dirname, '../../rules/english.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);
      const articleRule = compiled.find((r) => r.id === 'en_001');

      expect(articleRule).toBeDefined();
      expect(articleRule!.compiledPattern.test('a apple')).toBe(true);
      expect(articleRule!.compiledPattern.test('an apple')).toBe(false);
    });

    it('should match Japanese particle errors', () => {
      const filePath = path.join(__dirname, '../../rules/japanese.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const ruleFile: RuleFileSchema = JSON.parse(content);

      const compiled = compileGrammarRules(ruleFile.rules);
      const particleRule = compiled.find((r) => r.id === 'ja_002');

      expect(particleRule).toBeDefined();
      expect(particleRule!.compiledPattern.test('を を')).toBe(true);
      expect(particleRule!.compiledPattern.test('を')).toBe(false);
    });
  });
});
