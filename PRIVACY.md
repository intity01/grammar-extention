# Privacy Policy - Grammar Checker Extension

**Last Updated:** December 5, 2025

## Overview
This Grammar Checker Extension is designed with **privacy-first** principles. We are committed to protecting your data and being transparent about how this extension works.

## Data Collection & Storage

### What We DO:
- ✅ **Local Storage Only**: All settings and user preferences are stored locally using Chrome's `storage.sync` API
- ✅ **On-Device Processing**: Grammar checking is performed entirely on your device using built-in rules
- ✅ **No Analytics**: We do not collect usage statistics, analytics, or telemetry
- ✅ **No Tracking**: No tracking pixels, cookies, or third-party tracking services

### What We DON'T:
- ❌ **No External Servers**: Your text is never sent to our servers (we don't have any!)
- ❌ **No Third-Party Services**: No data sharing with third parties (except optional LanguageTool - see below)
- ❌ **No Personal Information**: We don't collect names, emails, IP addresses, or any identifying information
- ❌ **No Browsing History**: We don't track which websites you visit or what you type

## Permissions Explained

This extension requires the following permissions:

### 1. **storage**
- **Why:** To save your preferences (correction mode, enabled languages, ignored words)
- **Data:** Settings only, stored locally on your device

### 2. **activeTab**
- **Why:** To check grammar in text fields on the current active tab
- **Data:** Only processes visible text you're editing, never saved

### 3. **offscreen**
- **Why:** For service worker operations (required by Chrome Manifest V3)
- **Data:** No data stored or transmitted

### 4. **clipboardWrite**
- **Why:** To copy corrected text to clipboard when you click "Copy"
- **Data:** Temporary clipboard access only, not stored

### 5. **contextMenus**
- **Why:** To add right-click menu options for grammar checking
- **Data:** No data collected

### 6. **host_permissions: <all_urls>**
- **Why:** To work on any website (Gmail, Google Docs, social media, etc.)
- **Data:** Only analyzes text in active input fields, never stored or transmitted

## Optional Third-Party Integration

### LanguageTool API (Optional)
- **Status:** Disabled by default
- **What it does:** If you manually enable it and provide your own API key, text will be sent to LanguageTool's servers for advanced grammar checking
- **Your choice:** This is 100% optional. The extension works fully without it.
- **Their privacy policy:** https://languagetool.org/legal/privacy
- **Your API key:** Stored locally, never sent to us

**How to enable (if you want):**
1. Get your own API key from LanguageTool
2. Open extension popup → Settings → Enable "Use LanguageTool API"
3. Enter your API key

## How Grammar Checking Works

### Standard Mode (Default - Fully Private):
1. You type text in a text field
2. Extension reads the text locally
3. Text is analyzed using **on-device rules** (250+ built-in patterns)
4. Suggestions appear instantly
5. **No data leaves your device**

### LanguageTool Mode (Optional):
1. You enable LanguageTool and provide your API key
2. Text is sent to LanguageTool servers via HTTPS
3. Enhanced suggestions are returned
4. Subject to LanguageTool's privacy policy

## Data Retention

- **Settings:** Stored locally until you uninstall the extension or clear browser data
- **Cache:** Temporary analysis cache (max 50 items, 1-minute TTL) cleared automatically
- **Ignored words:** Stored locally, deleted when you remove them or uninstall
- **Statistics:** Local counters (errors found, corrections made) - no personal data

## Your Rights

You have complete control:
- **View data:** All data is in Chrome storage (chrome://extensions → Extension details → Storage)
- **Delete data:** Uninstall extension or clear browser data
- **Opt-out:** Disable extension per-site or globally anytime
- **No account:** No registration, login, or account required

## Security

- **Content Security Policy:** Enforced to prevent XSS attacks
- **No eval():** Code doesn't use dangerous functions
- **HTTPS only:** LanguageTool API (if used) accessed over secure connection
- **Sandboxed:** Extension runs in isolated Chrome environment

## Updates

When we update the extension:
- Your settings are preserved
- No new data collection without explicit notification
- This privacy policy will be updated if data practices change

## Transparency

- **Open Source:** [Link to repository if applicable]
- **Code review:** All code is reviewable in extension source
- **No obfuscation:** Code is readable and not minified for transparency

## Children's Privacy

This extension does not knowingly collect data from anyone, including children under 13.

## Contact

For privacy concerns or questions:
- **GitHub Issues:** [Your GitHub URL]
- **Email:** [Your contact email if applicable]

## Changes to This Policy

We will update this page if our privacy practices change. Last updated date is shown at the top.

## Summary

**TL;DR:**
- ✅ Everything runs locally on your device
- ✅ Zero tracking, zero analytics, zero data collection
- ✅ Optional LanguageTool integration (requires your consent + API key)
- ✅ You own your data, we never see it

---

*This extension respects your privacy because **we literally cannot access your data** - it never leaves your device unless you explicitly enable LanguageTool integration.*
