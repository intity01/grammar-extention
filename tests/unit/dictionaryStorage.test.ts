// Unit tests for dictionary storage

import { Language } from '../../src/lib/types';
import {
  dictionaryStorage,
  DictionaryEntry,
  hydrateDictionaries,
  loadDictionaryData,
} from '../../src/lib/dictionaryStorage';

describe('DictionaryStorage', () => {
  beforeEach(async () => {
    // Clear all dictionaries before each test
    await dictionaryStorage.init();
    await dictionaryStorage.clearAll();
  });

  afterAll(() => {
    dictionaryStorage.close();
  });

  describe('Basic Operations', () => {
    it('should store and load a dictionary', async () => {
      const testData = new ArrayBuffer(100);
      const entry: DictionaryEntry = {
        language: Language.ENGLISH,
        version: '1.0.0',
        data: testData,
        metadata: {
          language: Language.ENGLISH,
          version: '1.0.0',
          size: testData.byteLength,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(entry);
      const loaded = await dictionaryStorage.loadDictionary(Language.ENGLISH);

      expect(loaded).not.toBeNull();
      expect(loaded?.language).toBe(Language.ENGLISH);
      expect(loaded?.version).toBe('1.0.0');
      expect(loaded?.data).toBeDefined();
    });

    it('should return null for non-existent dictionary', async () => {
      const loaded = await dictionaryStorage.loadDictionary(Language.THAI);
      expect(loaded).toBeNull();
    });

    it('should check if dictionary exists', async () => {
      const testData = new ArrayBuffer(50);
      const entry: DictionaryEntry = {
        language: Language.JAPANESE,
        version: '1.0.0',
        data: testData,
        metadata: {
          language: Language.JAPANESE,
          version: '1.0.0',
          size: testData.byteLength,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(entry);

      const exists = await dictionaryStorage.hasDictionary(Language.JAPANESE);
      const notExists = await dictionaryStorage.hasDictionary(Language.THAI);

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should delete a dictionary', async () => {
      const testData = new ArrayBuffer(50);
      const entry: DictionaryEntry = {
        language: Language.ENGLISH,
        version: '1.0.0',
        data: testData,
        metadata: {
          language: Language.ENGLISH,
          version: '1.0.0',
          size: testData.byteLength,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(entry);
      expect(await dictionaryStorage.hasDictionary(Language.ENGLISH)).toBe(true);

      await dictionaryStorage.deleteDictionary(Language.ENGLISH);
      expect(await dictionaryStorage.hasDictionary(Language.ENGLISH)).toBe(false);
    });
  });

  describe('Metadata Operations', () => {
    it('should get dictionary metadata', async () => {
      const testData = new ArrayBuffer(200);
      const timestamp = Date.now();
      const entry: DictionaryEntry = {
        language: Language.THAI,
        version: '2.0.0',
        data: testData,
        metadata: {
          language: Language.THAI,
          version: '2.0.0',
          size: testData.byteLength,
          lastUpdated: timestamp,
        },
      };

      await dictionaryStorage.storeDictionary(entry);
      const metadata = await dictionaryStorage.getDictionaryMetadata(Language.THAI);

      expect(metadata).not.toBeNull();
      expect(metadata?.language).toBe(Language.THAI);
      expect(metadata?.version).toBe('2.0.0');
      expect(metadata?.size).toBe(200);
      expect(metadata?.lastUpdated).toBe(timestamp);
    });

    it('should list all dictionaries', async () => {
      const entries: DictionaryEntry[] = [
        {
          language: Language.ENGLISH,
          version: '1.0.0',
          data: new ArrayBuffer(100),
          metadata: {
            language: Language.ENGLISH,
            version: '1.0.0',
            size: 100,
            lastUpdated: Date.now(),
          },
        },
        {
          language: Language.THAI,
          version: '1.0.0',
          data: new ArrayBuffer(200),
          metadata: {
            language: Language.THAI,
            version: '1.0.0',
            size: 200,
            lastUpdated: Date.now(),
          },
        },
      ];

      for (const entry of entries) {
        await dictionaryStorage.storeDictionary(entry);
      }

      const list = await dictionaryStorage.listDictionaries();

      expect(list).toHaveLength(2);
      expect(list.map((m) => m.language)).toContain(Language.ENGLISH);
      expect(list.map((m) => m.language)).toContain(Language.THAI);
    });
  });

  describe('Clear Operations', () => {
    it('should clear all dictionaries', async () => {
      const entries: DictionaryEntry[] = [
        {
          language: Language.ENGLISH,
          version: '1.0.0',
          data: new ArrayBuffer(100),
          metadata: {
            language: Language.ENGLISH,
            version: '1.0.0',
            size: 100,
            lastUpdated: Date.now(),
          },
        },
        {
          language: Language.THAI,
          version: '1.0.0',
          data: new ArrayBuffer(200),
          metadata: {
            language: Language.THAI,
            version: '1.0.0',
            size: 200,
            lastUpdated: Date.now(),
          },
        },
      ];

      for (const entry of entries) {
        await dictionaryStorage.storeDictionary(entry);
      }

      expect((await dictionaryStorage.listDictionaries()).length).toBe(2);

      await dictionaryStorage.clearAll();

      expect((await dictionaryStorage.listDictionaries()).length).toBe(0);
    });
  });

  describe('Version Management', () => {
    it('should update dictionary version', async () => {
      const oldEntry: DictionaryEntry = {
        language: Language.ENGLISH,
        version: '1.0.0',
        data: new ArrayBuffer(100),
        metadata: {
          language: Language.ENGLISH,
          version: '1.0.0',
          size: 100,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(oldEntry);

      const newEntry: DictionaryEntry = {
        language: Language.ENGLISH,
        version: '2.0.0',
        data: new ArrayBuffer(150),
        metadata: {
          language: Language.ENGLISH,
          version: '2.0.0',
          size: 150,
          lastUpdated: Date.now(),
        },
      };

      await dictionaryStorage.storeDictionary(newEntry);

      const loaded = await dictionaryStorage.loadDictionary(Language.ENGLISH);
      expect(loaded?.version).toBe('2.0.0');
      expect(loaded?.data).toBeDefined();
    });
  });
});
