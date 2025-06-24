/**
 * ADHD Focus Timer - Privacy-First Tracking Configuration
 * Implements privacy-by-design principles with minimal data collection
 */

export const TRACKING_CONFIG = {
  // Privacy settings
  enableTracking: true,
  respectDoNotTrack: true,
  anonymizeIPs: true,
  dataRetentionDays: 90,

  // What we track (minimal, user-focused data only)
  trackingCategories: {
    performance: true, // Core Web Vitals, load times
    functionality: true, // Feature usage, errors
    accessibility: true, // A11y preferences detected
    engagement: true, // Session duration, page visibility
    timer_usage: true, // Timer starts/stops/completions
    customization: true, // Settings changes, duration preferences
  },

  // What we DON'T track
  excludedData: [
    "personal_information", // No names, emails, etc.
    "task_content", // Never store actual task text
    "precise_location", // No GPS or detailed location
    "device_fingerprinting", // No unique device identification
    "cross_site_tracking", // No tracking across other sites
    "social_media_data", // No social platform integration
  ],

  // ADHD/Autism specific privacy considerations
  neurodivergentPrivacy: {
    // Don't track patterns that could reveal private health information
    avoidHealthInference: true,
    // Don't store detailed behavioral patterns
    limitBehavioralProfiling: true,
    // Respect sensory sensitivities in data presentation
    gentleDataVisualization: true,
  },

  // Compliance settings
  compliance: {
    gdpr: true,
    ccpa: true,
    coppa: false, // Set to true if under-13 users expected
    hipaa: false, // We don't collect health data
  },
};

// Check if user has Do Not Track enabled
export const shouldRespectDoNotTrack = () => {
  if (!TRACKING_CONFIG.respectDoNotTrack) return false;

  return (
    navigator.doNotTrack === "1" ||
    navigator.doNotTrack === "yes" ||
    window.doNotTrack === "1"
  );
};

// Check if tracking is enabled and privacy preferences are respected
export const isTrackingEnabled = () => {
  if (!TRACKING_CONFIG.enableTracking) return false;
  if (shouldRespectDoNotTrack()) return false;

  // Check localStorage for user preference (if we add consent UI later)
  const userConsent = localStorage.getItem("analytics-consent");
  if (userConsent === "false") return false;

  return true;
};

// Data minimization helper - removes sensitive fields
export const sanitizeEventData = (eventData) => {
  const sanitized = { ...eventData };

  // Remove any potentially sensitive keys
  const sensitiveKeys = ["task_text", "user_id", "email", "name", "ip_address"];
  sensitiveKeys.forEach((key) => {
    if (sanitized[key]) {
      delete sanitized[key];
    }
  });

  // Truncate strings that might contain sensitive info
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "string" && sanitized[key].length > 200) {
      sanitized[key] = sanitized[key].substring(0, 200) + "...";
    }
  });

  return sanitized;
};

// Privacy notice for users (can be displayed in UI)
export const PRIVACY_NOTICE = {
  title: "Privacy-First Analytics",
  description:
    "We collect minimal, anonymous usage data to improve the timer for ADHD users.",
  dataCollected: [
    "Which features you use (timer, settings)",
    "How long you use the app",
    "Performance metrics (page load speed)",
    "Accessibility preferences detected",
    "General usage patterns (no personal content)",
  ],
  dataNotCollected: [
    "Your actual task content or text",
    "Personal identifying information",
    "Precise location or device details",
    "Data from other websites",
    "Health or medical information",
  ],
  retention: "Data is automatically deleted after 90 days",
  optOut: "You can disable tracking in your browser with Do Not Track",
};
