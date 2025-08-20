"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  // Timer state management
  const [timeLeft, setTimeLeft] = useState(300); // Default 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300); // Store the initial time for auto-restart
  const [isRunning, setIsRunning] = useState(false); // Track if timer is running
  const [autoRestart, setAutoRestart] = useState(true); // Auto-restart feature toggle
  
  // Settings state for time input
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  
  // Audio reference for playing sound when timer hits zero
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Timer effect - runs every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      // Countdown logic: decrease time by 1 second
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer hit zero - play audio and handle auto-restart
      setIsRunning(false);
      
      // Play the notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log("Audio playback failed:", error);
        });
      }
      
      // Auto-restart if enabled
      if (autoRestart) {
        setTimeout(() => {
          setTimeLeft(initialTime);
          setIsRunning(true);
        }, 1000); // Wait 1 second before restarting
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, autoRestart, initialTime]);
  
  // Format time for display (MM:SS)
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start/pause timer function
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  // Reset timer to initial time
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };
  
  // Update timer with new time settings
  const updateTimer = () => {
    const newTime = minutes * 60 + seconds;
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      {/* Hidden audio element for playing notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/sir-jade.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="container mx-auto max-w-6xl h-screen flex items-center justify-center">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full">
          
          {/* Main Timer Display - Large and prominent */}
          <div className="flex-1 flex flex-col items-center">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 text-center">
              {/* Timer Display */}
              <div className="mb-8">
                <div className="text-8xl lg:text-9xl font-mono font-bold text-gray-800 dark:text-white tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xl text-gray-500 dark:text-gray-400 mt-4">
                  {timeLeft === 0 ? "Time's Up!" : isRunning ? "Running..." : "Paused"}
                </div>
              </div>
              
              {/* Timer Controls */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={toggleTimer}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    isRunning 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isRunning ? "Pause" : "Start"}
                </button>
                
                <button
                  onClick={resetTimer}
                  className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Settings Panel - Positioned beside the timer */}
          <div className="w-full lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>
              
              {/* Time Input Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Set Timer</h3>
                
                <div className="flex gap-4 mb-4">
                  {/* Minutes Input */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* Seconds Input */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Seconds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* Update Timer Button */}
                <button
                  onClick={updateTimer}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Update Timer
                </button>
              </div>
              
              {/* Auto-restart Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Auto Restart
                  </span>
                  <button
                    onClick={() => setAutoRestart(!autoRestart)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRestart ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRestart ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {autoRestart 
                    ? "Timer will automatically restart when it reaches zero" 
                    : "Timer will stop when it reaches zero"
                  }
                </p>
              </div>
              
              {/* Timer Info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2"><strong>Current Timer:</strong> {formatTime(initialTime)}</p>
                <p className="mb-2"><strong>Status:</strong> {isRunning ? "Running" : "Stopped"}</p>
                <p><strong>Auto Restart:</strong> {autoRestart ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
