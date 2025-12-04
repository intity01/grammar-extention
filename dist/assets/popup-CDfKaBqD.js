// Popup script for Grammar Checker Extension settings

// Import settings functions (will be bundled by Vite)
// For now, we'll use chrome.storage directly since this is a simple popup

/**
 * Load current settings and populate the UI
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get("settings");

    // Default settings
    const defaultSettings = {
      enabled: true,
      correctionMode: "inline",
      languages: ["th", "en", "ja"],
      debounceDelay: 300,
      performanceMode: "balanced",
    };

    const settings = result.settings || defaultSettings;

    // Populate enabled toggle
    const enabledToggle = document.getElementById("enabled");
    if (enabledToggle) {
      enabledToggle.checked = settings.enabled;
    }

    // Populate correction mode
    const correctionModeSelect = document.getElementById("correctionMode");
    if (correctionModeSelect) {
      correctionModeSelect.value = settings.correctionMode;
    }

    // Populate performance mode
    const performanceModeSelect = document.getElementById("performanceMode");
    if (performanceModeSelect) {
      performanceModeSelect.value = settings.performanceMode;
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

/**
 * Save settings when changed
 */
async function saveSettings() {
  try {
    // Get current settings
    const result = await chrome.storage.sync.get("settings");
    const currentSettings = result.settings || {
      enabled: true,
      correctionMode: "inline",
      languages: ["th", "en", "ja"],
      debounceDelay: 300,
      performanceMode: "balanced",
    };

    // Get values from UI
    const enabledToggle = document.getElementById("enabled");
    const correctionModeSelect = document.getElementById("correctionMode");
    const performanceModeSelect = document.getElementById("performanceMode");

    // Update settings
    const updatedSettings = {
      ...currentSettings,
      enabled: enabledToggle.checked,
      correctionMode: correctionModeSelect.value,
      performanceMode: performanceModeSelect.value,
    };

    // Save to storage
    await chrome.storage.sync.set({ settings: updatedSettings });

    console.log("Settings saved:", updatedSettings);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

/**
 * Initialize popup
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Load current settings
  await loadSettings();

  // Add event listeners for changes
  const enabledToggle = document.getElementById("enabled");
  if (enabledToggle) {
    enabledToggle.addEventListener("change", saveSettings);
  }

  const correctionModeSelect = document.getElementById("correctionMode");
  if (correctionModeSelect) {
    correctionModeSelect.addEventListener("change", saveSettings);
  }

  const performanceModeSelect = document.getElementById("performanceMode");
  if (performanceModeSelect) {
    performanceModeSelect.addEventListener("change", saveSettings);
  }
});
