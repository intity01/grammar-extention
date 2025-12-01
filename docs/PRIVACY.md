# Privacy Policy for Grammar Checker Extension

**Last Updated:** December 1, 2024

## Overview

Grammar Checker Extension is a browser extension that provides real-time grammar checking for Thai (ไทย), English, and Japanese (日本語) languages. This privacy policy explains how we handle your data.

## Data Collection

**We do NOT collect any personal data.**

- ❌ No personal information is collected
- ❌ No usage analytics or telemetry
- ❌ No user accounts or authentication
- ❌ No tracking or cookies
- ❌ No data is sent to external servers

## Data Processing

**All processing happens locally in your browser.**

- ✅ All text analysis is performed locally on your device
- ✅ Grammar checking uses local dictionaries and rules
- ✅ No text content leaves your browser
- ✅ No network requests are made for grammar checking
- ✅ WebAssembly modules run entirely offline

## Data Storage

**Only local storage is used.**

- **Dictionaries:** Stored in IndexedDB for offline access
  - Thai dictionary (~2MB)
  - English dictionary (~2MB)
  - Japanese dictionary (~2MB)
- **User Settings:** Stored in chrome.storage.local
  - Correction mode preference (inline/clipboard)
  - Language preferences
  - Extension settings
- **No Cloud Storage:** Nothing is synced or stored remotely

## Permissions Justification

The extension requests the following permissions:

### `storage`
**Purpose:** Store user settings and dictionaries locally
- Saves your correction mode preference
- Caches dictionaries for offline use
- No data leaves your device

### `activeTab`
**Purpose:** Access text in the active tab for grammar checking
- Only accesses text when you use the extension
- Does not track browsing history
- Does not access other tabs

### `offscreen`
**Purpose:** Create offscreen document for clipboard access
- Required for clipboard correction mode
- Runs in isolated context
- No data is transmitted

### `clipboardWrite`
**Purpose:** Copy corrected text to clipboard
- Only used when you click "Copy corrected text"
- Does not read clipboard without permission
- Only writes when explicitly requested

### `contextMenus`
**Purpose:** Add "Check grammar" option to right-click menu
- Provides convenient access to grammar checking
- Does not track menu usage
- Optional feature

### `notifications`
**Purpose:** Show notifications for grammar check results
- Optional feature
- Can be disabled in settings
- No notification data is collected

### `host_permissions: <all_urls>`
**Purpose:** Work on any website
- Allows grammar checking on all websites
- Does not track which websites you visit
- Only processes text when activated

## Third-Party Services

**We do NOT use any third-party services.**

- ❌ No analytics services (Google Analytics, etc.)
- ❌ No error tracking services
- ❌ No advertising networks
- ❌ No AI or cloud services
- ❌ No external APIs

## Children's Privacy

This extension does not knowingly collect any information from children under 13 years of age. Since we don't collect any data at all, the extension is safe for users of all ages.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date.

## Open Source

This extension is open source. You can review the source code to verify our privacy claims:

**GitHub Repository:** https://github.com/intity01/grammar-extention

## Contact

If you have questions about this privacy policy, please:

- Open an issue on GitHub: https://github.com/intity01/grammar-extention/issues
- Email: [Your contact email]

## Summary

**In short:**
- ✅ 100% offline processing
- ✅ No data collection
- ✅ No external servers
- ✅ No tracking
- ✅ Your privacy is fully protected

---

**Privacy Policy URL:** https://intity01.github.io/grammar-extention/PRIVACY.html

This privacy policy is effective as of December 1, 2024.
