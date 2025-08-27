"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(300);
  const [initialTime, setInitialTime] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRestart, setAutoRestart] = useState(true);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [tickSoundEnabled, setTickSoundEnabled] = useState(true);
  const [voiceCountdownEnabled, setVoiceCountdownEnabled] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettingsPanel) {
        setShowSettingsPanel(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSettingsPanel]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const notificationSounds = useMemo(() => [
    { id: 'wisle', name: 'Wisle', file: '/wisle.mp3' },
    { id: 'sir-jade', name: 'Sir Jade', file: '/sir-jade.mp3' },
    { id: 'none', name: 'No Sound', file: '' }
  ], []);
  
  const [selectedNotificationSound, setSelectedNotificationSound] = useState('wisle');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  const playTickSound = useCallback(() => {
    if (!tickSoundEnabled || !audioContextRef.current) return;
    
    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Tick sound playback failed:", error);
    }
  }, [tickSoundEnabled]);
  
  const playNotificationSound = useCallback(() => {
    const selectedSound = notificationSounds.find(sound => sound.id === selectedNotificationSound);
    
    if (!selectedSound || selectedSound.id === 'none' || !selectedSound.file) return;
    
    if (audioRef.current) {
      audioRef.current.src = selectedSound.file;
      audioRef.current.load();
      
      audioRef.current.play().catch(error => {
        console.log("Notification sound playback failed:", error);
      });
    }
  }, [selectedNotificationSound, notificationSounds]);

  // Voice countdown function using Web Speech API
  const speakCountdown = useCallback((number: number) => {
    if (!voiceCountdownEnabled || typeof window === 'undefined') return;
    
    try {
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(number.toString());
        
        // Configure voice settings for clear countdown
        utterance.rate = 1.0;        
        utterance.pitch = 1.5;       
        utterance.volume = 2.0;      
        utterance.lang = 'en-US';    
        
        // Speak the number
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.log("Voice countdown failed:", error);
    }
  }, [voiceCountdownEnabled]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Play tick sound logic:
          // - If voice countdown is enabled: only play tick sound when time > 5 seconds
          // - If voice countdown is disabled: play tick sound for all seconds > 0
          if (newTime > 0) {
            if (voiceCountdownEnabled && newTime <= 5) {
              // Skip tick sound during final 5 seconds when voice countdown is enabled
            } else {
              playTickSound();
            }
          }
          
          // Voice countdown for final 5 seconds (5, 4, 3, 2, 1) - only when enabled
          if (voiceCountdownEnabled && newTime >= 1 && newTime <= 5) {
            speakCountdown(newTime);
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playNotificationSound();
      
      if (autoRestart) {
        setTimeout(() => {
          setTimeLeft(initialTime);
          setIsRunning(true);
        }, 1000);
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, autoRestart, initialTime, playTickSound, playNotificationSound, speakCountdown, voiceCountdownEnabled]);
  
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };
  
  const updateTimer = () => {
    const newTime = minutes * 60 + seconds;
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4 overflow-hidden">
      <audio ref={audioRef} preload="auto">
        Your browser does not support the audio element.
      </audio>
      
      <div className="h-screen flex flex-col lg:flex-row">
        <div className={`flex-1 flex flex-col items-center justify-center relative min-h-[50vh] lg:min-h-0 transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <button
            onClick={() => setShowSettingsPanel(true)}
            className={`absolute top-4 left-4 sm:top-8 sm:left-8 p-2 sm:p-3 text-gray-400 hover:text-white transition-all duration-700 rounded-lg hover:bg-gray-800 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
            aria-label="Open Settings"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <div className="text-center px-4">
            <div className={`text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[12rem] 2xl:text-[16rem] font-mono font-bold text-white tracking-wider leading-none transition-all duration-1200 delay-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className={`text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mt-4 sm:mt-6 lg:mt-8 transition-all duration-800 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {timeLeft === 0 ? "Time's Up!" : isRunning ? "Running..." : "Paused"}
            </div>
          </div>
              
          <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 sm:mt-12 lg:mt-16 px-4 transition-all duration-1000 delay-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <button
              onClick={toggleTimer}
              className={`px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl lg:text-2xl transition-all duration-200 shadow-lg w-full sm:w-auto ${
                isRunning 
                  ? "bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/25" 
                  : "bg-green-500 hover:bg-green-600 text-white hover:shadow-green-500/25"
              }`}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={resetTimer}
              className="px-8 sm:px-12 py-4 sm:py-6 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-bold text-lg sm:text-xl lg:text-2xl transition-all duration-200 shadow-lg hover:shadow-gray-600/25 w-full sm:w-auto"
            >
              Reset
            </button>
          </div>
          
          <div className={`absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-300">
                  Made by <span className="text-white font-semibold">Yestin Prado</span>
                </span>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
         <div className={`w-full lg:w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-t lg:border-t-0 lg:border-l border-gray-600/50 p-4 sm:p-6 flex flex-col lg:rounded-l-2xl rounded-t-2xl lg:rounded-t-none transition-all duration-1000 delay-200 ${
           isLoaded ? 'opacity-100 translate-y-0 lg:translate-y-0 lg:translate-x-0' : 'opacity-0 translate-y-8 lg:translate-y-0 lg:translate-x-8'
         }`}>
                      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <h2 className="text-xl sm:text-2xl font-bold text-white">Timer Setup</h2>
           </div>
              
              {/* Time Input Section */}
           <div className="mb-6">
             <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 backdrop-blur-sm">
               <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
                 <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                 </svg>
                 Set Duration
               </h3>
               
               <div className="flex gap-4 mb-4">
                  {/* Minutes Input */}
                  <div className="flex-1">
                   <label className="block text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wider">
                      Minutes
                    </label>
                   <div className="relative">
                                         <input
                       type="number"
                       min="0"
                       max="59"
                       value={minutes}
                       onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                       className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-lg font-mono text-center transition-all duration-200"
                     />
                     <div className="absolute -bottom-6 left-0 right-0 text-center">
                       <span className="text-xs text-gray-500">min</span>
                     </div>
                   </div>
                 </div>
                 
                 {/* Colon separator */}
                 <div className="flex items-center pt-6">
                   <span className="text-3xl font-bold text-gray-400">:</span>
                  </div>
                  
                  {/* Seconds Input */}
                  <div className="flex-1">
                   <label className="block text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wider">
                      Seconds
                    </label>
                   <div className="relative">
                                         <input
                       type="number"
                       min="0"
                       max="59"
                       value={seconds}
                       onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                       className="w-full px-4 py-3 bg-gray-900/80 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-lg font-mono text-center transition-all duration-200"
                     />
                     <div className="absolute -bottom-6 left-0 right-0 text-center">
                       <span className="text-xs text-gray-500">sec</span>
                     </div>
                   </div>
                  </div>
                </div>
                
                               {/* Update Timer Button */}
               <button
                 onClick={updateTimer}
                 className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-base transition-all duration-200 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
               >
                 <div className="flex items-center justify-center space-x-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                   <span>Update Timer</span>
                 </div>
               </button>
             </div>
           </div>
           
           {/* Quick Presets */}
                       <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <svg className="w-4 h-4 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Presets
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
               {[
                 { label: "25 sec", mins: 0, secs: 25 },
                 { label: "1 min", mins: 1, secs: 0 },
                 { label: "5 min", mins: 5, secs: 0 },
                 { label: "10 min", mins: 10, secs: 0 }
               ].map((preset) => (
                 <button
                   key={preset.label}
                   onClick={() => {
                     setMinutes(preset.mins);
                     setSeconds(preset.secs);
                     const newTime = preset.mins * 60 + preset.secs;
                     setInitialTime(newTime);
                     setTimeLeft(newTime);
                     setIsRunning(false);
                   }}
                   className="px-3 py-2 bg-gray-700/50 hover:bg-purple-600/30 border border-gray-600/50 hover:border-purple-500/50 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
                 >
                   {preset.label}
                 </button>
               ))}
             </div>
           </div>
           
           {/* Current Timer Info */}
           <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30 rounded-xl p-4 mt-auto backdrop-blur-sm">
             <div className="flex items-center space-x-2 mb-3">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
               <h4 className="text-sm font-semibold text-gray-200">Status</h4>
             </div>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-gray-400">Timer:</span>
                 <span className="text-white font-mono">{formatTime(initialTime)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-400">Status:</span>
                 <span className={`font-medium ${isRunning ? 'text-green-400' : 'text-gray-300'}`}>
                   {isRunning ? "Running" : "Stopped"}
                 </span>
               </div>
             </div>
           </div>
         </div>
      </div>
      
             <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-gray-900 border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
         showSettingsPanel ? 'translate-x-0' : 'translate-x-full'
       }`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-lg sm:text-xl font-bold text-white">Settings</h2>
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
              
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
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

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-lg font-semibold text-white">Voice Countdown</span>
              </div>
              <button
                onClick={() => setVoiceCountdownEnabled(!voiceCountdownEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  voiceCountdownEnabled ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    voiceCountdownEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              {voiceCountdownEnabled 
                ? "Speaks numbers 5, 4, 3, 2, 1 during final countdown" 
                : "Silent final countdown"
              }
            </p>
          </div>

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
              <p><span className="text-gray-300">Voice Countdown:</span> {voiceCountdownEnabled ? "Enabled" : "Disabled"}</p>
              <p><span className="text-gray-300">Auto Restart:</span> {autoRestart ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>
      </div>

      {showSettingsPanel && (
        <div 
          className="fixed inset-0 bg-black bg-transparent z-40"
          onClick={() => setShowSettingsPanel(false)}
        />
      )}
    </div>
  );
}
