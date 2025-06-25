import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import {
  trackTimerStart,
  trackTimerPause,
  trackTimerComplete,
  trackTimerReset,
  trackTimerSkip,
  trackTaskInput,
  trackDurationChange,
  trackSliderInteraction,
  trackSessionMilestone,
  trackPomodoroComplete,
  trackKeyboardShortcut,
  trackReducedMotionDetected,
  trackHighContrastDetected,
  trackPageVisibility,
  trackFeatureUsage,
  trackAffiliateClick,
  trackBookShelfView,
} from './utils/analytics.js'
import {
  saveCurrentTask,
  loadCurrentTask,
  clearCurrentTask,
  saveDurations,
  loadDurations,
  saveSessionData,
  loadSessionData,
  isStorageAvailable
} from './utils/localStorage.js'

const TIMER_STATES = {
  WORK: 'work',
  SHORT_BREAK: 'short-break', 
  LONG_BREAK: 'long-break'
}

const DEFAULT_DURATIONS = {
  [TIMER_STATES.WORK]: 25 * 60, // 25 minutes
  [TIMER_STATES.SHORT_BREAK]: 5 * 60, // 5 minutes
  [TIMER_STATES.LONG_BREAK]: 15 * 60 // 15 minutes
}

const STATE_LABELS = {
  [TIMER_STATES.WORK]: 'Focus Time',
  [TIMER_STATES.SHORT_BREAK]: 'Short Break',
  [TIMER_STATES.LONG_BREAK]: 'Long Break'
}

function PomodoroTimer() {
  // Initialize state with localStorage data
  const [currentState, setCurrentState] = useState(TIMER_STATES.WORK)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS[TIMER_STATES.WORK])
  const [isRunning, setIsRunning] = useState(false)
  const [session, setSession] = useState(1)
  const [durations, setDurations] = useState(DEFAULT_DURATIONS)
  const [isOvertime, setIsOvertime] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [currentTask, setCurrentTask] = useState('')
  const [firstTaskInput, setFirstTaskInput] = useState(true)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    // Check for saved preference first
    const savedTheme = localStorage.getItem('dopaflow-theme')
    console.log('Saved theme from localStorage:', savedTheme) // Debug log
    if (savedTheme) {
      console.log('Using saved theme:', savedTheme === 'dark') // Debug log
      return savedTheme === 'dark'
    }
    // Default to system preference
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    console.log('Using system preference:', systemPrefersDark) // Debug log
    return systemPrefersDark
  })
  
  const intervalRef = useRef(null)
  const audioRef = useRef(null)
  const pageVisibilityStartTime = useRef(Date.now())
  const saveIndicatorTimeoutRef = useRef(null)
  const pageStartTime = useRef(Date.now())

  // Show save indicator to user
  const showSaveIndicator = useCallback((message) => {
    setSaveIndicator(message)
    
    // Clear any existing timeout
    if (saveIndicatorTimeoutRef.current) {
      clearTimeout(saveIndicatorTimeoutRef.current)
    }
    
    // Hide indicator after 2 seconds
    saveIndicatorTimeoutRef.current = setTimeout(() => {
      setSaveIndicator('')
    }, 2000)
  }, [])
  
  // Calculate progress for the ring
  const totalTime = durations[currentState]
  const progress = isOvertime ? 0 : ((totalTime - timeLeft) / totalTime) * 100
  const circumference = 2 * Math.PI * 94 // radius of 94px
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  // Format time display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60)
    const secs = Math.abs(seconds) % 60
    const sign = seconds < 0 ? '-' : ''
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  // Book data for affiliate tracking
  const bookData = {
    atomic_habits: {
      id: 'atomic_habits',
      title: 'Atomic Habits',
      author: 'James Clear',
      url: 'https://amzn.to/4l1wdEs',
      description: 'Build tiny changes that lead to remarkable focus improvements'
    },
    deep_work: {
      id: 'deep_work',
      title: 'Deep Work',
      author: 'Cal Newport',
      url: 'https://amzn.to/46dtx1P',
      description: 'Master distraction-free concentration in our connected world'
    },
    adhd_advantage: {
      id: 'adhd_advantage',
      title: 'The ADHD Advantage',
      author: 'Dale Archer',
      url: 'https://amzn.to/4ng5JR6',
      description: 'Transform your ADHD traits into powerful productivity tools'
    }
  }
  
  // Get current timer context for tracking
  const getTimerContext = () => ({
    currentState,
    session,
    timeLeft,
    isRunning,
    isOvertime,
    pageStartTime: pageStartTime.current
  })
  
  // Handle affiliate link clicks with enhanced tracking
  const handleAffiliateClick = (bookId) => {
    const book = bookData[bookId]
    const context = getTimerContext()
    
    // Track the affiliate click with detailed context
    trackAffiliateClick(book, context)
    
    // Also track as feature usage for backwards compatibility
    trackFeatureUsage('affiliate_click', bookId)
  }
  

  
  // Create a pleasant notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create a pleasant chime sound
      const createTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, startTime)
        oscillator.type = 'sine'
        
        // Create a gentle fade in/out
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
        
        return oscillator
      }
      
      // Play a pleasant 3-note chime
      const currentTime = audioContext.currentTime
      createTone(523.25, currentTime, 0.5)        // C5
      createTone(659.25, currentTime + 0.2, 0.5)  // E5
      createTone(783.99, currentTime + 0.4, 0.8)  // G5
      
    } catch (error) {
      // Fallback to simple beep if Web Audio API fails
      console.warn('Web Audio API not available:', error.message)
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Silently fail if audio can't play
        })
      }
    }
  }, [])

  // Handle timer completion with comprehensive tracking
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    
    // Track timer completion
    trackTimerComplete(currentState, session, isOvertime)
    
    // Play pleasant notification sound
    playNotificationSound()
    
    // Provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]) // Double vibration for completion
      trackFeatureUsage('haptic_feedback')
    }
    
    let nextState
    let message
    let newSessionNumber = session
    
    if (currentState === TIMER_STATES.WORK) {
      // After work, determine break type based on session count
      nextState = session % 4 === 0 ? TIMER_STATES.LONG_BREAK : TIMER_STATES.SHORT_BREAK
      message = `Focus session complete! Time for a ${nextState === TIMER_STATES.LONG_BREAK ? 'long' : 'short'} break.`
    } else {
      // After any break, go to work and increment session
      nextState = TIMER_STATES.WORK
      newSessionNumber = session + 1
      setSession(newSessionNumber)
      message = 'Break over, focus time!'
      
      // Track session milestones
      trackSessionMilestone(newSessionNumber)
      
      // Track Pomodoro completion (every 4 sessions)
      if (newSessionNumber % 4 === 1 && newSessionNumber > 1) {
        const pomodoroNumber = Math.floor((newSessionNumber - 1) / 4)
        trackPomodoroComplete(pomodoroNumber, newSessionNumber)
        trackFeatureUsage('pomodoro_complete')
      }
    }
    
    setCurrentState(nextState)
    setTimeLeft(durations[nextState])
    setIsOvertime(false)
    setStatusMessage(message)
    
    // Clear status message after 5 seconds
    setTimeout(() => setStatusMessage(''), 5000)
  }, [currentState, session, durations, isOvertime])
  
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          
          // Check if timer has completed
          if (newTime === 0) {
            handleTimerComplete()
            return 0
          }
          
          // Check if entering overtime
          if (newTime < 0 && !isOvertime) {
            setIsOvertime(true)
          }
          
          return newTime
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    
    return () => clearInterval(intervalRef.current)
  }, [isRunning, isOvertime, handleTimerComplete])
  
  // Control functions with comprehensive tracking
  const startTimer = () => {
    setIsRunning(true)
    setStatusMessage('')
    
    // Track timer start with context
    trackTimerStart(currentState, durations[currentState], currentTask.length > 0)
    trackFeatureUsage('timer_start')
  }
  
  const pauseTimer = () => {
    setIsRunning(false)
    
    // Track timer pause with progress
    trackTimerPause(currentState, timeLeft, durations[currentState])
    trackFeatureUsage('timer_pause')
  }
  
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(durations[currentState])
    setIsOvertime(false)
    setStatusMessage('')
    
    // Track timer reset with progress
    trackTimerReset(currentState, timeLeft, durations[currentState])
    trackFeatureUsage('timer_reset')
  }
  
  const skipToNext = () => {
    const nextState = currentState === TIMER_STATES.WORK 
      ? (session % 4 === 0 ? TIMER_STATES.LONG_BREAK : TIMER_STATES.SHORT_BREAK)
      : TIMER_STATES.WORK
    
    // Track skip action
    trackTimerSkip(currentState, nextState, session)
    trackFeatureUsage('timer_skip')
    
    handleTimerComplete()
  }

  // Micro-sprint functions for ADHD users who need shorter focus sessions
  const startMicroSprint = (minutes) => {
    // Set timer to work state
    setCurrentState(TIMER_STATES.WORK)
    const seconds = minutes * 60
    setTimeLeft(seconds)
    setIsRunning(true)
    setIsOvertime(false)
    setStatusMessage(`${minutes}-minute micro-sprint started! 🚀`)
    
    // Clear status message after 3 seconds
    setTimeout(() => setStatusMessage(''), 3000)
    
    // Track micro-sprint usage
    trackFeatureUsage('micro_sprint_start', `${minutes}_minutes`)
    trackTimerStart('micro_sprint', seconds, currentTask.length > 0)
  }

  const start5MinuteSprint = () => startMicroSprint(5)
  
  // Debug function to reset theme if stuck
  const resetTheme = () => {
    console.log('🔄 MANUAL THEME RESET')
    // Clear everything
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.style.backgroundColor = ''
    document.body.style.color = ''
    localStorage.removeItem('dopaflow-theme')
    setDarkMode(false)
    console.log('✅ Theme reset to light mode')
  }
  
  // Dark mode toggle function - explicitly set theme values
  const toggleDarkMode = () => {
    const newMode = !darkMode
    console.log('🔄 Toggling from', darkMode ? 'DARK' : 'LIGHT', 'to', newMode ? 'DARK' : 'LIGHT') // Debug log
    
    // Clear any previous inline styles that might interfere
    document.body.style.backgroundColor = ''
    document.body.style.color = ''
    
    // Update state first
    setDarkMode(newMode)
    
    // Apply theme attribute - explicitly set both values to override system preference
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      console.log('✅ SET data-theme="dark"') // Debug log
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      console.log('✅ SET data-theme="light"') // Debug log
    }
    
    // Force a small delay to ensure state update
    setTimeout(() => {
      console.log('🎯 Current DOM theme:', document.documentElement.getAttribute('data-theme'))
      console.log('🎯 Current React state:', newMode ? 'dark' : 'light')
    }, 50)
    
    // Save preference to localStorage
    localStorage.setItem('dopaflow-theme', newMode ? 'dark' : 'light')
    
    // Track dark mode usage
    trackFeatureUsage('dark_mode_toggle', newMode ? 'enabled' : 'disabled')
    
    // Show feedback to user
    showSaveIndicator(newMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled')
  }
  
  // Update slider progress visualization
  const updateSliderProgress = (sliderId, value, min, max) => {
    const slider = document.getElementById(sliderId)
    if (slider) {
      const percentage = ((value - min) / (max - min)) * 100
      slider.style.setProperty('--slider-progress', `${percentage}%`)
    }
  }

  const handleDurationChange = (state, minutes) => {
    const oldDuration = durations[state]
    
    // Determine valid range based on timer type
    let minVal, maxVal
    if (state === TIMER_STATES.WORK) {
      minVal = 1
      maxVal = 90
    } else if (state === TIMER_STATES.SHORT_BREAK) {
      minVal = 1
      maxVal = 30
    } else {
      minVal = 5
      maxVal = 60
    }
    
    const clampedMinutes = Math.max(minVal, Math.min(maxVal, minutes))
    const seconds = clampedMinutes * 60
    
    // Track duration change
    trackDurationChange(state, oldDuration, seconds)
    trackSliderInteraction(state, clampedMinutes, minVal, maxVal, 'change')
    trackFeatureUsage('duration_change')
    
    const newDurations = { ...durations, [state]: seconds }
    setDurations(newDurations)
    
    // Update slider progress visualization
    const sliderIds = {
      [TIMER_STATES.WORK]: 'work-duration-slider',
      [TIMER_STATES.SHORT_BREAK]: 'short-break-duration-slider',
      [TIMER_STATES.LONG_BREAK]: 'long-break-duration-slider'
    }
    updateSliderProgress(sliderIds[state], clampedMinutes, minVal, maxVal)
    
    // Save immediately for duration changes (important setting)
    if (isDataLoaded) {
      const success = saveDurations(newDurations)
      if (success) {
        showSaveIndicator('Duration saved')
      }
    }
    
    // Update current timer if we're in that state and not running
    if (state === currentState && !isRunning) {
      setTimeLeft(seconds)
      setIsOvertime(false)
    }
  }
  
  const handleTaskChange = (e) => {
    const newTask = e.target.value
    setCurrentTask(newTask)
    
    // Track task input
    if (newTask.length > 0 && newTask.length % 5 === 0) { // Track every 5 characters
      trackTaskInput(newTask.length, firstTaskInput)
      if (firstTaskInput) {
        setFirstTaskInput(false)
        trackFeatureUsage('first_task_input')
      }
    }
    
    if (newTask.length === 0 && currentTask.length > 0) {
      trackFeatureUsage('task_clear')
      // Clear from localStorage immediately when task is cleared
      if (isDataLoaded && isStorageAvailable()) {
        clearCurrentTask()
        showSaveIndicator('Task cleared')
      }
    }
  }
  
  // Keyboard controls with tracking
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.type === 'number' || e.target.type === 'text') return // Don't interfere with input fields
      
      switch (e.key) {
        case ' ': {
          e.preventDefault()
          const action = isRunning ? 'pause' : 'start'
          trackKeyboardShortcut('space', action)
          isRunning ? pauseTimer() : startTimer()
          break
        }
        case 's':
          e.preventDefault()
          trackKeyboardShortcut('s', 'skip')
          skipToNext()
          break
        case '5':
          // Only allow micro-sprint shortcuts when timer is not running and in work state
          if (!isRunning && currentState === TIMER_STATES.WORK) {
            e.preventDefault()
            trackKeyboardShortcut('5', 'micro_sprint_5min')
            start5MinuteSprint()
          }
          break
        case 'd':
          e.preventDefault()
          trackKeyboardShortcut('d', 'dark_mode_toggle')
          toggleDarkMode()
          break
        case 'r':
        case 'R':
          if (e.shiftKey) {
            // Shift+R for theme reset (to avoid conflict with timer reset)
            e.preventDefault()
            trackKeyboardShortcut('shift_r', 'theme_reset')
            resetTheme()
          } else {
            // Regular R for timer reset
            if (e.ctrlKey || e.metaKey) return // Don't interfere with browser refresh
            e.preventDefault()
            trackKeyboardShortcut('r', 'reset')
            resetTimer()
          }
          break
        case '1':
          // Check if next key is '0' for 10-minute sprint
          if (!isRunning && currentState === TIMER_STATES.WORK) {
            // This is a simple implementation - for more robust handling, we'd need key sequence detection
            e.preventDefault()
            trackKeyboardShortcut('1', 'micro_sprint_10min_attempt')
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning, currentState, toggleDarkMode, resetTheme, startTimer, pauseTimer, resetTimer, skipToNext, start5MinuteSprint])
  
  // Initialize theme on mount
  useEffect(() => {
    console.log('🎯 Initializing theme on mount:', darkMode ? 'dark' : 'light') // Debug log
    
    // Apply theme immediately on mount - explicitly set both dark and light
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      console.log('✅ Initial theme set to dark') // Debug log
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      console.log('✅ Initial theme set to light') // Debug log
    }
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? '#1a2025' : '#7ab5b5')
    }
  }, []) // Only run on mount
  
  // Dark mode theme application - when state changes
  useEffect(() => {
    console.log('🔧 Theme state changed to:', darkMode ? 'dark' : 'light') // Debug log
    
    // Apply theme to document - explicitly set both dark and light to override system preference
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      console.log('✅ DOM updated to dark mode') // Debug log
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      console.log('✅ DOM updated to light mode') // Debug log
    }
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? '#1a2025' : '#7ab5b5')
    }
  }, [darkMode])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // Only auto-update if user hasn't set a manual preference
      const savedTheme = localStorage.getItem('dopaflow-theme')
      if (!savedTheme) {
        setDarkMode(e.matches)
        trackFeatureUsage('system_theme_change', e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Track accessibility preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      trackReducedMotionDetected()
    }
    
    // Check for high contrast preference  
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    if (contrastQuery.matches) {
      trackHighContrastDetected()
    }
    
    // Track initial page load and theme preference
    trackFeatureUsage('page_load')
    trackFeatureUsage('initial_theme', darkMode ? 'dark' : 'light')
  }, [])
  
  // Track page visibility changes for engagement analytics
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      const sessionDuration = Math.floor((Date.now() - pageVisibilityStartTime.current) / 1000)
      
      trackPageVisibility(isVisible, sessionDuration)
      
      if (isVisible) {
        pageVisibilityStartTime.current = Date.now()
        trackFeatureUsage('page_focus')
      } else {
        trackFeatureUsage('page_blur')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
  
  // Initialize slider progress on mount and when durations change
  useEffect(() => {
    if (isDataLoaded) {
      // Initialize all slider progress bars
      updateSliderProgress('work-duration-slider', durations[TIMER_STATES.WORK] / 60, 1, 90)
      updateSliderProgress('short-break-duration-slider', durations[TIMER_STATES.SHORT_BREAK] / 60, 1, 30)
      updateSliderProgress('long-break-duration-slider', durations[TIMER_STATES.LONG_BREAK] / 60, 5, 60)
    }
  }, [durations, isDataLoaded])

  // Track app engagement on mount
  useEffect(() => {
    const startTime = Date.now()
    
    return () => {
      // Track session duration when component unmounts
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000)
      trackFeatureUsage('app_session_end', sessionDuration)
    }
  }, [])

  // Track book shelf view when component loads
  useEffect(() => {
    // Track that user has seen the book shelf
    const context = getTimerContext()
    trackBookShelfView(context)
    
    // Track when books are visible (scroll-based tracking)
    const handleScroll = () => {
      const bookShelf = document.querySelector('.book-shelf')
      if (bookShelf) {
        const rect = bookShelf.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0
        
        if (isVisible) {
          trackFeatureUsage('book_shelf_scrolled_to')
          // Remove listener after first view
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }
    
    // Add scroll listener with throttling
    let scrollTimeout
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll()
          scrollTimeout = null
        }, 100)
      }
    }
    
    window.addEventListener('scroll', throttledScroll)
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [currentState, session, timeLeft, isRunning, isOvertime])

  // Load data from localStorage on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Check if localStorage is available
        if (!isStorageAvailable()) {
          console.warn('localStorage not available - data will not persist')
          setIsDataLoaded(true)
          return
        }

        // Load saved durations
        const savedDurations = loadDurations()
        if (savedDurations) {
          setDurations(savedDurations)
          // Update timeLeft if we're still in the default state and not running
          if (!isRunning && timeLeft === DEFAULT_DURATIONS[currentState]) {
            setTimeLeft(savedDurations[currentState] || DEFAULT_DURATIONS[currentState])
          }
        }

        // Load saved task
        const savedTask = loadCurrentTask()
        if (savedTask) {
          setCurrentTask(savedTask)
          setFirstTaskInput(false) // User has previously entered a task
        }

        // Load saved session data (only if recent)
        const savedSession = loadSessionData()
        if (savedSession && !isRunning) {
          if (savedSession.currentSession) {
            setSession(savedSession.currentSession)
          }
          if (savedSession.currentState && savedSession.currentState !== currentState) {
            setCurrentState(savedSession.currentState)
            const stateDuration = savedDurations[savedSession.currentState] || DEFAULT_DURATIONS[savedSession.currentState]
            setTimeLeft(stateDuration)
          }
        }

        // Track successful data loading
        trackFeatureUsage('localStorage_load_success')
        
      } catch (error) {
        console.warn('Error loading saved data:', error.message)
        trackFeatureUsage('localStorage_load_error')
      } finally {
        setIsDataLoaded(true)
      }
    }

    loadSavedData()
  }, [])

  // Save durations whenever they change
  useEffect(() => {
    if (isDataLoaded) {
      const success = saveDurations(durations)
      if (success) {
        showSaveIndicator('Settings saved')
      } else {
        showSaveIndicator('Save failed')
      }
      trackFeatureUsage('localStorage_save_durations')
    }
  }, [durations, isDataLoaded, showSaveIndicator])

  // Save current task whenever it changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return

    const timeoutId = setTimeout(() => {
      if (currentTask.trim()) {
        const success = saveCurrentTask(currentTask)
        if (success) {
          showSaveIndicator('Task saved')
        }
        trackFeatureUsage('localStorage_save_task')
      }
    }, 1000) // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId)
  }, [currentTask, isDataLoaded])

  // Save session data periodically and on state changes
  useEffect(() => {
    if (isDataLoaded) {
      const sessionData = {
        currentSession: session,
        currentState: currentState
      }
      saveSessionData(sessionData)
      trackFeatureUsage('localStorage_save_session')
    }
  }, [session, currentState, isDataLoaded])

  // Auto-save when page becomes hidden (user switches tabs/closes browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isDataLoaded) {
        // Save all current data before potentially losing the page
        saveDurations(durations)
        if (currentTask.trim()) {
          saveCurrentTask(currentTask)
        }
        saveSessionData({
          currentSession: session,
          currentState: currentState
        })
        trackFeatureUsage('localStorage_auto_save_on_hide')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [durations, currentTask, session, currentState, isDataLoaded])
  
  // Show loading state while data is being loaded
  if (!isDataLoaded) {
    return (
      <main className="timer-container">
        <div className="loading-state">
          <div className="loading-text">Loading your saved preferences...</div>
          <div className="loading-spinner" aria-hidden="true"></div>
        </div>
      </main>
    )
  }

  // console.log('Rendering with darkMode state:', darkMode) // Debug log (commented out to reduce noise)

  return (
    <main className="timer-container" data-state={currentState} data-overtime={isOvertime} data-running={isRunning}>
      {/* Minimal Dark Mode Toggle */}
      <button
        className="dark-mode-toggle-minimal"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYfCDuX2e6/dSEELYPN8+NnTw0PVqfq8KVMEgs=" type="audio/wav" />
      </audio>
      
      {/* Simplified Header */}
      <header className="timer-header-minimal">
        <div className="timer-state" aria-live="polite">
          {STATE_LABELS[currentState]}
        </div>
      </header>

      {/* Visual Mode Indicator */}
      <div className={`mode-indicator mode-indicator--${currentState}`}>
        <div className="mode-indicator__icon">
          {currentState === TIMER_STATES.WORK ? '🎯' : 
           currentState === TIMER_STATES.SHORT_BREAK ? '☕' : '🌸'}
        </div>
        <div className="mode-indicator__text">
          <div className="mode-indicator__label">
            {currentState === TIMER_STATES.WORK ? 'Focus Time' : 
             currentState === TIMER_STATES.SHORT_BREAK ? 'Short Break' : 'Long Break'}
          </div>
          <div className="mode-indicator__description">
            {currentState === TIMER_STATES.WORK ? 'Time to concentrate and get things done' : 
             currentState === TIMER_STATES.SHORT_BREAK ? 'Take a quick breather and recharge' : 
             'Longer break - step away and refresh'}
          </div>
        </div>
        <div className="mode-indicator__pulse"></div>
      </div>

      {/* Simplified Task Input */}
      {currentState === TIMER_STATES.WORK && !isRunning && (
        <div className="task-input-minimal">
          <input
            id="current-task"
            type="text"
            value={currentTask}
            onChange={handleTaskChange}
            placeholder="What are you working on?"
            maxLength={100}
          />
        </div>
      )}
      
      {/* Current Task Display */}
      {currentTask && isRunning && currentState === TIMER_STATES.WORK && (
        <div className="current-task-minimal" aria-live="polite">
          <span className="task-text-minimal">{currentTask}</span>
        </div>
      )}
      
      {/* Timer Display - The Core Focus */}
      <div className="timer-display-focused">
        <svg 
          className="progress-ring" 
          viewBox="0 0 200 200" 
          aria-hidden="true"
        >
          <circle
            className="progress-ring__background"
            cx="100"
            cy="100"
            r="94"
          />
          <circle
            className="progress-ring__progress"
            cx="100"
            cy="100"
            r="94"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>
        <div className="timer-text" aria-live="off">
          {formatTime(timeLeft)}
        </div>
      </div>
      
      {/* Primary Action Button */}
      <div className="primary-action">
        <button
          className="btn-primary-large"
          onClick={isRunning ? pauseTimer : startTimer}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>
      
      {/* Secondary Controls */}
      <div className="secondary-controls">
        <button
          className="btn-minimal"
          onClick={resetTimer}
          aria-label="Reset current timer"
        >
          Reset
        </button>
        
        <button
          className="btn-minimal"
          onClick={skipToNext}
          aria-label={`Skip to ${currentState === TIMER_STATES.WORK ? 'break' : 'work'}`}
        >
          {currentState === TIMER_STATES.WORK ? 'Break' : 'Focus'}
        </button>
        
        <button
          className={`btn-minimal ${(!isRunning && currentState === TIMER_STATES.WORK) ? '' : 'btn-minimal--disabled'}`}
          onClick={start5MinuteSprint}
          aria-label="5-minute focus"
          title="Quick 5-minute session"
          disabled={isRunning || currentState !== TIMER_STATES.WORK}
        >
          5 min
        </button>
      </div>
      
      {/* Settings - Hidden by default, accessible via keyboard */}
      <details className="settings-collapsed">
        <summary className="settings-toggle">
          Settings
        </summary>
        <div className="timer-settings-minimal">
          <div className="setting-group-minimal">
            <label className="setting-label-minimal">
              Work: {durations[TIMER_STATES.WORK] / 60} min
            </label>
            <input
              className="setting-slider-minimal"
              type="range"
              min="1"
              max="90"
              step="1"
              value={durations[TIMER_STATES.WORK] / 60}
              onChange={(e) => handleDurationChange(TIMER_STATES.WORK, parseInt(e.target.value))}
              aria-label={`Work session duration: ${durations[TIMER_STATES.WORK] / 60} minutes`}
            />
          </div>
          
          <div className="setting-group-minimal">
            <label className="setting-label-minimal">
              Break: {durations[TIMER_STATES.SHORT_BREAK] / 60} min
            </label>
            <input
              className="setting-slider-minimal"
              type="range"
              min="1"
              max="30"
              step="1"
              value={durations[TIMER_STATES.SHORT_BREAK] / 60}
              onChange={(e) => handleDurationChange(TIMER_STATES.SHORT_BREAK, parseInt(e.target.value))}
              aria-label={`Short break duration: ${durations[TIMER_STATES.SHORT_BREAK] / 60} minutes`}
            />
          </div>
        </div>
      </details>

      {/* Minimal Book Recommendations */}
      <div className="book-recommendations-minimal">
        <div className="book-items-minimal">
          <a 
            href="https://amzn.to/4l1wdEs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="book-item-minimal"
            onClick={() => handleAffiliateClick('atomic_habits')}
            title="Atomic Habits by James Clear"
          >
            <span className="book-emoji">📚</span>
            <span className="book-title-minimal">Atomic Habits</span>
          </a>
          
          <a 
            href="https://amzn.to/46dtx1P" 
            target="_blank" 
            rel="noopener noreferrer"
            className="book-item-minimal"
            onClick={() => handleAffiliateClick('deep_work')}
            title="Deep Work by Cal Newport"
          >
            <span className="book-emoji">🧠</span>
            <span className="book-title-minimal">Deep Work</span>
          </a>
          
          <a 
            href="https://amzn.to/4ng5JR6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="book-item-minimal"
            onClick={() => handleAffiliateClick('adhd_advantage')}
            title="The ADHD Advantage by Dale Archer"
          >
            <span className="book-emoji">⚡</span>
            <span className="book-title-minimal">ADHD Advantage</span>
          </a>
        </div>
        
        <p className="affiliate-note-minimal">
          💡 <small>As Amazon Associate, purchases support this free timer</small>
        </p>
      </div>
      
      {/* Status announcements for screen readers */}
      <div 
        className="timer-status-minimal" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>
      
      {/* Save indicator */}
      <div className={`save-indicator ${saveIndicator ? 'show' : ''}`} aria-live="polite">
        {saveIndicator}
      </div>
      
      {/* Test audio button (development only) */}
      {import.meta.env.DEV && (
        <button
          className="btn-minimal"
          onClick={playNotificationSound}
          style={{ position: 'fixed', bottom: '10px', left: '10px', fontSize: '12px', opacity: 0.7 }}
          title="Test notification sound"
        >
          🔔 Test Sound
        </button>
      )}

      {/* Minimal keyboard help */}
      <div className="sr-only">
        Keyboard shortcuts: Space to start/pause, R to reset, S to skip, D for dark mode
      </div>
    </main>
  )
}

function App() {
  return <PomodoroTimer />
}

export default App
