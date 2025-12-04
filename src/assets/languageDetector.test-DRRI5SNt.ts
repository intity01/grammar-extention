import { LanguageDetector } from "../../src/lib/languageDetector";
import { Language } from "../../src/lib/types";

describe("LanguageDetector", () => {
  describe("detect", () => {
    it("should detect Thai language", () => {
      const text = "สวัสดี";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.THAI);
      expect(languages).toHaveLength(1);
    });

    it("should detect English language", () => {
      const text = "Hello World";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.ENGLISH);
      expect(languages).toHaveLength(1);
    });

    it("should detect Japanese language (Hiragana)", () => {
      const text = "こんにちは";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.JAPANESE);
      expect(languages).toHaveLength(1);
    });

    it("should detect Japanese language (Katakana)", () => {
      const text = "カタカナ";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.JAPANESE);
      expect(languages).toHaveLength(1);
    });

    it("should detect Japanese language (Kanji)", () => {
      const text = "日本語";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.JAPANESE);
      expect(languages).toHaveLength(1);
    });

    it("should detect multiple languages in mixed text", () => {
      const text = "Hello สวัสดี こんにちは";
      const languages = LanguageDetector.detect(text);
      expect(languages).toContain(Language.ENGLISH);
      expect(languages).toContain(Language.THAI);
      expect(languages).toContain(Language.JAPANESE);
      expect(languages).toHaveLength(3);
    });

    it("should return empty array for text with only unknown characters", () => {
      const text = "123 !@# 😀";
      const languages = LanguageDetector.detect(text);
      expect(languages).toHaveLength(0);
    });

    it("should handle empty string", () => {
      const text = "";
      const languages = LanguageDetector.detect(text);
      expect(languages).toHaveLength(0);
    });
  });

  describe("segment", () => {
    it("should segment single language text (spaces are UNKNOWN)", () => {
      const text = "Hello";
      const segments = LanguageDetector.segment(text);
      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({
        text: "Hello",
        start: 0,
        end: 5,
        language: Language.ENGLISH,
      });
    });

    it("should segment mixed Thai and English text", () => {
      const text = "Helloสวัสดี";
      const segments = LanguageDetector.segment(text);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({
        text: "Hello",
        start: 0,
        end: 5,
        language: Language.ENGLISH,
      });
      expect(segments[1]).toEqual({
        text: "สวัสดี",
        start: 5,
        end: 11,
        language: Language.THAI,
      });
    });

    it("should segment mixed English, Thai, and Japanese text", () => {
      const text = "Helloสวัสดีこんにちは";
      const segments = LanguageDetector.segment(text);
      expect(segments).toHaveLength(3);
      expect(segments[0].language).toBe(Language.ENGLISH);
      expect(segments[1].language).toBe(Language.THAI);
      expect(segments[2].language).toBe(Language.JAPANESE);
    });

    it("should assign all characters to exactly one segment", () => {
      const text = "Hello สวัสดี こんにちは World";
      const segments = LanguageDetector.segment(text);

      // Verify no gaps or overlaps
      let totalLength = 0;
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        expect(segment.end - segment.start).toBe(segment.text.length);
        totalLength += segment.text.length;

        if (i > 0) {
          // Verify segments are contiguous
          expect(segment.start).toBe(segments[i - 1].end);
        }
      }

      expect(totalLength).toBe(text.length);
    });

    it("should handle empty string", () => {
      const text = "";
      const segments = LanguageDetector.segment(text);
      expect(segments).toHaveLength(0);
    });

    it("should handle text with unknown characters", () => {
      const text = "Hello123สวัสดี";
      const segments = LanguageDetector.segment(text);
      expect(segments.length).toBeGreaterThan(0);

      // Verify all characters are assigned
      const totalChars = segments.reduce(
        (sum, seg) => sum + seg.text.length,
        0,
      );
      expect(totalChars).toBe(text.length);
    });
  });

  describe("isLanguage", () => {
    it("should correctly identify Thai characters", () => {
      expect(LanguageDetector.isLanguage("ส", Language.THAI)).toBe(true);
      expect(LanguageDetector.isLanguage("ว", Language.THAI)).toBe(true);
      expect(LanguageDetector.isLanguage("H", Language.THAI)).toBe(false);
    });

    it("should correctly identify English characters", () => {
      expect(LanguageDetector.isLanguage("H", Language.ENGLISH)).toBe(true);
      expect(LanguageDetector.isLanguage("z", Language.ENGLISH)).toBe(true);
      expect(LanguageDetector.isLanguage("ส", Language.ENGLISH)).toBe(false);
    });

    it("should correctly identify Japanese characters", () => {
      expect(LanguageDetector.isLanguage("こ", Language.JAPANESE)).toBe(true);
      expect(LanguageDetector.isLanguage("カ", Language.JAPANESE)).toBe(true);
      expect(LanguageDetector.isLanguage("日", Language.JAPANESE)).toBe(true);
      expect(LanguageDetector.isLanguage("H", Language.JAPANESE)).toBe(false);
    });

    it("should correctly identify unknown characters", () => {
      expect(LanguageDetector.isLanguage("1", Language.UNKNOWN)).toBe(true);
      expect(LanguageDetector.isLanguage(" ", Language.UNKNOWN)).toBe(true);
      expect(LanguageDetector.isLanguage("!", Language.UNKNOWN)).toBe(true);
      expect(LanguageDetector.isLanguage("H", Language.UNKNOWN)).toBe(false);
    });
  });
});
