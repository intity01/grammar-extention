// Settings management using chrome.storage API

import { ExtensionSettings, Language } from "./types";

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
      // Merge with defaults to ensure all fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...result.settings,
      };
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

    // Validate correctionMode
    if (
      updatedSettings.correctionMode !== "inline" &&
      updatedSettings.correctionMode !== "clipboard"
    ) {
      throw new Error(
        `Invalid correctionMode: ${updatedSettings.correctionMode}`,
      );
    }

    // Validate performanceMode
    if (
      updatedSettings.performanceMode !== "balanced" &&
      updatedSettings.performanceMode !== "fast" &&
      updatedSettings.performanceMode !== "accurate"
    ) {
      throw new Error(
        `Invalid performanceMode: ${updatedSettings.performanceMode}`,
      );
    }

    // Validate debounceDelay
    if (updatedSettings.debounceDelay < 0) {
      throw new Error("debounceDelay must be non-negative");
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
