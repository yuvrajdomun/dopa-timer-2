# ADHD Focus Timer - Analytics Documentation

## Privacy-First Analytics Implementation

This app uses **Vercel Analytics** and **Speed Insights** with comprehensive privacy protections designed specifically for neurodivergent users.

## What We Track

### ✅ Anonymous Usage Data (Privacy-Safe)

- **Timer Events**: Start/stop/pause/reset actions with session context
- **Feature Usage**: Which features are used and how often
- **Performance**: Page load times, Core Web Vitals
- **Accessibility**: Detected preferences (reduced motion, high contrast)
- **Engagement**: Session duration, page visibility changes
- **Customization**: Duration preferences, settings changes

### ❌ What We NEVER Track

- ❌ **Task Content**: Your actual task text is never stored
- ❌ **Personal Info**: No names, emails, or identifying data
- ❌ **Health Data**: No medical or health-related information
- ❌ **Precise Location**: No GPS or detailed location tracking
- ❌ **Cross-Site**: No tracking across other websites
- ❌ **Device Fingerprinting**: No unique device identification

## Privacy Protections

### 🔒 Built-in Safeguards

- **Do Not Track Respect**: Automatically disabled if DNT is enabled
- **Data Minimization**: Only essential data, automatically sanitized
- **90-Day Retention**: All data automatically deleted after 90 days
- **GDPR/CCPA Compliant**: Meets all major privacy regulations
- **Anonymous by Default**: No personal identifiers collected

### 🧠 Neurodivergent-Specific Privacy

- **No Behavioral Profiling**: Doesn't create detailed behavioral patterns
- **Health Privacy**: Avoids data that could infer health conditions
- **Gentle Analytics**: No invasive or overwhelming data collection
- **Consent-Focused**: Respects user privacy preferences

## Technical Implementation

### Analytics Stack

- **Vercel Analytics**: Page views, custom events
- **Speed Insights**: Core Web Vitals, performance metrics
- **Custom Events**: Timer-specific usage tracking

### Key Events Tracked

```javascript
// Timer Actions
trackTimerStart(state, duration, hasTask);
trackTimerComplete(state, session, wasOvertime);
trackSessionMilestone(sessionNumber);

// User Interactions
trackKeyboardShortcut(key, action);
trackFeatureUsage(feature, count);
trackDurationChange(type, oldDuration, newDuration);

// Performance & Accessibility
trackPerformanceMetric(metric, value);
trackReducedMotionDetected();
trackHighContrastDetected();
```

### Privacy Controls

```javascript
// Automatic privacy checking
if (!isTrackingEnabled()) return;

// Data sanitization
const sanitized = sanitizeEventData(properties);

// Error handling (never breaks app)
try {
  track(event);
} catch {
  /* silent fail */
}
```

## For Developers

### Configuration

- Edit `src/utils/trackingConfig.js` for privacy settings
- All tracking goes through `safeTrack()` wrapper
- Respects `NODE_ENV` for development debugging

### Adding New Events

```javascript
import { safeTrack } from "./utils/analytics.js";

// Always use safeTrack for privacy protection
safeTrack("new_event", {
  property: value,
  // timestamp added automatically
});
```

## User Rights

### Opt-Out Options

1. **Browser DNT**: Enable "Do Not Track" in browser settings
2. **Ad Blockers**: Most ad blockers disable analytics automatically
3. **Privacy Extensions**: uBlock Origin, Privacy Badger, etc.

### Data Requests

- **View Data**: Available in Vercel Analytics dashboard (anonymized)
- **Delete Data**: Automatically deleted after 90 days
- **Contact**: For privacy questions, contact via GitHub issues

## Compliance

- ✅ **GDPR** (EU General Data Protection Regulation)
- ✅ **CCPA** (California Consumer Privacy Act)
- ✅ **Accessibility Standards** (WCAG 2.2 AA)
- ✅ **Neurodivergent Privacy** (ADHD/Autism considerations)

---

_Last updated: December 2024_
