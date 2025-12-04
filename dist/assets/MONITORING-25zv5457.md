# Monitoring & Performance Guide

## Error Monitoring

### Setup Sentry

1. Create account at https://sentry.io/
2. Create new project for "Browser Extension"
3. Copy DSN to `.env`:

```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Error Tracking

Errors are automatically captured in production:

- Unhandled exceptions
- Promise rejections
- Manual error logging

```typescript
import { logError } from "./lib/errorMonitoring";

try {
  // Your code
} catch (error) {
  logError(error, { context: "feature-name" });
}
```

### Filtering Noise

Common browser extension errors are filtered:

- ResizeObserver loop limit exceeded
- Network errors
- Non-Error promise rejections

## Performance Monitoring

### Metrics Tracked

- Analysis time per request
- Average analysis time
- Slow analysis count (>50ms)
- Recent performance trends

### Viewing Metrics

```typescript
import { getMetrics } from "./lib/performanceMonitoring";

const stats = getMetrics();
console.log("Performance:", stats);
```

### Performance Targets

- **Target**: 50ms per analysis (after debounce)
- **Warning**: Logged if >100ms
- **Report**: Every 100 analyses

### Optimization Tips

1. **Reduce text length**: Analyze only changed portions
2. **Lazy load dictionaries**: Load only detected languages
3. **Cache compiled rules**: Reuse regex patterns
4. **Web Worker**: Keep processing off main thread

## Production Checklist

- [ ] Set `SENTRY_DSN` in environment
- [ ] Set `NODE_ENV=production`
- [ ] Test error reporting
- [ ] Review performance metrics
- [ ] Set up Sentry alerts
- [ ] Configure error sampling rate

## Development

In development mode:

- Errors logged to console only
- Performance metrics visible in console
- Sentry disabled to avoid noise

## Troubleshooting

### Sentry not capturing errors

1. Check `NODE_ENV=production`
2. Verify DSN is correct
3. Check browser console for Sentry init errors
4. Ensure error is not in ignore list

### Performance degradation

1. Check `getMetrics()` for slow analyses
2. Review text length being analyzed
3. Check dictionary loading times
4. Profile with Chrome DevTools
