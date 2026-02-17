/**
 * PlumberPass - Quiz Engine
 * Manages quiz sessions, question display, and scoring
 * @version 1.0.0
 * @module QuizEngine
 */

(function(global) {
  'use strict';

  // ============================================
  // QUIZ STATES
  // ============================================
  const QUIZ_STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    SHOWING_QUESTION: 'showing_question',
    ANSWERED: 'answered',
    SHOWING_EXPLANATION: 'showing_explanation',
    FINISHED: 'finished'
  };

  // ============================================
  // QUIZ ENGINE CLASS
  // ============================================
  class QuizEngine {
    constructor(options = {}) {
      this.questions = options.questions || [];
      this.srsEngine = options.srsEngine || null;
      this.audioEngine = options.audioEngine || null;
      
      this.state = QUIZ_STATE.IDLE;
      this.session = null;
      this.currentIndex = 0;
      this.answers = new Map();
      this.bookmarks = new Set();
      this.startTime = null;
      
      // Settings
      this.settings = {
        showTimer: true,
        showDifficulty: true,
        autoAdvance: false,
        autoAdvanceDelay: 2000,
        readQuestions: false,
        ...options.settings
      };

      // Callbacks
      this.onStateChange = null;
      this.onQuestionChange = null;
      this.onAnswer = null;
      this.onComplete = null;
      this.onError = null;
    }

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    /**
     * Start a new quiz session
     * @param {Object} options - Session options
     */
    async startSession(options = {}) {
      const {
        mode = 'mixed',        // 'new', 'review', 'mixed', 'mistakes'
        limit = 20,
        topicFilter = null,
        shuffle = true
      } = options;

      this.setState(QUIZ_STATE.LOADING);

      try {
        let questionIds = [];

        // Build question queue based on mode
        switch (mode) {
          case 'daily':
            // Use SRS engine to get daily queue
            if (this.srsEngine) {
              questionIds = this.srsEngine.getStudyQueue({
                limit,
                newRatio: 0.5,
                topicFilter
              });
            }
            break;

          case 'mistakes':
            // Get mistake cards
            if (this.srsEngine) {
              const mistakes = this.srsEngine.getMistakeCards();
              questionIds = mistakes.slice(0, limit).map(c => c.id);
            }
            break;

          case 'topic':
            // Filter by topic
            if (topicFilter) {
              const filtered = this.questions.filter(q => q.topic === topicFilter);
              questionIds = filtered.map(q => q.id);
            }
            break;

          case 'custom':
            // Use provided question IDs
            questionIds = options.questionIds || [];
            break;

          default:
            // Mixed mode - all questions
            questionIds = this.questions.map(q => q.id);
        }

        // Shuffle if requested
        if (shuffle) {
          questionIds = this.shuffleArray(questionIds);
        }

        // Limit questions
        questionIds = questionIds.slice(0, limit);

        if (questionIds.length === 0) {
          throw new Error('No questions available for this session');
        }

        // Initialize session
        this.session = {
          id: this.generateSessionId(),
          mode,
          questionIds,
          startTime: Date.now(),
          endTime: null,
          settings: { ...this.settings }
        };

        this.currentIndex = 0;
        this.answers = new Map();
        this.startTime = Date.now();

        this.setState(QUIZ_STATE.SHOWING_QUESTION);
        
        if (this.onQuestionChange) {
          this.onQuestionChange(this.getCurrentQuestion(), this.currentIndex, questionIds.length);
        }

        return this.session;

      } catch (error) {
        this.setState(QUIZ_STATE.IDLE);
        if (this.onError) this.onError(error);
        throw error;
      }
    }

    /**
     * End the current session
     */
    endSession() {
      if (!this.session) return null;

      this.session.endTime = Date.now();
      this.session.duration = this.session.endTime - this.session.startTime;
      this.session.answers = Object.fromEntries(this.answers);
      this.session.bookmarks = Array.from(this.bookmarks);

      // Calculate statistics
      this.session.stats = this.calculateSessionStats();

      this.setState(QUIZ_STATE.FINISHED);

      if (this.onComplete) {
        this.onComplete(this.session);
      }

      return this.session;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // QUESTION NAVIGATION
    // ============================================

    /**
     * Get current question
     */
    getCurrentQuestion() {
      if (!this.session || this.currentIndex >= this.session.questionIds.length) {
        return null;
      }
      
      const questionId = this.session.questionIds[this.currentIndex];
      return this.questions.find(q => q.id === questionId) || null;
    }

    /**
     * Get question by index
     */
    getQuestionAt(index) {
      if (!this.session || index < 0 || index >= this.session.questionIds.length) {
        return null;
      }
      
      const questionId = this.session.questionIds[index];
      return this.questions.find(q => q.id === questionId) || null;
    }

    /**
     * Go to next question
     */
    nextQuestion() {
      if (!this.session) return false;

      if (this.currentIndex < this.session.questionIds.length - 1) {
        this.currentIndex++;
        this.setState(QUIZ_STATE.SHOWING_QUESTION);
        
        if (this.onQuestionChange) {
          this.onQuestionChange(
            this.getCurrentQuestion(),
            this.currentIndex,
            this.session.questionIds.length
          );
        }
        return true;
      } else {
        // End of quiz
        this.endSession();
        return false;
      }
    }

    /**
     * Go to previous question
     */
    previousQuestion() {
      if (!this.session || this.currentIndex <= 0) return false;

      this.currentIndex--;
      this.setState(QUIZ_STATE.SHOWING_QUESTION);
      
      if (this.onQuestionChange) {
        this.onQuestionChange(
          this.getCurrentQuestion(),
          this.currentIndex,
          this.session.questionIds.length
        );
      }
      return true;
    }

    /**
     * Jump to specific question
     */
    goToQuestion(index) {
      if (!this.session || index < 0 || index >= this.session.questionIds.length) {
        return false;
      }

      this.currentIndex = index;
      this.setState(QUIZ_STATE.SHOWING_QUESTION);
      
      if (this.onQuestionChange) {
        this.onQuestionChange(
          this.getCurrentQuestion(),
          this.currentIndex,
          this.session.questionIds.length
        );
      }
      return true;
    }

    // ============================================
    // ANSWER HANDLING
    // ============================================

    /**
     * Submit an answer
     * @param {string} choiceLabel - The chosen answer (A, B, C, D, E)
     * @returns {Object} Answer result
     */
    submitAnswer(choiceLabel) {
      const question = this.getCurrentQuestion();
      if (!question) return null;

      const isCorrect = choiceLabel === question.answer_key;
      const answerTime = Date.now();

      // Record answer
      const answer = {
        questionId: question.id,
        choice: choiceLabel,
        isCorrect,
        timestamp: answerTime,
        timeSpent: this.startTime ? answerTime - this.startTime : 0
      };

      this.answers.set(question.id, answer);

      // Update SRS if available
      if (this.srsEngine) {
        const rating = isCorrect ? 3 : 1; // GOOD : AGAIN
        this.srsEngine.reviewCard(question.id, rating);
      }

      this.setState(QUIZ_STATE.ANSWERED);

      if (this.onAnswer) {
        this.onAnswer(answer, question);
      }

      // Auto-advance if enabled
      if (this.settings.autoAdvance) {
        setTimeout(() => {
          if (isCorrect || this.state === QUIZ_STATE.SHOWING_EXPLANATION) {
            this.nextQuestion();
          }
        }, this.settings.autoAdvanceDelay);
      }

      return answer;
    }

    /**
     * Get answer for current question
     */
    getCurrentAnswer() {
      const question = this.getCurrentQuestion();
      if (!question) return null;
      return this.answers.get(question.id) || null;
    }

    /**
     * Check if current question has been answered
     */
    isAnswered() {
      const question = this.getCurrentQuestion();
      if (!question) return false;
      return this.answers.has(question.id);
    }

    /**
     * Get correct answer for current question
     */
    getCorrectAnswer() {
      const question = this.getCurrentQuestion();
      return question ? question.answer_key : null;
    }

    // ============================================
    // BOOKMARKS
    // ============================================

    /**
     * Toggle bookmark for current question
     */
    toggleBookmark() {
      const question = this.getCurrentQuestion();
      if (!question) return false;

      if (this.bookmarks.has(question.id)) {
        this.bookmarks.delete(question.id);
        return false;
      } else {
        this.bookmarks.add(question.id);
        return true;
      }
    }

    /**
     * Check if current question is bookmarked
     */
    isBookmarked() {
      const question = this.getCurrentQuestion();
      if (!question) return false;
      return this.bookmarks.has(question.id);
    }

    /**
     * Get all bookmarked question IDs
     */
    getBookmarks() {
      return Array.from(this.bookmarks);
    }

    // ============================================
    // EXPLANATION
    // ============================================

    /**
     * Show explanation for current question
     */
    showExplanation() {
      this.setState(QUIZ_STATE.SHOWING_EXPLANATION);
    }

    /**
     * Hide explanation
     */
    hideExplanation() {
      if (this.state === QUIZ_STATE.SHOWING_EXPLANATION) {
        this.setState(QUIZ_STATE.ANSWERED);
      }
    }

    /**
     * Toggle explanation visibility
     */
    toggleExplanation() {
      if (this.state === QUIZ_STATE.SHOWING_EXPLANATION) {
        this.hideExplanation();
      } else {
        this.showExplanation();
      }
    }

    // ============================================
  // STATISTICS
    // ============================================

    /**
     * Calculate session statistics
     */
    calculateSessionStats() {
      if (!this.session) return null;

      const answers = Array.from(this.answers.values());
      const total = this.session.questionIds.length;
      const answered = answers.length;
      const correct = answers.filter(a => a.isCorrect).length;
      const incorrect = answered - correct;

      // Calculate by topic
      const byTopic = {};
      answers.forEach(answer => {
        const question = this.questions.find(q => q.id === answer.questionId);
        if (question) {
          const topic = question.topic || 'Uncategorized';
          if (!byTopic[topic]) {
            byTopic[topic] = { total: 0, correct: 0 };
          }
          byTopic[topic].total++;
          if (answer.isCorrect) byTopic[topic].correct++;
        }
      });

      // Calculate accuracy by topic
      Object.keys(byTopic).forEach(topic => {
        const t = byTopic[topic];
        t.accuracy = Math.round((t.correct / t.total) * 100);
      });

      return {
        total,
        answered,
        correct,
        incorrect,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        byTopic,
        averageTimePerQuestion: answered > 0 
          ? Math.round((Date.now() - this.session.startTime) / answered / 1000)
          : 0
      };
    }

    /**
     * Get progress percentage
     */
    getProgress() {
      if (!this.session) return 0;
      return Math.round((this.currentIndex / this.session.questionIds.length) * 100);
    }

    /**
     * Get session summary
     */
    getSummary() {
      if (!this.session) return null;

      return {
        ...this.session,
        currentIndex: this.currentIndex,
        progress: this.getProgress(),
        isComplete: this.state === QUIZ_STATE.FINISHED,
        canGoBack: this.currentIndex > 0,
        canGoForward: this.currentIndex < this.session.questionIds.length - 1
      };
    }

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    /**
     * Format time (seconds to MM:SS)
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    }

    getState() {
      return this.state;
    }

    // ============================================
    // SETTINGS
    // ============================================

    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    }

    // ============================================
    // CLEANUP
    // ============================================

    reset() {
      this.state = QUIZ_STATE.IDLE;
      this.session = null;
      this.currentIndex = 0;
      this.answers = new Map();
      this.bookmarks = new Set();
      this.startTime = null;
    }
  }

  // ============================================
  // EXPOSE TO GLOBAL
  // ============================================
  global.QuizEngine = QuizEngine;
  global.QUIZ_STATE = QUIZ_STATE;

})(typeof window !== 'undefined' ? window : global);
