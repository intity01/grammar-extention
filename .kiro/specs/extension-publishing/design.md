# Design Document

## Overview

Extension Publishing Preparation เป็นกระบวนการเตรียมความพร้อม Grammar Checker Extension สำหรับการเผยแพร่บน Chrome Web Store และ Microsoft Edge Add-ons โดยครอบคลุมการสร้าง promotional materials, privacy policy, store listing content, packaging, และการตรวจสอบคุณภาพก่อน submission

## Architecture

### Publishing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  Publishing Preparation                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Create Promotional Materials                             │
│     ├── Screenshots (5+)                                     │
│     ├── Icons (128x128, 440x280, 1400x560)                  │
│     └── Demo Video (30-60s)                                  │
│                                                               │
│  2. Write Documentation                                      │
│     ├── Privacy Policy                                       │
│     ├── Store Listing (name, description, keywords)         │
│     ├── README                                               │
│     └── Release Notes                                        │
│                                                               │
│  3. Package Extension                                        │
│     ├── Build production version                            │
│     ├── Create .zip package                                 │
│     └── Verify manifest.json                                │
│                                                               │
│  4. Quality Assurance                                        │
│     ├── Run automated tests                                 │
│     ├── Manual testing on websites                          │
│     ├── Performance check                                   │
│     └── Cross-browser testing                               │
│                                                               │
│  5. Submit to Stores                                         │
│     ├── Chrome Web Store Developer Dashboard                │
│     └── Microsoft Edge Add-ons Developer Dashboard          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Screenshot Generator

**Responsibilities:**
- Capture screenshots of extension in action
- Demonstrate key features visually
- Show grammar checking for all three languages

**Screenshots to Create:**
1. Thai grammar checking in action (textarea)
2. English grammar checking in Gmail
3. Japanese grammar checking in contenteditable
4. Settings panel showing correction modes
5. Error highlighting with correction suggestions
6. Clipboard mode demonstration
7. Context menu integration

**Tools:**
- Browser DevTools for capturing
- Image editor for annotations
- Screen recording software for demo video

### 2. Icon and Tile Generator

**Responsibilities:**
- Create promotional images in required sizes
- Maintain consistent branding
- Follow store guidelines

**Required Images:**
- **Icon 128x128**: Main extension icon
- **Small Tile 440x280**: Store listing tile
- **Marquee 1400x560**: Featured placement banner

**Design Guidelines:**
- Use extension's brand colors
- Include recognizable grammar/language symbols
- Keep design clean and professional
- Ensure readability at all sizes

### 3. Privacy Policy Writer

**Responsibilities:**
- Document data handling practices
- Ensure compliance with store policies
- Provide transparency to users

**Content Structure:**
```markdown
# Privacy Policy for Grammar Checker Extension

## Data Collection
- No personal data is collected
- No usage analytics or telemetry
- No user accounts or authentication

## Data Processing
- All text analysis is performed locally in the browser
- No data is sent to external servers
- No network requests are made

## Data Storage
- Dictionaries are stored in IndexedDB (local only)
- User settings are stored in chrome.storage.local
- No data leaves the user's device

## Permissions Justification
- storage: Store user settings and dictionaries locally
- activeTab: Access text in active tab for grammar checking
- offscreen: Create offscreen document for clipboard access
- clipboardWrite: Copy corrected text to clipboard
- contextMenus: Add grammar check option to right-click menu

## Contact
[Your contact information]

Last Updated: [Date]
```

### 4. Store Listing Content

**Responsibilities:**
- Write compelling copy that attracts users
- Optimize for search (SEO/ASO)
- Clearly communicate value proposition

**Content Elements:**

**Name (45 chars max):**
```
Grammar Checker: Thai, English, Japanese
```

**Short Description (132 chars max):**
```
Check grammar in Thai, English & Japanese. Works offline. No AI. Privacy-focused. Instant corrections as you type.
```

**Detailed Description:**
```markdown
# Grammar Checker Extension

Check your grammar in Thai (ไทย), English, and Japanese (日本語) as you type - completely offline and private!

## ✨ Key Features

### 🌍 Multi-Language Support
- **Thai**: ตรวจสอบไวยากรณ์ภาษาไทย รองรับการตัดคำและกฎไวยากรณ์
- **English**: Grammar and spelling checks with intelligent suggestions
- **Japanese**: 日本語の文法チェック with morphological analysis

### 🔒 Privacy First
- **100% Offline**: All processing happens locally in your browser
- **No Data Collection**: We don't collect, store, or transmit your text
- **No AI/Cloud**: Rule-based checking without external servers

### ⚡ Fast & Efficient
- **Real-time Checking**: See errors as you type with 50ms response time
- **Lightweight**: Uses <50MB memory with optimized dictionaries
- **Non-blocking**: Doesn't slow down your typing

### 🎯 Smart Correction Modes
- **Inline Mode**: Automatically fix errors in place
- **Clipboard Mode**: Copy corrected text to clipboard

### 🌐 Works Everywhere
- Gmail, Google Docs, Twitter, Facebook
- Any textarea, input field, or contenteditable element
- Chrome and Edge browsers

## 🚀 How It Works

1. Install the extension
2. Start typing in any text field
3. Errors are highlighted automatically
4. Click to see suggestions and apply corrections

## 🔧 Technology

- WebAssembly for high-performance text processing
- Double-Array Trie for efficient dictionary storage
- Rule-based grammar checking (no AI/ML)
- Manifest V3 for modern browser compatibility

## 📝 Supported Error Types

### Thai
- Word spacing errors
- Word order issues
- Redundant phrases

### English
- Subject-verb agreement
- Article usage (a/an/the)
- Common spelling mistakes

### Japanese
- Particle usage (は、が、を、に)
- Hiragana/Katakana consistency
- Verb conjugation

## 💡 Perfect For

- Students writing essays
- Professionals composing emails
- Social media enthusiasts
- Anyone who writes in multiple languages

## 🆓 Free & Open Source

This extension is completely free with no ads, no premium tiers, and no hidden costs.

---

**Need Help?** Visit our GitHub repository for documentation and support.
```

**Keywords:**
```
grammar checker, thai grammar, english grammar, japanese grammar, 
spell checker, writing assistant, proofreading, offline grammar,
privacy, multilingual, ไวยากรณ์, 文法チェック
```

**Category:** Productivity

### 5. Package Builder

**Responsibilities:**
- Create production build
- Package files into .zip
- Validate package contents

**Build Process:**
```bash
# 1. Clean previous builds
rm -rf dist

# 2. Build TypeScript
npm run build

# 3. Build Wasm modules
cd wasm && ./build.sh && cd ..

# 4. Copy assets
cp -r rules dist/
cp -r dictionaries dist/
cp public/manifest.json dist/
cp public/popup.html dist/
cp public/offscreen.html dist/

# 5. Create package
cd dist && zip -r ../grammar-checker-extension.zip . && cd ..
```

**Package Contents:**
```
grammar-checker-extension.zip
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── offscreen.html
├── offscreen.js
├── worker.js
├── wasm/
│   ├── nlp_kernel.wasm
│   └── nlp_kernel.js
├── rules/
│   ├── thai.json
│   ├── english.json
│   └── japanese.json
├── dictionaries/
│   ├── thai.dat.br
│   ├── english.dat.br
│   └── japanese.dat.br
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Validation Checks:**
- manifest.json is valid JSON
- All referenced files exist
- No development files included
- Total size < 20MB
- All permissions are justified

### 6. Demo Video Creator

**Responsibilities:**
- Create engaging demo video
- Show key features in action
- Keep video concise (30-60s)

**Video Script:**
```
[0-5s] Opening: "Grammar Checker Extension"
[5-15s] Show Thai grammar checking in textarea
[15-25s] Show English grammar checking in Gmail
[25-35s] Show Japanese grammar checking
[35-45s] Demonstrate inline correction
[45-55s] Show clipboard mode
[55-60s] Closing: "Install now - Free & Private"
```

**Recording Setup:**
- Screen resolution: 1920x1080
- Browser: Chrome (latest)
- Recording software: OBS Studio or similar
- Audio: Optional background music (royalty-free)

**Post-Production:**
- Add text overlays for features
- Highlight mouse clicks
- Add smooth transitions
- Export as MP4 (H.264, 1080p)

### 7. Quality Assurance Checklist

**Responsibilities:**
- Verify all features work correctly
- Test on multiple websites
- Check performance metrics
- Ensure cross-browser compatibility

**Testing Checklist:**

**Functional Testing:**
- [ ] Grammar checking works for Thai text
- [ ] Grammar checking works for English text
- [ ] Grammar checking works for Japanese text
- [ ] Mixed language text is handled correctly
- [ ] Inline correction mode works
- [ ] Clipboard correction mode works
- [ ] Settings can be changed and persist
- [ ] Context menu appears and works
- [ ] Extension icon shows correct state

**Website Compatibility:**
- [ ] Gmail
- [ ] Google Docs
- [ ] Twitter
- [ ] Facebook
- [ ] Reddit
- [ ] LinkedIn
- [ ] Generic textarea elements
- [ ] Generic input elements
- [ ] Contenteditable elements

**Performance Testing:**
- [ ] Analysis completes within 50ms
- [ ] Memory usage stays under 50MB
- [ ] No typing lag or delays
- [ ] Extension loads within 3 seconds
- [ ] No console errors in normal operation

**Cross-Browser Testing:**
- [ ] Works on Chrome (latest)
- [ ] Works on Chrome (previous version)
- [ ] Works on Edge (latest)
- [ ] Works on Edge (previous version)

**Privacy & Security:**
- [ ] No network requests are made
- [ ] No data is sent to external servers
- [ ] All processing is local
- [ ] Permissions are minimal and justified

## Data Models

### Store Listing Data

```typescript
interface StoreListing {
  name: string; // max 45 chars
  shortDescription: string; // max 132 chars
  detailedDescription: string; // markdown format
  keywords: string[];
  category: 'Productivity';
  language: 'en'; // primary language
  screenshots: Screenshot[];
  promoImages: PromoImage[];
  demoVideoUrl?: string;
  privacyPolicyUrl: string;
  supportUrl?: string;
  homepageUrl?: string;
}

interface Screenshot {
  url: string;
  caption: string;
  language: 'en' | 'th' | 'ja';
}

interface PromoImage {
  type: 'icon' | 'small_tile' | 'marquee';
  dimensions: string; // e.g., '128x128'
  url: string;
}
```

### Package Manifest

```typescript
interface PackageManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  icons: {
    '16': string;
    '48': string;
    '128': string;
  };
  permissions: string[];
  host_permissions?: string[];
  background: {
    service_worker: string;
  };
  content_scripts: ContentScript[];
  action: {
    default_popup: string;
    default_icon: Record<string, string>;
  };
  offscreen: {
    url: string;
    reasons: string[];
    justification: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Screenshot Completeness
*For any* set of created screenshots, there should be at least 5 screenshots covering Thai, English, and Japanese grammar checking.
**Validates: Requirements 1.1, 1.2**

### Property 2: Privacy Policy Accuracy
*For any* privacy policy document, it should explicitly state that no data is sent to external servers and all processing is local.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Store Listing Character Limits
*For any* store listing, the name should not exceed 45 characters and the short description should not exceed 132 characters.
**Validates: Requirements 3.1, 3.2**

### Property 4: Package Size Limit
*For any* packaged extension, the total .zip file size should be under 20MB.
**Validates: Requirements 4.5**

### Property 5: Package Content Validity
*For any* packaged extension, it should contain manifest.json, all referenced scripts, and no development files.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Demo Video Duration
*For any* demo video, the duration should be between 30 and 60 seconds.
**Validates: Requirements 7.2**

### Property 7: Cross-Browser Compatibility
*For any* extension build, it should work correctly on both Chrome and Edge browsers.
**Validates: Requirements 6.3, 6.4, 6.5**

### Property 8: Performance Requirements
*For any* extension ready for submission, it should load within 3 seconds and have no console errors.
**Validates: Requirements 8.4, 8.3**

## Error Handling

### Screenshot Creation Errors

**Scenario**: Unable to capture clear screenshots
- **Handling**: Use high-resolution display and proper lighting
- **Recovery**: Retake screenshots with better setup

**Scenario**: Screenshots don't show errors clearly
- **Handling**: Add annotations or highlights
- **Recovery**: Use image editing tools to enhance visibility

### Privacy Policy Errors

**Scenario**: Privacy policy URL is not accessible
- **Handling**: Host on GitHub Pages or similar free hosting
- **Recovery**: Update URL in store listing

**Scenario**: Privacy policy doesn't meet store requirements
- **Handling**: Review store policies and update document
- **Recovery**: Resubmit with corrected policy

### Packaging Errors

**Scenario**: Package size exceeds 20MB
- **Handling**: Compress dictionaries further or remove unused assets
- **Recovery**: Rebuild package with optimizations

**Scenario**: manifest.json validation fails
- **Handling**: Check JSON syntax and required fields
- **Recovery**: Fix errors and repackage

**Scenario**: Missing files in package
- **Handling**: Verify build script includes all necessary files
- **Recovery**: Update build script and rebuild

### Demo Video Errors

**Scenario**: Video quality is poor
- **Handling**: Re-record with higher resolution
- **Recovery**: Use better recording software or settings

**Scenario**: Video is too long
- **Handling**: Edit to remove unnecessary parts
- **Recovery**: Focus on key features only

### Submission Errors

**Scenario**: Store rejects submission due to policy violation
- **Handling**: Review rejection reason carefully
- **Recovery**: Fix issues and resubmit

**Scenario**: Extension fails automated review
- **Handling**: Check for malware, obfuscated code, or policy violations
- **Recovery**: Clean up code and resubmit

## Testing Strategy

### Manual Testing

**Store Listing Review:**
- Read through all text for typos and clarity
- Verify all links work correctly
- Check that screenshots are clear and relevant
- Ensure video plays correctly

**Package Verification:**
- Extract .zip and verify contents
- Check manifest.json is valid
- Verify all files are present
- Test installation from package

**Cross-Browser Testing:**
- Install on Chrome and test all features
- Install on Edge and test all features
- Compare behavior between browsers
- Document any differences

### Automated Testing

**Package Validation Script:**
```bash
#!/bin/bash
# validate-package.sh

# Check if package exists
if [ ! -f "grammar-checker-extension.zip" ]; then
  echo "Error: Package not found"
  exit 1
fi

# Check package size
SIZE=$(stat -f%z "grammar-checker-extension.zip")
if [ $SIZE -gt 20971520 ]; then
  echo "Error: Package exceeds 20MB"
  exit 1
fi

# Extract and validate manifest
unzip -q grammar-checker-extension.zip -d temp
if [ ! -f "temp/manifest.json" ]; then
  echo "Error: manifest.json not found"
  exit 1
fi

# Validate JSON
if ! jq empty temp/manifest.json 2>/dev/null; then
  echo "Error: Invalid manifest.json"
  exit 1
fi

echo "Package validation passed"
rm -rf temp
```

**Character Limit Checker:**
```typescript
function validateStoreListing(listing: StoreListing): string[] {
  const errors: string[] = [];
  
  if (listing.name.length > 45) {
    errors.push(`Name too long: ${listing.name.length}/45 chars`);
  }
  
  if (listing.shortDescription.length > 132) {
    errors.push(`Short description too long: ${listing.shortDescription.length}/132 chars`);
  }
  
  if (listing.screenshots.length < 5) {
    errors.push(`Not enough screenshots: ${listing.screenshots.length}/5 minimum`);
  }
  
  return errors;
}
```

## Submission Process

### Chrome Web Store

**Steps:**
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer registration fee (if not already registered)
3. Click "New Item"
4. Upload .zip package
5. Fill in store listing information
6. Upload screenshots and promotional images
7. Add privacy policy URL
8. Submit for review

**Review Time:** Typically 1-3 business days

### Microsoft Edge Add-ons

**Steps:**
1. Go to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. Register as developer (free)
3. Click "New extension"
4. Upload .zip package
5. Fill in store listing information
6. Upload screenshots and promotional images
7. Add privacy policy URL
8. Submit for review

**Review Time:** Typically 3-7 business days

## Post-Submission

### Monitoring

- Check developer dashboard daily for review status
- Respond promptly to any reviewer questions
- Monitor user reviews and ratings after approval

### Updates

- Plan regular updates with bug fixes and improvements
- Increment version number in manifest.json
- Update release notes for each version
- Test thoroughly before submitting updates

### Marketing

- Share on social media
- Post on relevant forums and communities
- Create blog post announcing launch
- Gather user feedback for improvements
