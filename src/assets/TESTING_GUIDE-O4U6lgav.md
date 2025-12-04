# Grammar Checker Extension - Testing Guide

## Prerequisites

1. Build the extension: `pnpm run build`
2. Ensure the `dist` folder contains all necessary files

## Testing in Chrome

### 1. Load Unpacked Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `dist` folder from this project
6. Verify the extension appears in the list with no errors

### 2. Test on Common Websites

#### Gmail (gmail.com)

- [ ] Open Gmail and compose a new email
- [ ] Type text with grammar errors in Thai, English, or Japanese
- [ ] Verify errors are highlighted
- [ ] Click on a highlighted error to see correction suggestion
- [ ] Test inline correction mode
- [ ] Test clipboard correction mode

#### Google Docs (docs.google.com)

- [ ] Create a new document
- [ ] Type text with grammar errors
- [ ] Verify errors are highlighted in contenteditable elements
- [ ] Test correction application

#### Twitter/X (twitter.com)

- [ ] Open Twitter and start composing a tweet
- [ ] Type text with grammar errors
- [ ] Verify errors are highlighted in the tweet compose box

#### Facebook (facebook.com)

- [ ] Open Facebook and create a new post
- [ ] Type text with grammar errors
- [ ] Verify errors are highlighted

### 3. Test Input Element Types

#### Textarea Elements

- [ ] Find a website with `<textarea>` elements
- [ ] Type text and verify grammar checking works
- [ ] Verify Mirror Div technique is used for positioning

#### Input Elements

- [ ] Test on `<input type="text">` fields
- [ ] Verify grammar checking works
- [ ] Verify corrections can be applied

#### Contenteditable Elements

- [ ] Test on rich text editors (Google Docs, Medium, etc.)
- [ ] Verify Range API is used for positioning
- [ ] Verify corrections work correctly

### 4. Test Correction Modes

#### Inline Correction Mode

- [ ] Open extension popup and select "Inline Correction" mode
- [ ] Type text with errors
- [ ] Click on a correction suggestion
- [ ] Verify the text is corrected directly in the input field
- [ ] Verify cursor position is maintained appropriately
- [ ] Verify surrounding text is preserved

#### Clipboard Correction Mode

- [ ] Open extension popup and select "Copy to Clipboard" mode
- [ ] Type text with errors
- [ ] Click on a correction suggestion
- [ ] Verify a notification appears
- [ ] Verify the corrected text is in the clipboard (paste to verify)
- [ ] Verify the original text in the input field is unchanged

### 5. Test Performance

#### Analysis Speed

- [ ] Type continuously in a text field
- [ ] Verify no typing lag or delay
- [ ] Open browser DevTools Console
- [ ] Check for performance logs showing analysis time < 50ms

#### Memory Usage

- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find the Grammar Checker Extension process
- [ ] Verify memory usage is < 50MB
- [ ] Test with all three languages to ensure dictionaries are loaded
- [ ] Verify total memory stays under 50MB

### 6. Test Multi-Language Support

#### Thai Language

- [ ] Type Thai text: "ฉัน ไป ที่ ไหน" (should suggest "ฉันไปไหน")
- [ ] Verify Thai grammar rules are applied
- [ ] Verify Thai dictionary is loaded

#### English Language

- [ ] Type English text with errors: "He go to school" (should suggest "He goes to school")
- [ ] Verify English grammar rules are applied
- [ ] Verify English dictionary is loaded

#### Japanese Language

- [ ] Type Japanese text with errors
- [ ] Verify Japanese grammar rules are applied
- [ ] Verify Japanese dictionary is loaded

#### Mixed Language Text

- [ ] Type text mixing Thai, English, and Japanese
- [ ] Verify each language segment is detected correctly
- [ ] Verify appropriate rules are applied to each segment

### 7. Test Error Scenarios

#### Missing Dictionary

- [ ] Clear IndexedDB data for the extension
- [ ] Reload the extension
- [ ] Verify dictionaries are hydrated from bundle
- [ ] Verify grammar checking works after hydration

#### Invalid Input

- [ ] Test with empty text fields
- [ ] Test with very long text (>10,000 characters)
- [ ] Test with special characters and emojis
- [ ] Verify no crashes or errors

#### Network Isolation

- [ ] Disconnect from the internet
- [ ] Verify grammar checking still works (local processing)
- [ ] Open browser DevTools Network tab
- [ ] Verify no HTTP requests are made during grammar checking

## Expected Results

### Performance Targets

- ✓ Analysis completes within 50ms after debounce
- ✓ No typing lag or input blocking
- ✓ Memory usage < 50MB for all loaded dictionaries

### Functionality Targets

- ✓ All grammar errors are detected and highlighted
- ✓ Corrections are available for all errors
- ✓ Inline correction mode works correctly
- ✓ Clipboard correction mode works correctly
- ✓ Multi-language support works correctly
- ✓ No network calls are made (local processing only)

### Size Targets

- ✓ Total extension size < 20MB
- ✓ Current size: ~5.35 MB

## Troubleshooting

### Extension Doesn't Load

- Check browser console for errors
- Verify all required files are in dist folder
- Try rebuilding: `pnpm run build`

### Grammar Checking Doesn't Work

- Open browser DevTools Console
- Look for error messages
- Verify WebAssembly module loaded successfully
- Check if dictionaries are loaded in IndexedDB

### Performance Issues

- Check Chrome Task Manager for memory usage
- Verify Web Worker is running (check console logs)
- Ensure debouncing is working (300ms delay)

### Corrections Don't Apply

- Verify correction mode setting in extension popup
- Check if input field is readonly
- Look for JavaScript errors in console

## Reporting Issues

When reporting issues, please include:

1. Browser version (Chrome/Edge)
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Console error messages (if any)
6. Screenshots (if applicable)
