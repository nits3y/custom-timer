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
  
  // Audio context for generating tick sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Settings state for sound controls
  const [tickSoundEnabled, setTickSoundEnabled] = useState(true);
  
  // Settings panel visibility
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Handle escape key to close settings panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettingsPanel) {
        setShowSettingsPanel(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettingsPanel]);
  
  // Notification sound options
  const notificationSounds = [
    { id: 'wisle', name: 'Wisle', file: '/wisle.mp3' },
    { id: 'sir-jade', name: 'Sir Jade', file: '/sir-jade.mp3' },
    { id: 'none', name: 'No Sound', file: '' }
  ];
  
  // Selected notification sound
  const [selectedNotificationSound, setSelectedNotificationSound] = useState('wisle');
  
  // Audio reference for playing notification sound when timer hits zero
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Initialize audio context for tick sounds
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Function to play a short tick sound using Web Audio API
  const playTickSound = () => {
    if (!tickSoundEnabled || !audioContextRef.current) return;
    
    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect oscillator to gain node to audio destination
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the tick sound (short, crisp beep)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz frequency
      oscillator.type = 'square'; // Square wave for crisp sound
      
      // Set volume envelope for short tick
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // Quick decay
      
      // Play the sound for 0.1 seconds
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Tick sound playback failed:", error);
    }
  };
  
  // Function to play the selected notification sound
  const playNotificationSound = () => {
    const selectedSound = notificationSounds.find(sound => sound.id === selectedNotificationSound);
    
    if (!selectedSound || selectedSound.id === 'none' || !selectedSound.file) return;
    
    if (audioRef.current) {
      // Update the audio source to the selected sound
      audioRef.current.src = selectedSound.file;
      audioRef.current.load(); // Reload the audio element with new source
      
      audioRef.current.play().catch(error => {
        console.log("Notification sound playback failed:", error);
      });
    }
  };
  
  // Timer effect - runs every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      // Countdown logic: decrease time by 1 second
      interval = setInterval(() => {
        setTimeLeft(prev => {
          // Play tick sound when timer decreases (but not at 0)
          if (prev > 1) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer hit zero - play audio and handle auto-restart
      setIsRunning(false);
      
      // Play the selected notification sound
      playNotificationSound();
      
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
        Your browser does not support the audio element.
      </audio>
      
      <div className="h-screen flex">
        {/* Main Timer Display - Full screen, no card */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Settings Icon - Top left */}
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="absolute top-8 left-8 p-3 text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-800"
            aria-label="Open Settings"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Timer Display - Much larger */}
          <div className="text-center">
            <div className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-mono font-bold text-white tracking-wider leading-none">
              {formatTime(timeLeft)}
            </div>
            <div className="text-2xl md:text-3xl text-gray-300 mt-8">
              {timeLeft === 0 ? "Time's Up!" : isRunning ? "Running..." : "Paused"}
            </div>
          </div>
          
          {/* Timer Controls - Larger and more prominent */}
          <div className="flex gap-6 mt-16">
            <button
              onClick={toggleTimer}
              className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all duration-200 shadow-lg ${
                isRunning 
                  ? "bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/25" 
                  : "bg-green-500 hover:bg-green-600 text-white hover:shadow-green-500/25"
              }`}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            
            <button
              onClick={resetTimer}
              className="px-12 py-6 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-bold text-2xl transition-all duration-200 shadow-lg hover:shadow-gray-600/25"
            >
              Reset
            </button>
          </div>
        </div>
        
        {/* Timer Setup Panel - Fixed right sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-8">Timer Setup</h2>
          
          {/* Time Input Section */}
          <div className="mb-8">
            <div className="flex gap-4 mb-6">
              {/* Minutes Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white text-lg"
                />
              </div>
              
              {/* Seconds Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white text-lg"
                />
              </div>
            </div>
            
            {/* Update Timer Button */}
            <button
              onClick={updateTimer}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all duration-200"
            >
              Update Timer
            </button>
          </div>
          
          {/* Current Timer Info */}
          <div className="text-sm text-gray-300 bg-gray-700 rounded-lg p-4 mt-auto">
            <p className="mb-2"><strong>Current Timer:</strong> {formatTime(initialTime)}</p>
            <p><strong>Status:</strong> {isRunning ? "Running" : "Stopped"}</p>
          </div>
        </div>
      </div>
      
      {/* Settings Slide-out Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
        showSettingsPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={() => setShowSettingsPanel(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-800"
            aria-label="Close Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Notification Sound Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 11.293c0 .207-.042.411-.125.602a2.25 2.25 0 01-2.164 1.605H9.75a2.25 2.25 0 01-2.164-1.605 2.25 2.25 0 01-.125-.602V8.25A6.75 6.75 0 0114.25 1.5c.414 0 .75.336.75.75v2.25a.75.75 0 01-.75.75 2.25 2.25 0 00-2.25 2.25v4.543z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">Notification Sound</h3>
            </div>
            <div className="space-y-3 ml-7">
              {notificationSounds.map((sound) => (
                <label key={sound.id} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="notificationSound"
                    value={sound.id}
                    checked={selectedNotificationSound === sound.id}
                    onChange={(e) => setSelectedNotificationSound(e.target.value)}
                    className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {sound.name}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={playNotificationSound}
              disabled={selectedNotificationSound === 'none'}
              className="mt-4 ml-7 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all duration-200"
            >
              {selectedNotificationSound === 'none' ? 'No Sound Selected' : 'Test Sound'}
            </button>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              Plays when timer reaches zero
            </p>
          </div>

          {/* Tick Sound Section */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-white">Tick Sound</span>
              </div>
              <button
                onClick={() => setTickSoundEnabled(!tickSoundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tickSoundEnabled ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tickSoundEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              {tickSoundEnabled 
                ? "Plays every second during countdown" 
                : "Silent countdown"
              }
            </p>
          </div>

          {/* Auto Restart Section */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-lg font-semibold text-white">Auto Restart</span>
              </div>
              <button
                onClick={() => setAutoRestart(!autoRestart)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRestart ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRestart ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              {autoRestart 
                ? "Automatically restarts when timer reaches zero" 
                : "Stops when timer reaches zero"
              }
            </p>
          </div>
          
          {/* Current Settings Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-semibold text-white">Current Settings</h4>
            </div>
            <div className="text-xs text-gray-400 space-y-1 ml-6">
              <p><span className="text-gray-300">Timer:</span> {formatTime(initialTime)}</p>
              <p><span className="text-gray-300">Status:</span> {isRunning ? "Running" : "Stopped"}</p>
              <p><span className="text-gray-300">Notification:</span> {notificationSounds.find(s => s.id === selectedNotificationSound)?.name}</p>
              <p><span className="text-gray-300">Tick Sound:</span> {tickSoundEnabled ? "Enabled" : "Disabled"}</p>
              <p><span className="text-gray-300">Auto Restart:</span> {autoRestart ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay when settings panel is open */}
      {showSettingsPanel && (
        <div 
          className="fixed inset-0 bg-black bg-transparent z-40"
          onClick={() => setShowSettingsPanel(false)}
        />
      )}
    </div>
  );
}
