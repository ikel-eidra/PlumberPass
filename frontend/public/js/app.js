/**
 * PlumberPass - Main Application
 * Core controller that orchestrates SRS, Audio, and Quiz engines
 * @version 1.0.0
 * @module PlumberPassApp
 */

(function() {
  'use strict';

  // ============================================
  // APP STATE
  // ============================================
  const AppState = {
    currentScreen: 'dashboard',
    questions: [],
    srs: null,
    audio: null,
    quiz: null,
    timer: null,
    examDate: new Date('2026-07-01').getTime() // July 2026 default
  };

  // ============================================
  // DOM ELEMENTS CACHE
  // ============================================
  const DOM = {};

  // ============================================
  // INITIALIZATION
  // ============================================
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('[PlumberPass] Initializing...');
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Initialize engines
    await initializeEngines();
    
    // Load questions
    await loadQuestions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize PWA
    initializePWA();
    
    // Update UI
    updateDashboard();
    
    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 1500);
    
    console.log('[PlumberPass] Ready');
  });

  /**
   * Cache frequently accessed DOM elements
   */
  function cacheDOMElements() {
    // Screens
    DOM.screens = {
      dashboard: document.getElementById('screen-dashboard'),
      quiz: document.getElementById('screen-quiz'),
      audio: document.getElementById('screen-audio'),
      mistakes: document.getElementById('screen-mistakes'),
      settings: document.getElementById('screen-settings')
    };

    // Navigation
    DOM.navButtons = document.querySelectorAll('.nav-btn');

    // Dashboard elements
    DOM.countdownDays = document.getElementById('countdown-days');
    DOM.readinessCircle = document.getElementById('readiness-circle');
    DOM.readinessPercent = document.getElementById('readiness-percent');
    DOM.dailyQueueCount = document.getElementById('daily-queue-count');
    DOM.statTotalAnswered = document.getElementById('stat-total-answered');
    DOM.statStreak = document.getElementById('stat-streak');
    DOM.statAccuracy = document.getElementById('stat-accuracy');
    DOM.statWeakTopics = document.getElementById('stat-weak-topics');
    DOM.topicList = document.getElementById('topic-list');

    // Quiz elements
    DOM.quizProgressFill = document.getElementById('quiz-progress-fill');
    DOM.quizProgressText = document.getElementById('quiz-progress-text');
    DOM.quizDifficulty = document.getElementById('quiz-difficulty');
    DOM.quizTimer = document.getElementById('quiz-timer');
    DOM.questionText = document.getElementById('question-text');
    DOM.questionChoices = document.getElementById('question-choices');
    DOM.questionExplanation = document.getElementById('question-explanation');
    DOM.explanationText = document.getElementById('explanation-text');
    DOM.btnExplain = document.getElementById('btn-explain');
    DOM.btnNext = document.getElementById('btn-next');
    DOM.btnBookmark = document.getElementById('btn-bookmark');
    DOM.btnAudioRead = document.getElementById('btn-audio-read');

    // Audio mode elements
    DOM.audioHero = document.querySelector('.audio-hero');
    DOM.audioStatusText = document.getElementById('audio-status-text');
    DOM.audioQuestionNumber = document.getElementById('audio-question-number');
    DOM.btnAudioPlay = document.getElementById('btn-audio-play');
    DOM.btnAudioPause = document.getElementById('btn-audio-pause');
    DOM.btnAudioRepeat = document.getElementById('btn-audio-repeat');
    DOM.btnAudioSkip = document.getElementById('btn-audio-skip');
    DOM.answerButtons = document.querySelectorAll('.answer-btn');
    DOM.audioFeedback = document.getElementById('audio-feedback');
    DOM.feedbackIcon = document.getElementById('feedback-icon');
    DOM.feedbackText = document.getElementById('feedback-text');
    DOM.ttsSpeed = document.getElementById('tts-speed');
    DOM.ttsSpeedValue = document.getElementById('tts-speed-value');

    // Mistakes elements
    DOM.mistakesList = document.getElementById('mistakes-list');
    DOM.mistakesEmpty = document.getElementById('mistakes-empty');
    DOM.mistakeBadge = document.getElementById('mistake-badge');

    // Settings elements
    DOM.btnExport = document.getElementById('btn-export');
    DOM.btnReset = document.getElementById('btn-reset');
    DOM.settingVoice = document.getElementById('setting-voice');

    // Modal
    DOM.modalOverlay = document.getElementById('modal-overlay');
    DOM.modalTitle = document.getElementById('modal-title');
    DOM.modalMessage = document.getElementById('modal-message');
    DOM.modalCancel = document.getElementById('modal-cancel');
    DOM.modalConfirm = document.getElementById('modal-confirm');
  }

  /**
   * Initialize core engines
   */
  async function initializeEngines() {
    // Initialize SRS Engine
    AppState.srs = new SRSEngine();
    await AppState.srs.init();

    // Initialize Audio Engine
    AppState.audio = new AudioEngine();
    await AppState.audio.init();

    // Setup audio callbacks
    AppState.audio.onStateChange = handleAudioStateChange;
    AppState.audio.onAnswerDetected = handleVoiceAnswer;
    AppState.audio.onError = (error) => showToast(error, 'error');

    // Initialize Quiz Engine (questions loaded later)
    AppState.quiz = new QuizEngine({
      srsEngine: AppState.srs,
      audioEngine: AppState.audio
    });

    // Setup quiz callbacks
    AppState.quiz.onQuestionChange = handleQuestionChange;
    AppState.quiz.onAnswer = handleQuizAnswer;
    AppState.quiz.onComplete = handleQuizComplete;
    AppState.quiz.onStateChange = handleQuizStateChange;
  }

  /**
   * Load questions from data source
   */
  async function loadQuestions() {
    try {
      // Try to load from window.QUESTIONS (defined in questions.js)
      if (window.QUESTIONS && Array.isArray(window.QUESTIONS)) {
        AppState.questions = window.QUESTIONS;
      } else {
        // Fallback: try to fetch from API
        const response = await fetch('/api/questions');
        if (response.ok) {
          AppState.questions = await response.json();
        } else {
          throw new Error('Failed to load questions');
        }
      }

      // Add cards to SRS for all questions
      AppState.srs.addCardsBulk(AppState.questions);
      
      // Update quiz engine with questions
      AppState.quiz.questions = AppState.questions;

      console.log(`[PlumberPass] Loaded ${AppState.questions.length} questions`);
    } catch (error) {
      console.error('[PlumberPass] Failed to load questions:', error);
      showToast('Failed to load questions. Please refresh.', 'error');
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    // Navigation
    DOM.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        switchScreen(screen);
      });
    });

    // Dashboard quick actions
    document.getElementById('btn-quick-audio')?.addEventListener('click', () => {
      switchScreen('audio');
      startAudioMode();
    });

    document.getElementById('btn-quick-quiz')?.addEventListener('click', () => {
      switchScreen('quiz');
      startDailyQuiz();
    });

    // Quiz controls
    DOM.btnExplain?.addEventListener('click', () => {
      AppState.quiz.toggleExplanation();
      updateExplanationUI();
    });

    DOM.btnNext?.addEventListener('click', () => {
      AppState.quiz.nextQuestion();
    });

    DOM.btnBookmark?.addEventListener('click', () => {
      const isBookmarked = AppState.quiz.toggleBookmark();
      DOM.btnBookmark.classList.toggle('active', isBookmarked);
      showToast(isBookmarked ? 'Bookmarked' : 'Bookmark removed');
    });

    DOM.btnAudioRead?.addEventListener('click', () => {
      const question = AppState.quiz.getCurrentQuestion();
      if (question) {
        AppState.audio.speakQuestion(question);
      }
    });

    // Audio mode controls
    DOM.btnAudioPlay?.addEventListener('click', startAudioMode);
    DOM.btnAudioPause?.addEventListener('click', pauseAudioMode);
    DOM.btnAudioRepeat?.addEventListener('click', repeatAudioQuestion);
    DOM.btnAudioSkip?.addEventListener('click', skipAudioQuestion);

    // Answer buttons
    DOM.answerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const answer = btn.dataset.answer;
        submitAudioAnswer(answer);
      });
    });

    // TTS speed slider
    DOM.ttsSpeed?.addEventListener('input', (e) => {
      const rate = parseFloat(e.target.value);
      AppState.audio.setRate(rate);
      DOM.ttsSpeedValue.textContent = rate.toFixed(1) + 'x';
    });

    // Phantom tap detection
    if (DOM.audioHero) {
      DOM.audioHero.addEventListener('mousedown', (e) => AppState.audio.handlePhantomTap(e));
      DOM.audioHero.addEventListener('mouseup', (e) => AppState.audio.handlePhantomTap(e));
      DOM.audioHero.addEventListener('touchstart', (e) => AppState.audio.handlePhantomTap(e));
      DOM.audioHero.addEventListener('touchend', (e) => AppState.audio.handlePhantomTap(e));
    }

    // Settings
    DOM.btnExport?.addEventListener('click', exportProgress);
    DOM.btnReset?.addEventListener('click', () => {
      showModal('Reset Progress', 'Are you sure? This will delete all your study history.', resetProgress);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Visibility change (pause audio when tab hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && AppState.audio) {
        AppState.audio.pause();
      }
    });
  }

  // ============================================
  // SCREEN MANAGEMENT
  // ============================================

  function switchScreen(screenName) {
    // Update state
    AppState.currentScreen = screenName;

    // Update navigation
    DOM.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenName);
    });

    // Show/hide screens
    Object.entries(DOM.screens).forEach(([name, element]) => {
      element.classList.toggle('active', name === screenName);
    });

    // Screen-specific initialization
    switch (screenName) {
      case 'dashboard':
        updateDashboard();
        break;
      case 'mistakes':
        updateMistakesList();
        break;
      case 'settings':
        populateVoiceSettings();
        break;
    }
  }

  // ============================================
  // DASHBOARD
  // ============================================

  function updateDashboard() {
    // Countdown
    const daysUntil = Math.ceil((AppState.examDate - Date.now()) / (1000 * 60 * 60 * 24));
    DOM.countdownDays.textContent = Math.max(0, daysUntil);

    // Readiness score
    const readiness = AppState.srs.getReadinessScore();
    DOM.readinessPercent.textContent = readiness + '%';
    
    // Update circle progress
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (readiness / 100) * circumference;
    DOM.readinessCircle.style.strokeDashoffset = offset;

    // Daily queue
    const dueCount = AppState.srs.getDueCount();
    DOM.dailyQueueCount.textContent = `${dueCount} items due`;

    // Stats
    const stats = AppState.srs.stats;
    DOM.statTotalAnswered.textContent = stats.totalReviews.toLocaleString();
    DOM.statStreak.textContent = stats.streak;
    
    const accuracy = stats.totalReviews > 0 
      ? Math.round((stats.totalCorrect / stats.totalReviews) * 100)
      : 0;
    DOM.statAccuracy.textContent = accuracy + '%';

    // Weak topics
    const weakAreas = AppState.srs.getWeakAreas();
    DOM.statWeakTopics.textContent = weakAreas.length;

    // Topic list
    updateTopicList();
  }

  function updateTopicList() {
    const topicStats = AppState.srs.getTopicStats();
    
    DOM.topicList.innerHTML = topicStats.map(topic => `
      <div class="topic-item">
        <div class="topic-info">
          <span class="topic-name">${escapeHtml(topic.topic)}</span>
          <div class="topic-progress">
            <div class="topic-progress-bar" style="width: ${topic.masteryPercent}%"></div>
          </div>
        </div>
        <span class="topic-percent">${topic.masteryPercent}%</span>
      </div>
    `).join('');
  }

  // ============================================
  // QUIZ MODE
  // ============================================

  function startDailyQuiz() {
    const queue = AppState.srs.getStudyQueue({ limit: 20 });
    
    if (queue.length === 0) {
      showToast('No questions due for review!', 'success');
      return;
    }

    AppState.quiz.startSession({
      mode: 'custom',
      questionIds: queue,
      limit: 20
    });

    startTimer();
  }

  function handleQuestionChange(question, index, total) {
    if (!question) return;

    // Update progress
    const progress = ((index + 1) / total) * 100;
    DOM.quizProgressFill.style.width = progress + '%';
    DOM.quizProgressText.textContent = `${index + 1} / ${total}`;

    // Update difficulty badge
    DOM.quizDifficulty.textContent = question.difficulty || 'Medium';

    // Update question text
    DOM.questionText.textContent = question.prompt;

    // Update choices
    DOM.questionChoices.innerHTML = question.choices.map(choice => `
      <button class="choice-btn" data-choice="${escapeHtml(choice.label)}">
        <span class="choice-label">${escapeHtml(choice.label)}</span>
        <span class="choice-text">${escapeHtml(choice.text)}</span>
      </button>
    `).join('');

    // Add click handlers to choices
    DOM.questionChoices.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        submitQuizAnswer(choice);
      });
    });

    // Reset UI state
    DOM.questionExplanation.classList.add('hidden');
    DOM.btnExplain.disabled = true;
    DOM.btnNext.disabled = true;
    DOM.btnBookmark.classList.toggle('active', AppState.quiz.isBookmarked());

    // Read question if audio enabled
    if (AppState.quiz.settings.readQuestions) {
      AppState.audio.speakQuestion(question);
    }
  }

  function submitQuizAnswer(choice) {
    const result = AppState.quiz.submitAnswer(choice);
    if (!result) return;

    // Visual feedback
    const buttons = DOM.questionChoices.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
      const btnChoice = btn.dataset.choice;
      btn.disabled = true;
      
      if (btnChoice === result.question.answer_key) {
        btn.classList.add('correct');
      } else if (btnChoice === choice && !result.isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    // Enable controls
    DOM.btnExplain.disabled = false;
    DOM.btnNext.disabled = false;

    // Show toast
    showToast(result.isCorrect ? 'Correct!' : 'Incorrect', result.isCorrect ? 'success' : 'error');
  }

  function handleQuizAnswer(answer, question) {
    // Update explanation
    DOM.explanationText.textContent = question.explanation_long || question.explanation_short;
  }

  function updateExplanationUI() {
    const isShowing = AppState.quiz.state === 'showing_explanation';
    DOM.questionExplanation.classList.toggle('hidden', !isShowing);
  }

  function handleQuizComplete(session) {
    stopTimer();
    
    const stats = session.stats;
    showToast(`Session complete! ${stats.accuracy}% accuracy`, 'success');
    
    // Switch back to dashboard
    setTimeout(() => switchScreen('dashboard'), 2000);
  }

  function handleQuizStateChange(newState) {
    // Handle state changes if needed
  }

  // ============================================
  // AUDIO MODE (PHANTOM MODE)
  // ============================================

  let audioQueue = [];
  let audioIndex = 0;
  let audioSessionActive = false;

  async function startAudioMode() {
    // Build queue from SRS due cards
    audioQueue = AppState.srs.getStudyQueue({ limit: 20 });
    
    if (audioQueue.length === 0) {
      showToast('No questions due for review!', 'success');
      return;
    }

    audioIndex = 0;
    audioSessionActive = true;

    // Request wake lock
    AppState.audio.requestWakeLock();

    // Update UI
    DOM.btnAudioPlay.classList.add('hidden');
    DOM.btnAudioPause.classList.remove('hidden');
    DOM.audioHero.classList.add('playing');

    // Start playing
    playCurrentAudioQuestion();
  }

  function pauseAudioMode() {
    AppState.audio.pause();
    AppState.audio.releaseWakeLock();
    
    DOM.btnAudioPlay.classList.remove('hidden');
    DOM.btnAudioPause.classList.add('hidden');
    DOM.audioHero.classList.remove('playing');
  }

  async function playCurrentAudioQuestion() {
    if (!audioSessionActive || audioIndex >= audioQueue.length) {
      endAudioSession();
      return;
    }

    const questionId = audioQueue[audioIndex];
    const question = AppState.questions.find(q => q.id === questionId);
    
    if (!question) {
      audioIndex++;
      playCurrentAudioQuestion();
      return;
    }

    // Update UI
    DOM.audioStatusText.textContent = 'Playing...';
    DOM.audioQuestionNumber.textContent = `Question ${audioIndex + 1} of ${audioQueue.length}`;
    DOM.audioFeedback.classList.add('hidden');

    // Reset answer buttons
    DOM.answerButtons.forEach(btn => {
      btn.classList.remove('correct', 'incorrect');
    });

    // Play question
    try {
      await AppState.audio.speakQuestion(question);
      
      // Start listening for voice answer or wait for tap
      DOM.audioStatusText.textContent = 'Listening for answer...';
      AppState.audio.startListening(8000);
    } catch (error) {
      console.error('[Audio] Playback error:', error);
      DOM.audioStatusText.textContent = 'Tap to answer';
    }
  }

  function submitAudioAnswer(answer) {
    if (audioIndex >= audioQueue.length) return;

    const questionId = audioQueue[audioIndex];
    const question = AppState.questions.find(q => q.id === questionId);
    
    if (!question) return;

    const isCorrect = answer === question.answer_key;

    // Update SRS
    const rating = isCorrect ? 3 : 1;
    AppState.srs.reviewCard(questionId, rating);

    // Visual feedback
    DOM.answerButtons.forEach(btn => {
      const btnAnswer = btn.dataset.answer;
      if (btnAnswer === question.answer_key) {
        btn.classList.add('correct');
      } else if (btnAnswer === answer && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    // Show feedback
    DOM.audioFeedback.classList.remove('hidden', 'correct', 'incorrect');
    DOM.audioFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    DOM.feedbackIcon.textContent = isCorrect ? '✓' : '✗';
    DOM.feedbackText.textContent = isCorrect ? 'Correct!' : `The answer is ${question.answer_key}`;

    // Speak feedback
    const explanation = AppState.audio.settings.readExplanations 
      ? (question.explanation_short || null)
      : null;
    
    AppState.audio.speakFeedback(isCorrect, question.answer_key, explanation);

    // Auto-advance
    if (AppState.audio.settings.autoAdvance) {
      setTimeout(() => {
        audioIndex++;
        playCurrentAudioQuestion();
      }, 3000);
    }
  }

  function handleVoiceAnswer(data) {
    if (data.pattern === 'long-press') {
      repeatAudioQuestion();
      return;
    }

    if (data.answer) {
      submitAudioAnswer(data.answer);
    }
  }

  function handleAudioStateChange(newState) {
    if (newState === 'idle' && audioSessionActive) {
      // Finished speaking, ready for next
    }
  }

  function repeatAudioQuestion() {
    AppState.audio.stop();
    playCurrentAudioQuestion();
  }

  function skipAudioQuestion() {
    audioIndex++;
    playCurrentAudioQuestion();
  }

  function endAudioSession() {
    audioSessionActive = false;
    AppState.audio.stop();
    AppState.audio.releaseWakeLock();
    
    DOM.btnAudioPlay.classList.remove('hidden');
    DOM.btnAudioPause.classList.add('hidden');
    DOM.audioHero.classList.remove('playing');
    DOM.audioStatusText.textContent = 'Session complete';
    
    showToast('Audio session complete!', 'success');
  }

  // ============================================
  // MISTAKE LIBRARY
  // ============================================

  function updateMistakesList() {
    const mistakes = AppState.srs.getMistakeCards();
    
    // Update badge
    DOM.mistakeBadge.textContent = mistakes.length;
    DOM.mistakeBadge.classList.toggle('hidden', mistakes.length === 0);

    // Show/hide empty state
    DOM.mistakesEmpty.classList.toggle('hidden', mistakes.length > 0);

    if (mistakes.length === 0) return;

    // Render mistakes
    DOM.mistakesList.innerHTML = mistakes.slice(0, 20).map(card => {
      const question = AppState.questions.find(q => q.id === card.id);
      if (!question) return '';

      const lastReview = card.history[card.history.length - 1];
      const userAnswer = lastReview ? 
        (lastReview.rating === 1 ? 'Wrong' : 'Correct') : 'Unknown';

      return `
        <div class="mistake-item">
          <p class="mistake-question">${escapeHtml(question.prompt)}</p>
          <div class="mistake-answer">
            <span class="wrong">Your answer: ${escapeHtml(userAnswer)}</span>
            <span class="right">Correct: ${escapeHtml(question.answer_key)}</span>
          </div>
          <div class="mistake-actions">
            <button class="btn-secondary" onclick="reviewMistake('${card.id}')">
              Review Now
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  global.reviewMistake = function(questionId) {
    switchScreen('quiz');
    AppState.quiz.startSession({
      mode: 'custom',
      questionIds: [questionId],
      limit: 1
    });
  };

  // ============================================
  // TIMER
  // ============================================

  function startTimer() {
    let seconds = 0;
    AppState.timer = setInterval(() => {
      seconds++;
      if (DOM.quizTimer) {
        DOM.quizTimer.textContent = formatTime(seconds);
      }
    }, 1000);
  }

  function stopTimer() {
    if (AppState.timer) {
      clearInterval(AppState.timer);
      AppState.timer = null;
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================
  // SETTINGS
  // ============================================

  function populateVoiceSettings() {
    const voices = AppState.audio.getVoices();
    const currentVoice = AppState.audio.settings.voice;

    DOM.settingVoice.innerHTML = [
      '<option value="">System Default</option>',
      ...voices.map(v => `<option value="${v.name}" ${v.name === currentVoice ? 'selected' : ''}>${v.name}</option>`)
    ].join('');

    DOM.settingVoice.addEventListener('change', (e) => {
      AppState.audio.setVoice(e.target.value);
    });
  }

  function exportProgress() {
    const data = AppState.srs.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `plumberpass-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Progress exported successfully');
  }

  function resetProgress() {
    AppState.srs.reset();
    updateDashboard();
    showToast('All progress has been reset', 'success');
  }

  // ============================================
  // PWA
  // ============================================

  function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registered'))
        .catch(err => console.error('[PWA] SW registration failed:', err));
    }

    // Handle beforeinstallprompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Could show install button here
    });
  }

  // ============================================
  // UI UTILITIES
  // ============================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function showModal(title, message, onConfirm) {
    DOM.modalTitle.textContent = title;
    DOM.modalMessage.textContent = message;
    DOM.modalOverlay.classList.remove('hidden');

    const handleConfirm = () => {
      DOM.modalOverlay.classList.add('hidden');
      onConfirm();
      cleanup();
    };

    const handleCancel = () => {
      DOM.modalOverlay.classList.add('hidden');
      cleanup();
    };

    const cleanup = () => {
      DOM.modalConfirm.removeEventListener('click', handleConfirm);
      DOM.modalCancel.removeEventListener('click', handleCancel);
    };

    DOM.modalConfirm.addEventListener('click', handleConfirm);
    DOM.modalCancel.addEventListener('click', handleCancel);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function handleKeyboard(e) {
    // Only handle shortcuts in quiz mode
    if (AppState.currentScreen !== 'quiz') return;

    // Answer keys A-E
    if (e.key >= 'a' && e.key <= 'e') {
      submitQuizAnswer(e.key.toUpperCase());
      return;
    }

    // Navigation
    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
        AppState.quiz.nextQuestion();
        break;
      case 'ArrowLeft':
        AppState.quiz.previousQuestion();
        break;
      case ' ':
        e.preventDefault();
        AppState.quiz.toggleExplanation();
        updateExplanationUI();
        break;
      case 'b':
        const isBookmarked = AppState.quiz.toggleBookmark();
        DOM.btnBookmark.classList.toggle('active', isBookmarked);
        break;
    }
  }

  // ============================================
  // EXPOSE GLOBAL FUNCTIONS
  // ============================================
  window.PlumberPass = {
    switchScreen,
    startDailyQuiz,
    startAudioMode,
    showToast,
    getState: () => AppState
  };

})();
