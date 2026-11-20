import { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focus: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

function App() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [settings, setSettings] = useState<TimerSettings>({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
  });
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const getTimeForMode = useCallback((m: TimerMode) => {
    switch (m) {
      case 'focus': return settings.focus * 60;
      case 'shortBreak': return settings.shortBreak * 60;
      case 'longBreak': return settings.longBreak * 60;
    }
  }, [settings]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'focus') {
              setSessionsCompleted((s) => s + 1);
            }
            // Play notification sound
            playNotification();
            return 0;
          }
          return prev - 1;
        });
        if (mode === 'focus') {
          setTotalFocusTime((t) => t + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const playNotification = () => {
    // Create a simple beep using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 300);
    } catch (e) {
      // Silently fail if audio isn't available
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getTimeForMode(newMode));
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getTimeForMode(mode));
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const nextSession = sessionsCompleted + 1;
      if (nextSession % settings.sessionsBeforeLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = getTimeForMode(mode);
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTotalFocus = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus': return { bg: 'from-rose-500 to-orange-500', ring: 'stroke-rose-400', text: 'text-rose-100' };
      case 'shortBreak': return { bg: 'from-emerald-500 to-teal-500', ring: 'stroke-emerald-400', text: 'text-emerald-100' };
      case 'longBreak': return { bg: 'from-blue-500 to-indigo-500', ring: 'stroke-blue-400', text: 'text-blue-100' };
    }
  };

  const colors = getModeColor();
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} transition-all duration-1000 flex flex-col`}>
      {/* Header */}
      <header className="relative flex items-center justify-center px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-lg">☀️</span>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">SunFlow</h1>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Mode Tabs */}
      <div className="flex justify-center px-6 mt-2">
        <div className="bg-white/15 backdrop-blur-md rounded-full p-1 flex gap-1">
          <button
            onClick={() => switchMode('focus')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'focus' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/80 hover:text-white'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'shortBreak' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/80 hover:text-white'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              mode === 'longBreak' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/80 hover:text-white'
            }`}
          >
            Long Break
          </button>
        </div>
      </div>

      {/* Timer Circle */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80">
          {/* SVG Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            {/* Background circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">
              {mode === 'focus' ? '🧠 Focus Time' : mode === 'shortBreak' ? '☕ Short Break' : '🌴 Long Break'}
            </span>
            <span className="text-white text-6xl sm:text-7xl font-bold tracking-tight font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-white/60 text-sm mt-2">
              Session {sessionsCompleted + 1} of {settings.sessionsBeforeLongBreak}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleStartPause}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            {isRunning ? (
              <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 pb-6">
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Sessions</p>
            <p className="text-white text-xl font-bold">{sessionsCompleted}</p>
          </div>
          <div className="w-px h-10 bg-white/20"></div>
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Focus Time</p>
            <p className="text-white text-xl font-bold">{formatTotalFocus(totalFocusTime)}</p>
          </div>
          <div className="w-px h-10 bg-white/20"></div>
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">Streak</p>
            <p className="text-white text-xl font-bold">🔥 {sessionsCompleted > 0 ? Math.min(sessionsCompleted, 7) : 0}</p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Focus Duration (min)</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={settings.focus}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({ ...settings, focus: val });
                    if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full accent-rose-500"
                />
                <span className="text-sm text-gray-500">{settings.focus} minutes</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Short Break (min)</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={settings.shortBreak}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({ ...settings, shortBreak: val });
                    if (mode === 'shortBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full accent-emerald-500"
                />
                <span className="text-sm text-gray-500">{settings.shortBreak} minutes</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Long Break (min)</label>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={settings.longBreak}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({ ...settings, longBreak: val });
                    if (mode === 'longBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full accent-blue-500"
                />
                <span className="text-sm text-gray-500">{settings.longBreak} minutes</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Sessions before Long Break</label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={settings.sessionsBeforeLongBreak}
                  onChange={(e) => {
                    setSettings({ ...settings, sessionsBeforeLongBreak: parseInt(e.target.value) });
                  }}
                  className="w-full accent-purple-500"
                />
                <span className="text-sm text-gray-500">{settings.sessionsBeforeLongBreak} sessions</span>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center pb-4">
        <p className="text-white/40 text-xs">Built in a day • Ship it today 🚀</p>
      </div>
    </div>
  );
}

export default App;
