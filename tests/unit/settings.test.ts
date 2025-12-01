import {
  getSettings,
  updateSettings,
  resetSettings,
  getDefaultSettings,
} from '../../src/lib/settings';
import { Language } from '../../src/lib/types';

// Mock chrome.storage API
const mockStorage = {
  sync: {
    data: {} as Record<string, any>,
    get: jest.fn((keys: string | string[] | null) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage.sync.data[keys] });
      }
      return Promise.resolve(mockStorage.sync.data);
    }),
    set: jest.fn((items: Record<string, any>) => {
      Object.assign(mockStorage.sync.data, items);
      return Promise.resolve();
    }),
  },
  onChanged: {
    addListener: jest.fn(),
  },
};

// Setup global chrome mock
(global as any).chrome = {
  storage: mockStorage,
};

describe('Settings Module', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    mockStorage.sync.data = {};
    jest.clearAllMocks();
  });

  describe('getDefaultSettings', () => {
    it('should return default settings with correctionMode as inline', () => {
      const defaults = getDefaultSettings();
      
      expect(defaults.enabled).toBe(true);
      expect(defaults.correctionMode).toBe('inline');
      expect(defaults.languages).toEqual([
        Language.THAI,
        Language.ENGLISH,
        Language.JAPANESE,
      ]);
      expect(defaults.debounceDelay).toBe(300);
      expect(defaults.performanceMode).toBe('balanced');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no settings are stored', async () => {
      const settings = await getSettings();
      
      expect(settings.enabled).toBe(true);
      expect(settings.correctionMode).toBe('inline');
      expect(settings.performanceMode).toBe('balanced');
    });

    it('should return stored settings when they exist', async () => {
      // Store some settings
      mockStorage.sync.data.settings = {
        enabled: false,
        correctionMode: 'clipboard',
        languages: [Language.THAI],
        debounceDelay: 500,
        performanceMode: 'fast',
      };

      const settings = await getSettings();
      
      expect(settings.enabled).toBe(false);
      expect(settings.correctionMode).toBe('clipboard');
      expect(settings.languages).toEqual([Language.THAI]);
      expect(settings.debounceDelay).toBe(500);
      expect(settings.performanceMode).toBe('fast');
    });

    it('should merge stored settings with defaults', async () => {
      // Store partial settings
      mockStorage.sync.data.settings = {
        correctionMode: 'clipboard',
      };

      const settings = await getSettings();
      
      // Should have the stored value
      expect(settings.correctionMode).toBe('clipboard');
      // Should have default values for missing fields
      expect(settings.enabled).toBe(true);
      expect(settings.performanceMode).toBe('balanced');
    });
  });

  describe('updateSettings', () => {
    it('should update settings with partial values', async () => {
      const updatedSettings = await updateSettings({
        correctionMode: 'clipboard',
      });

      expect(updatedSettings.correctionMode).toBe('clipboard');
      expect(updatedSettings.enabled).toBe(true); // default value preserved
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          correctionMode: 'clipboard',
        }),
      });
    });

    it('should validate correctionMode values', async () => {
      await expect(
        updateSettings({ correctionMode: 'invalid' as any })
      ).rejects.toThrow('Invalid correctionMode');
    });

    it('should validate performanceMode values', async () => {
      await expect(
        updateSettings({ performanceMode: 'invalid' as any })
      ).rejects.toThrow('Invalid performanceMode');
    });

    it('should validate debounceDelay is non-negative', async () => {
      await expect(
        updateSettings({ debounceDelay: -100 })
      ).rejects.toThrow('debounceDelay must be non-negative');
    });

    it('should allow valid correctionMode values', async () => {
      const inlineSettings = await updateSettings({ correctionMode: 'inline' });
      expect(inlineSettings.correctionMode).toBe('inline');

      const clipboardSettings = await updateSettings({
        correctionMode: 'clipboard',
      });
      expect(clipboardSettings.correctionMode).toBe('clipboard');
    });

    it('should allow valid performanceMode values', async () => {
      const balancedSettings = await updateSettings({
        performanceMode: 'balanced',
      });
      expect(balancedSettings.performanceMode).toBe('balanced');

      const fastSettings = await updateSettings({ performanceMode: 'fast' });
      expect(fastSettings.performanceMode).toBe('fast');

      const accurateSettings = await updateSettings({
        performanceMode: 'accurate',
      });
      expect(accurateSettings.performanceMode).toBe('accurate');
    });

    it('should merge with existing settings', async () => {
      // Set initial settings
      await updateSettings({
        correctionMode: 'clipboard',
        performanceMode: 'fast',
      });

      // Update only one field
      const updatedSettings = await updateSettings({
        performanceMode: 'accurate',
      });

      // Should preserve previous correctionMode
      expect(updatedSettings.correctionMode).toBe('clipboard');
      // Should update performanceMode
      expect(updatedSettings.performanceMode).toBe('accurate');
    });
  });

  describe('resetSettings', () => {
    it('should reset settings to defaults', async () => {
      // Set custom settings
      await updateSettings({
        correctionMode: 'clipboard',
        performanceMode: 'fast',
        enabled: false,
      });

      // Reset
      const resetResult = await resetSettings();

      expect(resetResult.enabled).toBe(true);
      expect(resetResult.correctionMode).toBe('inline');
      expect(resetResult.performanceMode).toBe('balanced');
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          correctionMode: 'inline',
        }),
      });
    });
  });

  describe('Settings Requirements', () => {
    it('should default correctionMode to inline (Requirement 2.3)', async () => {
      const settings = await getSettings();
      expect(settings.correctionMode).toBe('inline');
    });

    it('should support both inline and clipboard correction modes (Requirement 2.2)', async () => {
      // Test inline mode
      const inlineSettings = await updateSettings({ correctionMode: 'inline' });
      expect(inlineSettings.correctionMode).toBe('inline');

      // Test clipboard mode
      const clipboardSettings = await updateSettings({
        correctionMode: 'clipboard',
      });
      expect(clipboardSettings.correctionMode).toBe('clipboard');
    });

    it('should include performanceMode setting (Requirement 2.2)', async () => {
      const settings = await getSettings();
      expect(settings.performanceMode).toBeDefined();
      expect(['balanced', 'fast', 'accurate']).toContain(
        settings.performanceMode
      );
    });
  });
});
