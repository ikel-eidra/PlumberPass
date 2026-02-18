/**
 * Tests for the Audio Engine
 * Run with: npm test (or vitest/jest)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Web Speech API
global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  }
  
  onstart() {}
  onend() {}
  onerror() {}
};

global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
};

global.SpeechRecognition = class {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-PH';
  }
  
  start() {}
  stop() {}
  onresult() {}
  onerror() {}
  onend() {}
};

describe('AudioEngine', () => {
  let AudioEngine;
  
  beforeEach(async () => {
    // Import the module fresh for each test
    vi.resetModules();
    const module = await import('../../frontend/public/js/audio-engine.js');
    AudioEngine = module.AudioEngine;
  });
  
  describe('Answer Parsing', () => {
    it('should parse direct letter answers', () => {
      const engine = new AudioEngine();
      
      expect(engine.parseAnswer('the answer is A')).toBe('A');
      expect(engine.parseAnswer('I choose B')).toBe('B');
      expect(engine.parseAnswer('C')).toBe('C');
    });
    
    it('should parse phonetic variants', () => {
      const engine = new AudioEngine();
      
      expect(engine.parseAnswer('bee')).toBe('B');
      expect(engine.parseAnswer('see')).toBe('C');
      expect(engine.parseAnswer('dee')).toBe('D');
    });
    
    it('should parse numeric answers', () => {
      const engine = new AudioEngine();
      
      expect(engine.parseAnswer('number 1')).toBe('A');
      expect(engine.parseAnswer('option 2')).toBe('B');
    });
    
    it('should return null for unclear input', () => {
      const engine = new AudioEngine();
      
      expect(engine.parseAnswer('I do not know')).toBeNull();
      expect(engine.parseAnswer('')).toBeNull();
      expect(engine.parseAnswer('hello world')).toBeNull();
    });
  });
  
  describe('Settings Management', () => {
    it('should load default settings', () => {
      const engine = new AudioEngine();
      
      expect(engine.settings.rate).toBe(1.0);
      expect(engine.settings.pitch).toBe(1.0);
      expect(engine.settings.volume).toBe(1.0);
    });
    
    it('should clamp rate to valid range', () => {
      const engine = new AudioEngine();
      
      expect(engine.setRate(0.1)).toBe(0.5);  // Min clamp
      expect(engine.setRate(2.0)).toBe(1.5);  // Max clamp
      expect(engine.setRate(1.0)).toBe(1.0);  // Normal
    });
  });
  
  describe('State Management', () => {
    it('should start in idle state', () => {
      const engine = new AudioEngine();
      
      expect(engine.getState()).toBe('idle');
    });
    
    it('should track state changes', () => {
      const engine = new AudioEngine();
      const onStateChange = vi.fn();
      engine.onStateChange = onStateChange;
      
      engine.setState('speaking');
      
      expect(engine.getState()).toBe('speaking');
      expect(onStateChange).toHaveBeenCalledWith('speaking', 'idle');
    });
  });
});

describe('Phantom Tap Patterns', () => {
  let AudioEngine;
  
  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../../frontend/public/js/audio-engine.js');
    AudioEngine = module.AudioEngine;
  });
  
  it('should detect single tap as answer A', () => {
    const engine = new AudioEngine();
    const onAnswer = vi.fn();
    engine.onAnswerDetected = onAnswer;
    
    // Simulate single tap
    engine.tapPattern.taps = [Date.now()];
    engine.processTapPattern();
    
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({
      answer: 'A',
      pattern: '1-tap'
    }));
  });
  
  it('should detect two taps as answer B', () => {
    const engine = new AudioEngine();
    const onAnswer = vi.fn();
    engine.onAnswerDetected = onAnswer;
    
    // Simulate two taps
    engine.tapPattern.taps = [Date.now(), Date.now()];
    engine.processTapPattern();
    
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({
      answer: 'B',
      pattern: '2-tap'
    }));
  });
  
  it('should detect long press as repeat', () => {
    const engine = new AudioEngine();
    const onAnswer = vi.fn();
    engine.onAnswerDetected = onAnswer;
    
    // Simulate long press
    engine.handlePhantomTap({ type: 'mousedown' });
    
    // Fast-forward past long press threshold
    setTimeout(() => {
      expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({
        pattern: 'long-press'
      }));
    }, 700);
  });
});
