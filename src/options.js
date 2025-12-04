// Options script for Grammar Checker Extension settings

const DEFAULT_SETTINGS = {
  enabled: true,
  correctionMode: "inline",
  languages: ["th", "en", "ja"],
  debounceDelay: 300,
  performanceMode: "balanced",
};

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get("settings");
    const settings = { ...DEFAULT_SETTINGS, ...result.settings };
    
    const enabledEl = document.getElementById("enabled");
    const correctionModeEl = document.getElementById("correctionMode");
    const performanceModeEl = document.getElementById("performanceMode");
    
    if (enabledEl) enabledEl.checked = settings.enabled;
    if (correctionModeEl) correctionModeEl.value = settings.correctionMode;
    if (performanceModeEl) performanceModeEl.value = settings.performanceMode;
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

async function saveSettings() {
  try {
    const enabledEl = document.getElementById("enabled");
    const correctionModeEl = document.getElementById("correctionMode");
    const performanceModeEl = document.getElementById("performanceMode");
    
    const result = await chrome.storage.sync.get("settings");
    const current = { ...DEFAULT_SETTINGS, ...result.settings };
    
    const updated = {
      ...current,
      enabled: enabledEl?.checked ?? current.enabled,
      correctionMode: correctionModeEl?.value ?? current.correctionMode,
      performanceMode: performanceModeEl?.value ?? current.performanceMode,
    };
    
    await chrome.storage.sync.set({ settings: updated });
    
    // Notify all tabs about settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            type: "SETTINGS_UPDATED", 
            payload: updated 
          }).catch(() => {});
        }
      });
    });
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  
  const elements = ["enabled", "correctionMode", "performanceMode"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", saveSettings);
  });
});
