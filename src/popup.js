// Popup script for Grammar Checker Extension

const DEFAULT_SETTINGS = {
  enabled: true,
  correctionMode: "inline",
  autoCorrect: false,
  languages: ["th", "en", "ja"],
  debounceDelay: 300,
  performanceMode: "balanced",
  ignoredWords: [],
  disabledSites: [],
  enabledSites: [],
  siteMode: "all",
  useLanguageTool: false,
  languageToolApiKey: "",
  stats: {
    totalErrors: 0,
    totalCorrections: 0,
    errorsByType: {},
    lastReset: Date.now()
  }
};

let currentSettings = null;
let currentTabUrl = "";

// ============================================
// TAB NAVIGATION
// ============================================
function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get("settings");
    currentSettings = { ...DEFAULT_SETTINGS, ...result.settings };
    
    // Update UI
    document.getElementById("enabled").checked = currentSettings.enabled;
    document.getElementById("autoCorrect").checked = currentSettings.autoCorrect;
    document.getElementById("correctionMode").value = currentSettings.correctionMode;
    document.getElementById("performanceMode").value = currentSettings.performanceMode;
    document.getElementById("useLanguageTool").checked = currentSettings.useLanguageTool;
    document.getElementById("languageToolApiKey").value = currentSettings.languageToolApiKey || "";
    document.getElementById("siteMode").value = currentSettings.siteMode;
    
    updateStats();
    updateWordList();
    updateSiteLists();
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

async function saveSettings() {
  try {
    const updated = {
      ...currentSettings,
      enabled: document.getElementById("enabled").checked,
      autoCorrect: document.getElementById("autoCorrect").checked,
      correctionMode: document.getElementById("correctionMode").value,
      performanceMode: document.getElementById("performanceMode").value,
      useLanguageTool: document.getElementById("useLanguageTool").checked,
      languageToolApiKey: document.getElementById("languageToolApiKey").value,
      siteMode: document.getElementById("siteMode").value
    };
    
    currentSettings = updated;
    await chrome.storage.sync.set({ settings: updated });
    
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            type: "SETTINGS_UPDATED", 
            settings: updated 
          }).catch(() => {});
        }
      });
    });
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// ============================================
// STATS
// ============================================
function updateStats() {
  const stats = currentSettings.stats || DEFAULT_SETTINGS.stats;
  
  document.getElementById("totalErrors").textContent = stats.totalErrors || 0;
  document.getElementById("totalCorrections").textContent = stats.totalCorrections || 0;
  
  const rate = stats.totalErrors > 0 
    ? Math.round((stats.totalCorrections / stats.totalErrors) * 100) 
    : 100;
  document.getElementById("accuracy").textContent = `${rate}%`;
  
  // Error types
  const errorTypes = stats.errorsByType || {};
  const typesList = document.getElementById("errorTypesList");
  
  if (Object.keys(errorTypes).length === 0) {
    typesList.innerHTML = '<div class="list-empty">No data yet</div>';
  } else {
    const sorted = Object.entries(errorTypes).sort((a, b) => b[1] - a[1]);
    typesList.innerHTML = ''; // Clear first
    sorted.forEach(([type, count]) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      
      const typeSpan = document.createElement('span');
      typeSpan.textContent = type; // Safe from XSS
      
      const countSpan = document.createElement('span');
      countSpan.style.color = '#888';
      countSpan.style.fontWeight = '500';
      countSpan.textContent = count;
      
      item.appendChild(typeSpan);
      item.appendChild(countSpan);
      typesList.appendChild(item);
    });
  }
}

async function resetStats() {
  if (!confirm("Reset all statistics?")) return;
  
  currentSettings.stats = {
    totalErrors: 0,
    totalCorrections: 0,
    errorsByType: {},
    lastReset: Date.now()
  };
  
  await chrome.storage.sync.set({ settings: currentSettings });
  updateStats();
}

// ============================================
// DICTIONARY
// ============================================
function updateWordList() {
  const words = currentSettings.ignoredWords || [];
  const list = document.getElementById("wordList");
  
  if (words.length === 0) {
    list.innerHTML = '<div class="list-empty">No words added</div>';
  } else {
    list.innerHTML = ''; // Clear first
    words.forEach(word => {
      const item = document.createElement('div');
      item.className = 'list-item';
      
      const wordSpan = document.createElement('span');
      wordSpan.textContent = word; // Safe from XSS
      
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost';
      btn.dataset.word = word;
      btn.textContent = '✕';
      
      item.appendChild(wordSpan);
      item.appendChild(btn);
      list.appendChild(item);
    });
    
    list.querySelectorAll("[data-word]").forEach(btn => {
      btn.addEventListener("click", () => removeWord(btn.dataset.word));
    });
  }
}

async function addWord() {
  const input = document.getElementById("newWord");
  const word = input.value.trim().toLowerCase();
  
  if (!word) return;
  
  if (!currentSettings.ignoredWords.includes(word)) {
    currentSettings.ignoredWords.push(word);
    await chrome.storage.sync.set({ settings: currentSettings });
    updateWordList();
  }
  
  input.value = "";
}

async function removeWord(word) {
  currentSettings.ignoredWords = currentSettings.ignoredWords.filter(w => w !== word);
  await chrome.storage.sync.set({ settings: currentSettings });
  updateWordList();
}

// ============================================
// SITES
// ============================================
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      currentTabUrl = tab.url;
      const hostname = new URL(tab.url).hostname;
      document.getElementById("currentSiteUrl").textContent = hostname || tab.url;
    }
  } catch (e) {
    document.getElementById("currentSiteUrl").textContent = "-";
  }
}

function updateSiteLists() {
  // Enabled sites
  const enabledList = document.getElementById("enabledSitesList");
  const enabled = currentSettings.enabledSites || [];
  
  if (enabled.length === 0) {
    enabledList.innerHTML = '<div class="list-empty">None</div>';
  } else {
    enabledList.innerHTML = ''; // Clear first
    enabled.forEach(site => {
      const item = document.createElement('div');
      item.className = 'list-item';
      
      const siteSpan = document.createElement('span');
      siteSpan.textContent = site; // Safe from XSS
      
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost';
      btn.dataset.site = site;
      btn.dataset.list = 'enabled';
      btn.textContent = '✕';
      
      item.appendChild(siteSpan);
      item.appendChild(btn);
      enabledList.appendChild(item);
    });
  }
  
  // Disabled sites
  const disabledList = document.getElementById("disabledSitesList");
  const disabled = currentSettings.disabledSites || [];
  
  if (disabled.length === 0) {
    disabledList.innerHTML = '<div class="list-empty">None</div>';
  } else {
    disabledList.innerHTML = ''; // Clear first
    disabled.forEach(site => {
      const item = document.createElement('div');
      item.className = 'list-item';
      
      const siteSpan = document.createElement('span');
      siteSpan.textContent = site; // Safe from XSS
      
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost';
      btn.dataset.site = site;
      btn.dataset.list = 'disabled';
      btn.textContent = '✕';
      
      item.appendChild(siteSpan);
      item.appendChild(btn);
      disabledList.appendChild(item);
    });
  }
  }
  
  // Add remove handlers
  document.querySelectorAll("[data-site]").forEach(btn => {
    btn.addEventListener("click", () => removeSite(btn.dataset.site, btn.dataset.list));
  });
}

async function enableCurrentSite() {
  if (!currentTabUrl) return;
  
  try {
    const hostname = new URL(currentTabUrl).hostname;
    
    if (!currentSettings.enabledSites.includes(hostname)) {
      currentSettings.enabledSites.push(hostname);
    }
    currentSettings.disabledSites = currentSettings.disabledSites.filter(s => s !== hostname);
    
    await chrome.storage.sync.set({ settings: currentSettings });
    updateSiteLists();
  } catch (e) {}
}

async function disableCurrentSite() {
  if (!currentTabUrl) return;
  
  try {
    const hostname = new URL(currentTabUrl).hostname;
    
    if (!currentSettings.disabledSites.includes(hostname)) {
      currentSettings.disabledSites.push(hostname);
    }
    currentSettings.enabledSites = currentSettings.enabledSites.filter(s => s !== hostname);
    
    await chrome.storage.sync.set({ settings: currentSettings });
    updateSiteLists();
  } catch (e) {}
}

async function removeSite(site, list) {
  if (list === "enabled") {
    currentSettings.enabledSites = currentSettings.enabledSites.filter(s => s !== site);
  } else {
    currentSettings.disabledSites = currentSettings.disabledSites.filter(s => s !== site);
  }
  
  await chrome.storage.sync.set({ settings: currentSettings });
  updateSiteLists();
}

// Toggle API section visibility
function toggleApiSection() {
  const apiSection = document.getElementById("apiSection");
  const useLanguageTool = document.getElementById("useLanguageTool");
  if (apiSection && useLanguageTool) {
    apiSection.style.display = useLanguageTool.checked ? "block" : "none";
  }
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadSettings();
  await getCurrentTab();
  
  // Initial toggle state for API section
  toggleApiSection();
  
  // Settings listeners
  ["enabled", "autoCorrect", "correctionMode", "performanceMode", "useLanguageTool", "siteMode"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", saveSettings);
  });
  
  // Show/hide API section when toggle changes
  document.getElementById("useLanguageTool")?.addEventListener("change", toggleApiSection);
  
  document.getElementById("languageToolApiKey")?.addEventListener("blur", saveSettings);
  
  // Stats
  document.getElementById("resetStats")?.addEventListener("click", resetStats);
  
  // Dictionary
  document.getElementById("addWord")?.addEventListener("click", addWord);
  document.getElementById("newWord")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addWord();
  });
  
  // Sites
  document.getElementById("enableSite")?.addEventListener("click", enableCurrentSite);
  document.getElementById("disableSite")?.addEventListener("click", disableCurrentSite);
});
