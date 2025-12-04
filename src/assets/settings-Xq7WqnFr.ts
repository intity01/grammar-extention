// Settings management using chrome.storage API

import {
  ExtensionSettings,
  Language,
  CorrectionMode,
  PerformanceMode,
} from "./types";

/**
 * Type guard to check if a value is a valid CorrectionMode
 */
function isCorrectionMode(value: any): value is CorrectionMode {
  return value === "inline" || value === "clipboard";
}

/**
 * Type guard to check if a value is a valid PerformanceMode
 */
function isPerformanceMode(value: any): value is PerformanceMode {
  return value === "balanced" || value === "fast" || value === "accurate";
}

/**
 * Type guard to check if a value is a valid Language
 */
function isLanguage(value: any): value is Language {
  return (
    value === Language.THAI ||
    value === Language.ENGLISH ||
    value === Language.JAPANESE
  );
}

/**
 * Type guard to check if a value is a valid ExtensionSettings object
 */
function isExtensionSettings(value: any): value is ExtensionSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof value.enabled === "boolean" &&
    isCorrectionMode(value.correctionMode) &&
    Array.isArray(value.languages) &&
    value.languages.every(isLanguage) &&
    typeof value.debounceDelay === "number" &&
    value.debounceDelay >= 0 &&
    isPerformanceMode(value.performanceMode)
  );
}

/**
 * Default settings for the extension
 */
const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  correctionMode: "inline",
  languages: [Language.THAI, Language.ENGLISH, Language.JAPANESE],
  debounceDelay: 300,
  performanceMode: "balanced",
};

/**
 * Get current extension settings from chrome.storage
 * Returns default settings if none are stored
 */
export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.sync.get("settings");

    if (result.settings) {
      // Validate settings with type guard
      if (isExtensionSettings(result.settings)) {
        // Merge with defaults to ensure all fields exist
        return {
          ...DEFAULT_SETTINGS,
          ...result.settings,
        };
      } else {
        console.warn("Invalid settings found in storage, using defaults");
        return DEFAULT_SETTINGS;
      }
    }

    // No settings stored yet, return defaults
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to get settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update extension settings in chrome.storage
 * Accepts partial settings and merges with existing settings
 */
export async function updateSettings(
  partialSettings: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  try {
    // Get current settings
    const currentSettings = await getSettings();

    // Merge with new settings
    const updatedSettings: ExtensionSettings = {
      ...currentSettings,
      ...partialSettings,
    };

    // Validate using type guard
    if (!isExtensionSettings(updatedSettings)) {
      throw new Error("Invalid settings: failed type validation");
    }

    // Save to storage
    await chrome.storage.sync.set({ settings: updatedSettings });

    return updatedSettings;
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<ExtensionSettings> {
  try {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to reset settings:", error);
    throw error;
  }
}

/**
 * Listen for settings changes
 */
export function onSettingsChanged(
  callback: (newSettings: ExtensionSettings) => void,
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.settings) {
      const newSettings = changes.settings.newValue as ExtensionSettings;
      callback(newSettings);
    }
  });
}

/**
 * Get default settings (useful for testing and initialization)
 */
export function getDefaultSettings(): ExtensionSettings {
  return { ...DEFAULT_SETTINGS };
}
