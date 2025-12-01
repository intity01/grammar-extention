# E2E Testing with Playwright

## Setup

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Build the extension:
```bash
npm run build
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/e2e/contenteditable.spec.ts
```

## Test Coverage

- **extension-basic.spec.ts**: Basic extension functionality
- **contenteditable.spec.ts**: Tests for contenteditable elements (skipped in unit tests)

## Notes

- Tests require the extension to be built first (`npm run build`)
- Extension is loaded from `./dist` directory
- Tests run in real Chrome/Edge browsers
- Screenshots are captured on failure
