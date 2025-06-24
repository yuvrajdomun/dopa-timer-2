/**
 * ADHD Focus Timer - Privacy-Conscious Local Storage
 * Manages local persistence with data minimization and error handling
 */

// Storage keys - centralized for consistency
const STORAGE_KEYS = {
  CURRENT_TASK: "adhd-timer-current-task",
  DURATIONS: "adhd-timer-durations",
  THEME_PREFERENCES: "adhd-timer-theme",
  SESSION_DATA: "adhd-timer-session",
  USER_PREFERENCES: "adhd-timer-preferences",
  LAST_SAVE: "adhd-timer-last-save",
};

// Default values
const DEFAULT_DURATIONS = {
  work: 25 * 60, // 25 minutes
  "short-break": 5 * 60, // 5 minutes
  "long-break": 15 * 60, // 15 minutes
};

const DEFAULT_PREFERENCES = {
  theme: "sea-glass",
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
  hapticEnabled: true,
};

// Privacy-safe localStorage wrapper
class SafeStorage {
  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn("localStorage not available:", e.message);
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      // Parse JSON with error handling
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading from localStorage (${key}):`, error.message);
      // Clear corrupted data
      this.remove(key);
      return defaultValue;
    }
  }

  set(key, value) {
    if (!this.isAvailable) return false;

    try {
      // Sanitize data before storing
      const sanitizedValue = this.sanitizeData(value);
      localStorage.setItem(key, JSON.stringify(sanitizedValue));

      // Update last save timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, Date.now());
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage (${key}):`, error.message);
      return false;
    }
  }

  remove(key) {
    if (!this.isAvailable) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage (${key}):`, error.message);
      return false;
    }
  }

  clear() {
    if (!this.isAvailable) return false;

    try {
      // Only clear our app's keys, not all localStorage
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn("Error clearing app data from localStorage:", error.message);
      return false;
    }
  }

  // Data sanitization to prevent storage of sensitive information
  sanitizeData(data) {
    if (typeof data === "string") {
      // Limit string length to prevent huge storage usage
      return data.substring(0, 1000);
    }

    if (Array.isArray(data)) {
      return data.slice(0, 100); // Limit array size
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip potentially sensitive keys
        if (this.isSensitiveKey(key)) continue;
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  isSensitiveKey(key) {
    const sensitiveKeys = [
      "password",
      "email",
      "token",
      "secret",
      "private",
      "ssn",
      "credit",
    ];
    return sensitiveKeys.some((sensitive) =>
      key.toLowerCase().includes(sensitive)
    );
  }

  // Get storage usage info
  getStorageInfo() {
    if (!this.isAvailable) return { available: false };

    try {
      const usage = {};
      let totalSize = 0;

      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        usage[name] = { size, hasData: Boolean(data) };
        totalSize += size;
      });

      return {
        available: true,
        totalSize,
        usage,
        lastSave: this.get(STORAGE_KEYS.LAST_SAVE),
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// Create singleton instance
const storage = new SafeStorage();

// High-level API functions
export const saveCurrentTask = (task) => {
  // Only save if task is not empty and reasonable length
  if (typeof task === "string" && task.trim().length > 0 && task.length < 500) {
    return storage.set(STORAGE_KEYS.CURRENT_TASK, task.trim());
  }
  return false;
};

export const loadCurrentTask = () => {
  return storage.get(STORAGE_KEYS.CURRENT_TASK, "");
};

export const clearCurrentTask = () => {
  return storage.remove(STORAGE_KEYS.CURRENT_TASK);
};

export const saveDurations = (durations) => {
  // Validate durations are reasonable (1-99 minutes)
  const validatedDurations = {};
  for (const [key, value] of Object.entries(durations)) {
    if (typeof value === "number" && value >= 60 && value <= 99 * 60) {
      validatedDurations[key] = value;
    }
  }

  if (Object.keys(validatedDurations).length > 0) {
    return storage.set(STORAGE_KEYS.DURATIONS, validatedDurations);
  }
  return false;
};

export const loadDurations = () => {
  return storage.get(STORAGE_KEYS.DURATIONS, DEFAULT_DURATIONS);
};

export const saveSessionData = (sessionData) => {
  // Only save non-sensitive session info
  const safeSessionData = {
    currentSession: sessionData.currentSession,
    currentState: sessionData.currentState,
    savedAt: Date.now(),
  };

  return storage.set(STORAGE_KEYS.SESSION_DATA, safeSessionData);
};

export const loadSessionData = () => {
  const data = storage.get(STORAGE_KEYS.SESSION_DATA, null);

  // Check if data is recent (within last 24 hours)
  if (data && data.savedAt) {
    const hoursSinceLastSave = (Date.now() - data.savedAt) / (1000 * 60 * 60);
    if (hoursSinceLastSave > 24) {
      // Data is old, don't restore session
      clearSessionData();
      return null;
    }
  }

  return data;
};

export const clearSessionData = () => {
  return storage.remove(STORAGE_KEYS.SESSION_DATA);
};

export const saveUserPreferences = (preferences) => {
  const validatedPreferences = {
    ...DEFAULT_PREFERENCES,
    ...preferences,
  };

  return storage.set(STORAGE_KEYS.USER_PREFERENCES, validatedPreferences);
};

export const loadUserPreferences = () => {
  return storage.get(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
};

export const saveThemePreference = (theme) => {
  if (typeof theme === "string" && theme.length < 50) {
    return storage.set(STORAGE_KEYS.THEME_PREFERENCES, {
      theme,
      savedAt: Date.now(),
    });
  }
  return false;
};

export const loadThemePreference = () => {
  const data = storage.get(STORAGE_KEYS.THEME_PREFERENCES, null);
  return data ? data.theme : DEFAULT_PREFERENCES.theme;
};

// Utility functions
export const clearAllAppData = () => {
  return storage.clear();
};

export const getStorageInfo = () => {
  return storage.getStorageInfo();
};

export const exportUserData = () => {
  if (!storage.isAvailable) return null;

  try {
    const userData = {
      currentTask: loadCurrentTask(),
      durations: loadDurations(),
      preferences: loadUserPreferences(),
      theme: loadThemePreference(),
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return userData;
  } catch (error) {
    console.warn("Error exporting user data:", error.message);
    return null;
  }
};

export const importUserData = (userData) => {
  if (!userData || typeof userData !== "object") return false;

  try {
    let imported = 0;

    if (userData.currentTask) {
      saveCurrentTask(userData.currentTask) && imported++;
    }

    if (userData.durations) {
      saveDurations(userData.durations) && imported++;
    }

    if (userData.preferences) {
      saveUserPreferences(userData.preferences) && imported++;
    }

    if (userData.theme) {
      saveThemePreference(userData.theme) && imported++;
    }

    return imported > 0;
  } catch (error) {
    console.warn("Error importing user data:", error.message);
    return false;
  }
};

// Privacy compliance helpers
export const isStorageAvailable = () => storage.isAvailable;

export const getPrivacyInfo = () => ({
  dataStored: [
    "Current task text (only what you type)",
    "Timer duration preferences",
    "Theme and accessibility preferences",
    "Current session number (for continuity)",
  ],
  dataNotStored: [
    "Personal identifying information",
    "Task history or completed tasks",
    "Sensitive personal data",
    "Data from other websites",
  ],
  retention: "Data stays on your device only - never sent to servers",
  control: "You can clear all data anytime in settings",
});

export default {
  saveCurrentTask,
  loadCurrentTask,
  clearCurrentTask,
  saveDurations,
  loadDurations,
  saveSessionData,
  loadSessionData,
  clearSessionData,
  saveUserPreferences,
  loadUserPreferences,
  saveThemePreference,
  loadThemePreference,
  clearAllAppData,
  getStorageInfo,
  exportUserData,
  importUserData,
  isStorageAvailable,
  getPrivacyInfo,
};
