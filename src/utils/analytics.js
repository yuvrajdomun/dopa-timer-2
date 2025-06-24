import { track } from "@vercel/analytics";
import {
  isTrackingEnabled,
  sanitizeEventData,
  TRACKING_CONFIG,
} from "./trackingConfig.js";

/**
 * ADHD Focus Timer - Comprehensive Analytics Tracking
 * Privacy-conscious tracking for understanding user behavior and improving UX
 */

// Privacy-first tracking wrapper
const safeTrack = (eventName, properties = {}) => {
  // Respect privacy preferences
  if (!isTrackingEnabled()) return;

  // Sanitize data before sending
  const sanitizedProps = sanitizeEventData(properties);

  // Add privacy metadata
  const enhancedProps = {
    ...sanitizedProps,
    privacy_compliant: true,
    data_retention_days: TRACKING_CONFIG.dataRetentionDays,
    timestamp: new Date().toISOString(),
  };

  try {
    track(eventName, enhancedProps);
  } catch (error) {
    // Silently fail if tracking fails - don't break the app
    if (process.env.NODE_ENV === "development") {
      console.warn("Analytics tracking failed:", error);
    }
  }
};

// Timer Events (Privacy-Safe)
export const trackTimerStart = (state, duration, hasTask = false) => {
  safeTrack("timer_start", {
    timer_state: state,
    duration_minutes: Math.round(duration / 60),
    has_task: hasTask, // Boolean only, never actual task content
    session_type: "focus_session",
  });
};

export const trackTimerPause = (state, timeRemaining, totalDuration) => {
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
  safeTrack("timer_pause", {
    timer_state: state,
    progress_percentage: Math.round(progress),
    time_remaining_minutes: Math.round(timeRemaining / 60),
  });
};

export const trackTimerComplete = (
  state,
  sessionNumber,
  wasOvertime = false
) => {
  track("timer_complete", {
    timer_state: state,
    session_number: sessionNumber,
    was_overtime: wasOvertime,
    timestamp: new Date().toISOString(),
  });
};

export const trackTimerReset = (state, timeRemaining, totalDuration) => {
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
  track("timer_reset", {
    timer_state: state,
    progress_percentage: Math.round(progress),
    time_remaining_minutes: Math.round(timeRemaining / 60),
    timestamp: new Date().toISOString(),
  });
};

export const trackTimerSkip = (fromState, toState, sessionNumber) => {
  track("timer_skip", {
    from_state: fromState,
    to_state: toState,
    session_number: sessionNumber,
    timestamp: new Date().toISOString(),
  });
};

// Task Management Events
export const trackTaskInput = (taskLength, isFirstTask = false) => {
  track("task_input", {
    task_length: taskLength,
    is_first_task: isFirstTask,
    timestamp: new Date().toISOString(),
  });
};

export const trackTaskClear = () => {
  track("task_clear", {
    timestamp: new Date().toISOString(),
  });
};

// Settings Events
export const trackDurationChange = (timerType, oldDuration, newDuration) => {
  track("duration_change", {
    timer_type: timerType,
    old_duration_minutes: Math.round(oldDuration / 60),
    new_duration_minutes: Math.round(newDuration / 60),
    timestamp: new Date().toISOString(),
  });
};

// Session Progress Events
export const trackSessionMilestone = (sessionNumber) => {
  const milestones = [1, 5, 10, 25, 50, 100];
  if (milestones.includes(sessionNumber)) {
    track("session_milestone", {
      session_number: sessionNumber,
      milestone_type: `${sessionNumber}_sessions`,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackPomodoroComplete = (pomodoroNumber, totalSessions) => {
  track("pomodoro_complete", {
    pomodoro_number: pomodoroNumber,
    total_sessions: totalSessions,
    timestamp: new Date().toISOString(),
  });
};

// Accessibility & UX Events
export const trackKeyboardShortcut = (shortcut, action) => {
  safeTrack("keyboard_shortcut", {
    shortcut_key: shortcut,
    action: action,
  });
};

export const trackReducedMotionDetected = () => {
  track("accessibility_preference", {
    preference_type: "reduced_motion",
    value: true,
    timestamp: new Date().toISOString(),
  });
};

export const trackHighContrastDetected = () => {
  track("accessibility_preference", {
    preference_type: "high_contrast",
    value: true,
    timestamp: new Date().toISOString(),
  });
};

// Performance & Error Events
export const trackPerformanceMetric = (metric, value, context = "") => {
  track("performance_metric", {
    metric_name: metric,
    metric_value: value,
    context: context,
    timestamp: new Date().toISOString(),
  });
};

export const trackError = (errorType, errorMessage, context = "") => {
  track("error_occurred", {
    error_type: errorType,
    error_message: errorMessage.substring(0, 200), // Limit message length
    context: context,
    timestamp: new Date().toISOString(),
  });
};

// Engagement Events
export const trackPageVisibility = (isVisible, sessionDuration = 0) => {
  track("page_visibility", {
    is_visible: isVisible,
    session_duration_seconds: sessionDuration,
    timestamp: new Date().toISOString(),
  });
};

export const trackFeatureUsage = (feature, usageCount = 1) => {
  safeTrack("feature_usage", {
    feature_name: feature,
    usage_count: usageCount,
  });
};

// Affiliate Marketing Events
export const trackAffiliateClick = (bookDetails, timerContext) => {
  safeTrack("affiliate_click", {
    book_id: bookDetails.id,
    book_title: bookDetails.title,
    book_author: bookDetails.author,
    affiliate_url: bookDetails.url ? bookDetails.url.substring(0, 50) : null, // Truncate for privacy

    // Timer context when clicked
    timer_state: timerContext.currentState,
    session_number: timerContext.session,
    time_remaining_minutes: Math.round(timerContext.timeLeft / 60),
    is_timer_running: timerContext.isRunning,
    is_overtime: timerContext.isOvertime,

    // User engagement data
    page_time_minutes: Math.round(
      (Date.now() - timerContext.pageStartTime) / 60000
    ),
    device_type: /Mobi|Android/i.test(navigator.userAgent)
      ? "mobile"
      : "desktop",

    // Privacy-safe analytics
    timestamp: new Date().toISOString(),
    conversion_tracking_id: `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  });
};

export const trackBookShelfView = (timerContext) => {
  safeTrack("book_shelf_view", {
    timer_state: timerContext.currentState,
    session_number: timerContext.session,
    is_timer_running: timerContext.isRunning,
    timestamp: new Date().toISOString(),
  });
};

// Privacy-conscious helper for batching events
let eventQueue = [];
let batchTimeout = null;

export const trackBatched = (eventName, properties) => {
  eventQueue.push({ eventName, properties, timestamp: Date.now() });

  // Clear existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  // Batch events every 5 seconds or when queue reaches 10 events
  batchTimeout = setTimeout(() => {
    if (eventQueue.length > 0) {
      track("batched_events", {
        events: eventQueue.slice(0, 10), // Limit batch size
        batch_size: eventQueue.length,
        timestamp: new Date().toISOString(),
      });
      eventQueue = [];
    }
  }, 5000);

  // Force send if queue gets too large
  if (eventQueue.length >= 10) {
    clearTimeout(batchTimeout);
    track("batched_events", {
      events: eventQueue,
      batch_size: eventQueue.length,
      timestamp: new Date().toISOString(),
    });
    eventQueue = [];
  }
};
