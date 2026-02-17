/**
 * PlumberPass - Audio Engine (Phantom Mode)
 * Text-to-Speech and Speech-to-Text functionality
 * Optimized for hands-free commute/chore studying
 * @version 1.0.0
 * @module AudioEngine
 */

(function(global) {
  'use strict';

  // ============================================
  // CONSTANTS & CONFIGURATION
  // ============================================
  const AUDIO_CONFIG = {
    // Default TTS settings
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 1.0,
    
    // Speed limits
    MIN_RATE: 0.5,
    MAX_RATE: 1.5,
    
    // Pause durations (in ms)
    PAUSE_QUESTION_TO_CHOICES: 500,
    PAUSE_CHOICE_TO_CHOICE: 300,
    PAUSE_AFTER_QUESTION: 800,
    PAUSE_AFTER_FEEDBACK: 1000,
    
    // Voice recognition settings
    RECOGNITION_LANG: 'en-PH', // Philippine English
    RECOGNITION_TIMEOUT: 10000, // 10 seconds
    
    // Answer keywords
    ANSWER_KEYWORDS: {
      'a': ['a', 'ay', 'eh', 'ey'],
      'b': ['b', 'bee', 'be', 'bi'],
      'c': ['c', 'see', 'sea', 'si', 'cee'],
      'd': ['d', 'dee', 'di', 'the'],
      'e': ['e', 'ee', 'ey', 'ei']
    }
  };

  // Audio states
  const AUDIO_STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    SPEAKING: 'speaking',
    LISTENING: 'listening',
    PAUSED: 'paused',
    ERROR: 'error'
  };

  // ============================================
  // AUDIO ENGINE CLASS
  // ============================================
  class AudioEngine {
    constructor() {
      this.state = AUDIO_STATE.IDLE;
      this.synth = window.speechSynthesis;
      this.recognition = null;
      this.currentUtterance = null;
      this.voices = [];
      this.preferredVoice = null;
      this.settings = this.loadSettings();
      
      // Tap pattern recognition for Phantom Mode
      this.tapPattern = {
        taps: [],
        timeout: null,
        LONG_PRESS_MS: 600,
        PATTERN_TIMEOUT_MS: 800
      };
      
      // Callbacks
      this.onStateChange = null;
      this.onAnswerDetected = null;
      this.onError = null;
      this.onComplete = null;
      
      this.init();
    }

    /**
     * Initialize the audio engine
     */
    async init() {
      // Load available voices
      await this.loadVoices();
      
      // Initialize speech recognition if available
      this.initSpeechRecognition();
      
      // Set up media session for lock screen controls
      this.setupMediaSession();
      
      console.log('[AudioEngine] Initialized');
    }

    /**
     * Load available TTS voices
     */
    loadVoices() {
      return new Promise((resolve) => {
        const load = () => {
          this.voices = this.synth.getVoices();
          
          // Prefer English voices
          this.preferredVoice = this.voices.find(v => 
            v.lang.startsWith('en') && v.name.includes('Google')
          ) || this.voices.find(v => 
            v.lang.startsWith('en')
          ) || this.voices[0];
          
          resolve(this.voices);
        };

        if (this.synth.getVoices().length > 0) {
          load();
        } else {
          this.synth.addEventListener('voiceschanged', load, { once: true });
        }
      });
    }

    /**
     * Get list of available voices
     */
    getVoices() {
      return this.voices;
    }

    /**
     * Set preferred voice
     */
    setVoice(voiceName) {
      const voice = this.voices.find(v => v.name === voiceName);
      if (voice) {
        this.preferredVoice = voice;
        this.settings.voice = voiceName;
        this.saveSettings();
      }
    }

    /**
     * Initialize Web Speech API for recognition
     */
    initSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('[AudioEngine] Speech recognition not supported');
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = AUDIO_CONFIG.RECOGNITION_LANG;
      this.recognition.maxAlternatives = 3;

      this.recognition.onresult = (event) => this.handleRecognitionResult(event);
      this.recognition.onerror = (event) => this.handleRecognitionError(event);
      this.recognition.onend = () => {
        if (this.state === AUDIO_STATE.LISTENING) {
          this.setState(AUDIO_STATE.IDLE);
        }
      };
    }

    /**
     * Setup Media Session API for lock screen controls
     */
    setupMediaSession() {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'PlumberPass Study Session',
          artist: 'Master Plumber Reviewer',
          album: 'Audio Mode',
          artwork: [
            { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => this.resume());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (this.onComplete) this.onComplete('skip');
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (this.onComplete) this.onComplete('repeat');
        });
      }
    }

    // ============================================
    // TEXT-TO-SPEECH
    // ============================================

    /**
     * Speak a question with choices
     * @param {Object} question - Question object
     * @returns {Promise}
     */
    async speakQuestion(question) {
      if (!this.synth) {
        throw new Error('Speech synthesis not available');
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const { prompt, choices } = question;
      
      // Build speech sequence
      const sequence = [
        { text: 'Question.', pause: 200 },
        { text: prompt, pause: AUDIO_CONFIG.PAUSE_QUESTION_TO_CHOICES },
        { text: 'Choices:', pause: 300 }
      ];

      // Add each choice
      choices.forEach((choice, i) => {
        sequence.push({
          text: `${choice.label}. ${choice.text}`,
          pause: i === choices.length - 1 ? AUDIO_CONFIG.PAUSE_AFTER_QUESTION : AUDIO_CONFIG.PAUSE_CHOICE_TO_CHOICE
        });
      });

      this.setState(AUDIO_STATE.SPEAKING);

      // Speak sequence
      for (const item of sequence) {
        await this.speak(item.text, item.pause);
      }

      this.setState(AUDIO_STATE.IDLE);
      
      if (this.onComplete) {
        this.onComplete('question-spoken');
      }
    }

    /**
     * Speak feedback for an answer
     * @param {boolean} isCorrect - Whether answer was correct
     * @param {string} correctAnswer - The correct answer letter
     * @param {string} explanation - Optional explanation
     */
    async speakFeedback(isCorrect, correctAnswer, explanation = null) {
      const feedback = isCorrect 
        ? 'Correct! Well done.' 
        : `Incorrect. The correct answer is ${correctAnswer}.`;
      
      await this.speak(feedback, 500);

      if (explanation && this.settings.readExplanations) {
        await this.speak('Explanation:', 200);
        await this.speak(explanation, AUDIO_CONFIG.PAUSE_AFTER_FEEDBACK);
      }

      if (this.onComplete) {
        this.onComplete('feedback-spoken');
      }
    }

    /**
     * Speak a single utterance
     * @param {string} text - Text to speak
     * @param {number} pauseAfter - Pause duration after speaking (ms)
     * @returns {Promise}
     */
    speak(text, pauseAfter = 0) {
      return new Promise((resolve, reject) => {
        if (!this.synth) {
          reject(new Error('Speech synthesis not available'));
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.preferredVoice;
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;

        utterance.onstart = () => {
          this.currentUtterance = utterance;
        };

        utterance.onend = () => {
          this.currentUtterance = null;
          if (pauseAfter > 0) {
            setTimeout(resolve, pauseAfter);
          } else {
            resolve();
          }
        };

        utterance.onerror = (event) => {
          this.currentUtterance = null;
          if (event.error !== 'canceled') {
            reject(event);
          } else {
            resolve();
          }
        };

        this.synth.speak(utterance);
      });
    }

    /**
     * Stop speaking
     */
    stop() {
      if (this.synth) {
        this.synth.cancel();
      }
      this.currentUtterance = null;
      this.setState(AUDIO_STATE.IDLE);
    }

    /**
     * Pause speaking
     */
    pause() {
      if (this.synth && this.state === AUDIO_STATE.SPEAKING) {
        this.synth.pause();
        this.setState(AUDIO_STATE.PAUSED);
      }
    }

    /**
     * Resume speaking
     */
    resume() {
      if (this.synth && this.state === AUDIO_STATE.PAUSED) {
        this.synth.resume();
        this.setState(AUDIO_STATE.SPEAKING);
      }
    }

    // ============================================
    // SPEECH-TO-TEXT (VOICE ANSWERS)
    // ============================================

    /**
     * Start listening for voice answer
     * @param {number} timeout - Timeout in milliseconds
     */
    startListening(timeout = AUDIO_CONFIG.RECOGNITION_TIMEOUT) {
      if (!this.recognition) {
        if (this.onError) {
          this.onError('Speech recognition not available');
        }
        return false;
      }

      try {
        this.recognition.start();
        this.setState(AUDIO_STATE.LISTENING);

        // Set timeout
        if (timeout > 0) {
          setTimeout(() => {
            if (this.state === AUDIO_STATE.LISTENING) {
              this.stopListening();
            }
          }, timeout);
        }

        return true;
      } catch (e) {
        console.error('[AudioEngine] Recognition start failed:', e);
        return false;
      }
    }

    /**
     * Stop listening
     */
    stopListening() {
      if (this.recognition && this.state === AUDIO_STATE.LISTENING) {
        try {
          this.recognition.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
        this.setState(AUDIO_STATE.IDLE);
      }
    }

    /**
     * Handle recognition results
     */
    handleRecognitionResult(event) {
      const results = event.results;
      if (!results.length) return;

      const transcript = results[0][0].transcript.trim().toLowerCase();
      const confidence = results[0][0].confidence;
      
      console.log('[AudioEngine] Heard:', transcript, 'Confidence:', confidence);

      // Parse answer from transcript
      const answer = this.parseAnswer(transcript);

      if (answer && this.onAnswerDetected) {
        this.onAnswerDetected({
          answer,
          transcript,
          confidence,
          alternatives: Array.from(results[0]).slice(1).map(r => r.transcript)
        });
      } else if (this.onError) {
        this.onError('Could not parse answer. Please say A, B, C, D, or E.');
      }

      this.setState(AUDIO_STATE.IDLE);
    }

    /**
     * Handle recognition errors
     */
    handleRecognitionError(event) {
      console.error('[AudioEngine] Recognition error:', event.error);
      
      if (this.onError) {
        const errorMessages = {
          'no-speech': 'No speech detected. Please try again.',
          'audio-capture': 'Could not access microphone.',
          'not-allowed': 'Microphone permission denied.',
          'network': 'Network error. Using tap input instead.',
          'aborted': 'Listening cancelled.'
        };
        
        this.onError(errorMessages[event.error] || 'Recognition error: ' + event.error);
      }

      this.setState(AUDIO_STATE.IDLE);
    }

    /**
     * Parse answer letter from transcript
     * @param {string} transcript 
     * @returns {string|null} Answer letter (A-E) or null
     */
    parseAnswer(transcript) {
      // Direct letter match
      const directMatch = transcript.match(/\b([abcde])\b/i);
      if (directMatch) {
        return directMatch[1].toUpperCase();
      }

      // Keyword matching
      for (const [letter, keywords] of Object.entries(AUDIO_CONFIG.ANSWER_KEYWORDS)) {
        for (const keyword of keywords) {
          if (transcript.includes(keyword)) {
            return letter.toUpperCase();
          }
        }
      }

      // Number to letter conversion (1=A, 2=B, etc.)
      const numberMatch = transcript.match(/\b([1-5])\b/);
      if (numberMatch) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        return letters[parseInt(numberMatch[1]) - 1];
      }

      return null;
    }

    // ============================================
    // PHANTOM MODE - TAP PATTERNS
    // ============================================

    /**
     * Handle tap/click for Phantom Mode
     * Implements pattern recognition for hands-free answering
     * @param {Event} event - The tap/click event
     */
    handlePhantomTap(event) {
      const now = Date.now();
      
      // Clear existing timeout
      if (this.tapPattern.timeout) {
        clearTimeout(this.tapPattern.timeout);
      }

      // Check for long press
      if (event.type === 'mousedown' || event.type === 'touchstart') {
        this.tapPattern.pressStart = now;
        
        this.tapPattern.longPressTimeout = setTimeout(() => {
          // Long press detected
          this.tapPattern.taps = [];
          if (this.onAnswerDetected) {
            this.onAnswerDetected({ pattern: 'long-press', action: 'repeat' });
          }
        }, this.tapPattern.LONG_PRESS_MS);
        
        return;
      }

      // Cancel long press check on release
      if (event.type === 'mouseup' || event.type === 'touchend') {
        if (this.tapPattern.longPressTimeout) {
          clearTimeout(this.tapPattern.longPressTimeout);
          this.tapPattern.longPressTimeout = null;
        }

        // If it was a short press, count as tap
        const pressDuration = now - (this.tapPattern.pressStart || now);
        if (pressDuration < this.tapPattern.LONG_PRESS_MS) {
          this.tapPattern.taps.push(now);
        }
        
        this.tapPattern.pressStart = null;
      }

      // Set pattern timeout
      this.tapPattern.timeout = setTimeout(() => {
        this.processTapPattern();
      }, this.tapPattern.PATTERN_TIMEOUT_MS);
    }

    /**
     * Process completed tap pattern
     */
    processTapPattern() {
      const tapCount = this.tapPattern.taps.length;
      this.tapPattern.taps = [];

      if (tapCount === 0) return;

      const answers = ['A', 'B', 'C', 'D', 'E'];
      const answer = answers[tapCount - 1];

      if (answer && this.onAnswerDetected) {
        this.onAnswerDetected({
          answer,
          pattern: `${tapCount}-tap`,
          taps: tapCount
        });
      }
    }

    // ============================================
    // WAKE LOCK (Keep screen on during study)
    // ============================================

    async requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
          console.log('[AudioEngine] Wake lock acquired');
          
          this.wakeLock.addEventListener('release', () => {
            console.log('[AudioEngine] Wake lock released');
          });
        } catch (e) {
          console.warn('[AudioEngine] Wake lock failed:', e);
        }
      }
    }

    releaseWakeLock() {
      if (this.wakeLock) {
        this.wakeLock.release();
        this.wakeLock = null;
      }
    }

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================

    loadSettings() {
      const defaults = {
        rate: AUDIO_CONFIG.DEFAULT_RATE,
        pitch: AUDIO_CONFIG.DEFAULT_PITCH,
        volume: AUDIO_CONFIG.DEFAULT_VOLUME,
        voice: null,
        readExplanations: true,
        autoAdvance: true
      };

      try {
        const saved = localStorage.getItem('pp_audio_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
      } catch {
        return defaults;
      }
    }

    saveSettings() {
      try {
        localStorage.setItem('pp_audio_settings', JSON.stringify(this.settings));
      } catch (e) {
        console.error('[AudioEngine] Failed to save settings:', e);
      }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
    }

    setRate(rate) {
      this.settings.rate = Math.max(
        AUDIO_CONFIG.MIN_RATE,
        Math.min(AUDIO_CONFIG.MAX_RATE, rate)
      );
      this.saveSettings();
      return this.settings.rate;
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    setState(newState) {
      const oldState = this.state;
      this.state = newState;
      
      if (this.onStateChange) {
        this.onStateChange(newState, oldState);
      }

      // Update media session playback state
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 
          newState === AUDIO_STATE.SPEAKING ? 'playing' : 'paused';
      }
    }

    getState() {
      return this.state;
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Check if audio features are supported
     */
    static isSupported() {
      return {
        tts: 'speechSynthesis' in window,
        stt: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        wakeLock: 'wakeLock' in navigator,
        mediaSession: 'mediaSession' in navigator
      };
    }

    /**
     * Preload voices (useful for mobile)
     */
    preload() {
      if (this.synth) {
        // Speak a silent utterance to initialize
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        this.synth.speak(silent);
      }
    }
  }

  // ============================================
  // EXPOSE TO GLOBAL
  // ============================================
  global.AudioEngine = AudioEngine;
  global.AUDIO_STATE = AUDIO_STATE;
  global.AUDIO_CONFIG = AUDIO_CONFIG;

})(typeof window !== 'undefined' ? window : global);
