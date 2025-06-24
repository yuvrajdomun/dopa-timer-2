import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

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
  const [currentState, setCurrentState] = useState(TIMER_STATES.WORK)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS[TIMER_STATES.WORK])
  const [isRunning, setIsRunning] = useState(false)
  const [session, setSession] = useState(1)
  const [durations, setDurations] = useState(DEFAULT_DURATIONS)
  const [isOvertime, setIsOvertime] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  
  const intervalRef = useRef(null)
  const audioRef = useRef(null)
  
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
  
  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    
    // Play notification sound (if audio is enabled)
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Silently fail if audio can't play
      })
    }
    
    // Provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
    
    let nextState
    let message
    
    if (currentState === TIMER_STATES.WORK) {
      // After work, determine break type based on session count
      nextState = session % 4 === 0 ? TIMER_STATES.LONG_BREAK : TIMER_STATES.SHORT_BREAK
      message = `Focus session complete! Time for a ${nextState === TIMER_STATES.LONG_BREAK ? 'long' : 'short'} break.`
    } else {
      // After any break, go to work
      nextState = TIMER_STATES.WORK
      setSession(prev => prev + 1)
      message = 'Break over, focus time!'
    }
    
    setCurrentState(nextState)
    setTimeLeft(durations[nextState])
    setIsOvertime(false)
    setStatusMessage(message)
    
    // Clear status message after 5 seconds
    setTimeout(() => setStatusMessage(''), 5000)
  }, [currentState, session, durations])
  
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
  
  // Control functions
  const startTimer = () => {
    setIsRunning(true)
    setStatusMessage('')
  }
  
  const pauseTimer = () => {
    setIsRunning(false)
  }
  
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(durations[currentState])
    setIsOvertime(false)
    setStatusMessage('')
  }
  
  const skipToNext = () => {
    handleTimerComplete()
  }
  
  const handleDurationChange = (state, minutes) => {
    const seconds = Math.max(1, Math.min(99, minutes)) * 60
    setDurations(prev => ({ ...prev, [state]: seconds }))
    
    // Update current timer if we're in that state and not running
    if (state === currentState && !isRunning) {
      setTimeLeft(seconds)
      setIsOvertime(false)
    }
  }
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.type === 'number') return // Don't interfere with input fields
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          isRunning ? pauseTimer() : startTimer()
          break
        case 'r':
          if (e.ctrlKey || e.metaKey) return // Don't interfere with browser refresh
          e.preventDefault()
          resetTimer()
          break
        case 's':
          e.preventDefault()
          skipToNext()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning])
  
  return (
    <main className="timer-container" data-state={currentState} data-overtime={isOvertime}>
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYfCDuX2e6/dSEELYPN8+NnTw0PVqfq8KVMEgs=" type="audio/wav" />
      </audio>
      
      <header className="timer-header">
        <h1 className="timer-title">ADHD Focus Timer</h1>
        <div className="timer-state" aria-live="polite">
          {STATE_LABELS[currentState]}
        </div>
        <div className="session-info">
          Session {session} • Pomodoro {Math.ceil(session / 4)}
        </div>
      </header>
      
      <div className="timer-display">
        <svg className="progress-ring" aria-hidden="true">
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
      
      <div className="timer-controls">
        <button
          className="btn btn-primary"
          onClick={isRunning ? pauseTimer : startTimer}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={resetTimer}
          aria-label="Reset current timer"
        >
          Reset
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={skipToNext}
          aria-label={`Skip to ${currentState === TIMER_STATES.WORK ? 'break' : 'work'}`}
        >
          Skip
        </button>
      </div>
      
      <div className="timer-settings">
        <div className="setting-group">
          <label className="setting-label" htmlFor="work-duration">
            Work (min)
          </label>
          <input
            id="work-duration"
            className="setting-input"
            type="number"
            min="1"
            max="99"
            value={durations[TIMER_STATES.WORK] / 60}
            onChange={(e) => handleDurationChange(TIMER_STATES.WORK, parseInt(e.target.value) || 25)}
          />
        </div>
        
        <div className="setting-group">
          <label className="setting-label" htmlFor="short-break-duration">
            Short Break (min)
          </label>
          <input
            id="short-break-duration"
            className="setting-input"
            type="number"
            min="1"
            max="99"
            value={durations[TIMER_STATES.SHORT_BREAK] / 60}
            onChange={(e) => handleDurationChange(TIMER_STATES.SHORT_BREAK, parseInt(e.target.value) || 5)}
          />
        </div>
        
        <div className="setting-group">
          <label className="setting-label" htmlFor="long-break-duration">
            Long Break (min)
          </label>
          <input
            id="long-break-duration"
            className="setting-input"
            type="number"
            min="1"
            max="99"
            value={durations[TIMER_STATES.LONG_BREAK] / 60}
            onChange={(e) => handleDurationChange(TIMER_STATES.LONG_BREAK, parseInt(e.target.value) || 15)}
          />
        </div>
      </div>
      
      {/* Status announcements for screen readers */}
      <div 
        className="timer-status" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        Keyboard shortcuts: Space to start/pause, R to reset, S to skip
      </div>
    </main>
  )
}

function App() {
  return <PomodoroTimer />
}

export default App
