# Implementation Plan

- [x] 1. Create promotional materials





  - Create extension icons (16x16, 48x48, 128x128)
  - Create store promotional images (440x280, 1400x560)
  - Capture 5+ screenshots showing Thai, English, Japanese grammar checking
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Write privacy policy and documentation
  - Create PRIVACY.md stating local processing, no data collection
  - Host privacy policy online (GitHub Pages)
  - Write README with build instructions
  - Write release notes
  - Document permission justifications
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Write store listing content
  - Write extension name (max 45 chars)
  - Write short description (max 132 chars)
  - Write detailed description with features and benefits
  - Create keyword list for SEO
  - Set category as "Productivity"
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 4. Create demo video (optional)
  - Record 30-60 second demo showing all three languages
  - Show inline and clipboard correction modes
  - Upload to YouTube
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5. Package extension for distribution
  - Run production build (TypeScript + Wasm)
  - Validate manifest.json
  - Create .zip package (exclude dev files)
  - Verify package size < 20MB
  - Test installation from package
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Quality assurance
  - Run all automated tests
  - Test all features manually (Thai, English, Japanese)
  - Test on Gmail, Google Docs, Twitter, Facebook
  - Verify performance (< 50ms analysis, < 50MB memory)
  - Test on Chrome and Edge (latest versions)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.4, 6.5_

- [ ] 7. Submit to Chrome Web Store
  - Register developer account ($5 fee)
  - Upload .zip package
  - Fill in store listing (name, descriptions, screenshots, images)
  - Add privacy policy URL
  - Submit for review
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Submit to Microsoft Edge Add-ons
  - Register developer account (free)
  - Upload .zip package
  - Fill in store listing (reuse Chrome content)
  - Add privacy policy URL
  - Submit for review
  - _Requirements: 6.1, 6.2, 6.3_
