/**
 * PlumberPass - SRS Engine (Memory Anchor Algorithm)
 * Implements a modified SM-2 spaced repetition algorithm
 * Optimized for high-stakes exam preparation
 * @version 1.0.0
 * @module SRSEngine
 */

(function(global) {
  'use strict';

  // ============================================
  // CONSTANTS & CONFIGURATION
  // ============================================
  const SRS_CONFIG = {
    // Ease factor bounds (how quickly intervals grow)
    MIN_EASE: 1.3,
    DEFAULT_EASE: 2.5,
    MAX_EASE: 3.0,
    
    // Interval multipliers for different performance levels
    AGAIN_INTERVAL: 1,        // 1 minute (wrong answer)
    HARD_INTERVAL: 0.8,       // 80% of normal interval
    GOOD_INTERVAL: 1.0,       // Normal interval progression
    EASY_INTERVAL: 1.3,       // 130% of normal interval
    
    // Initial learning intervals (in minutes)
    LEARNING_STEPS: [1, 5, 10], // 1min, 5min, 10min
    
    // Graduating interval (first day interval in minutes)
    GRADUATING_INTERVAL: 24 * 60, // 1 day
    
    // Maximum interval (in days)
    MAX_INTERVAL: 365,
    
    // Leech threshold (consecutive failures)
    LEECH_THRESHOLD: 8,
    
    // Priority weights for queue ordering
    PRIORITY: {
      OVERDUE: 1000,      // Due questions get highest priority
      NEW: 500,           // New questions
      REVIEW: 300,        // Scheduled reviews
      LEARNING: 200,      // In learning phase
      FILTERED: 0         // Suspended/filtered
    }
  };

  // Performance ratings
  const RATING = {
    AGAIN: 1,  // Incorrect / Forgot
    HARD: 2,   // Correct with difficulty
    GOOD: 3,   // Correct
    EASY: 4    // Perfect recall
  };

  // Card states
  const CARD_STATE = {
    NEW: 0,       // Never seen
    LEARNING: 1,  // In initial learning phase
    REVIEW: 2,    // In review phase
    RELEARNING: 3 // Failed review, back to learning
  };

  // ============================================
  // STORAGE KEYS
  // ============================================
  const STORAGE_KEYS = {
    CARDS: 'pp_srs_cards',
    REVIEW_LOG: 'pp_review_log',
    SETTINGS: 'pp_srs_settings',
    STATS: 'pp_stats'
  };

  // ============================================
  // SRS ENGINE CLASS
  // ============================================
  class SRSEngine {
    constructor() {
      this.cards = new Map();
      this.reviewLog = [];
      this.stats = this.loadStats();
      this.init();
    }

    /**
     * Initialize the SRS engine
     * Load existing data from storage
     */
    async init() {
      await this.loadCards();
      await this.loadReviewLog();
    }

    // ============================================
    // CARD MANAGEMENT
    // ============================================

    /**
     * Add a new question to the SRS system
     * @param {string} questionId - Unique question identifier
     * @param {Object} metadata - Additional question metadata
     * @returns {Object} The created card
     */
    addCard(questionId, metadata = {}) {
      const existing = this.cards.get(questionId);
      if (existing) return existing;

      const card = {
        id: questionId,
        state: CARD_STATE.NEW,
        ease: SRS_CONFIG.DEFAULT_EASE,
        interval: 0,
        due: Date.now(),
        reps: 0,
        lapses: 0,
        lastReview: null,
        step: 0, // Current learning step index
        metadata: metadata,
        created: Date.now(),
        history: []
      };

      this.cards.set(questionId, card);
      this.saveCards();
      return card;
    }

    /**
     * Bulk add multiple questions
     * @param {Array} questions - Array of question objects
     */
    addCardsBulk(questions) {
      questions.forEach(q => {
        if (!this.cards.has(q.id)) {
          this.addCard(q.id, {
            topic: q.topic,
            subtopic: q.subtopic,
            difficulty: q.difficulty
          });
        }
      });
    }

    /**
     * Get a card by ID
     * @param {string} questionId 
     * @returns {Object|null}
     */
    getCard(questionId) {
      return this.cards.get(questionId) || null;
    }

    /**
     * Update card with review result
     * This is the core SRS algorithm
     * @param {string} questionId 
     * @param {number} rating - 1-4 (AGAIN, HARD, GOOD, EASY)
     * @returns {Object} Updated card
     */
    reviewCard(questionId, rating) {
      const card = this.cards.get(questionId);
      if (!card) throw new Error(`Card not found: ${questionId}`);

      const now = Date.now();
      const reviewEntry = {
        cardId: questionId,
        rating,
        timestamp: now,
        intervalBefore: card.interval,
        stateBefore: card.state
      };

      // Update card based on current state and rating
      this._processReview(card, rating);

      // Update metadata
      card.lastReview = now;
      card.reps++;
      card.history.push({ rating, timestamp: now });
      
      // Trim history to last 20 entries
      if (card.history.length > 20) {
        card.history = card.history.slice(-20);
      }

      // Update stats
      this._updateStats(rating, card.metadata);

      // Log review
      reviewEntry.intervalAfter = card.interval;
      reviewEntry.stateAfter = card.state;
      reviewEntry.dueAfter = card.due;
      this.reviewLog.push(reviewEntry);
      
      // Trim log to last 1000 entries
      if (this.reviewLog.length > 1000) {
        this.reviewLog = this.reviewLog.slice(-1000);
      }

      // Save changes
      this.saveCards();
      this.saveReviewLog();
      this.saveStats();

      return card;
    }

    /**
     * Process a review - Core SRS Algorithm
     * @private
     */
    _processReview(card, rating) {
      // Handle AGAIN (failure)
      if (rating === RATING.AGAIN) {
        card.lapses++;
        
        // Check for leech
        if (card.lapses >= SRS_CONFIG.LEECH_THRESHOLD) {
          card.isLeech = true;
        }

        // Reset to relearning state
        card.state = CARD_STATE.RELEARNING;
        card.step = 0;
        card.interval = SRS_CONFIG.LEARNING_STEPS[0] * 60 * 1000; // Convert to ms
        card.due = Date.now() + card.interval;
        
        // Decrease ease (but not below minimum)
        card.ease = Math.max(SRS_CONFIG.MIN_EASE, card.ease - 0.2);
        return;
      }

      // Handle different states
      switch (card.state) {
        case CARD_STATE.NEW:
        case CARD_STATE.LEARNING:
        case CARD_STATE.RELEARNING:
          this._processLearningStep(card, rating);
          break;
        case CARD_STATE.REVIEW:
          this._processReviewStep(card, rating);
          break;
      }
    }

    /**
     * Process learning/relearning phase
     * @private
     */
    _processLearningStep(card, rating) {
      if (rating === RATING.AGAIN) {
        // Go back to first step
        card.step = 0;
        card.interval = SRS_CONFIG.LEARNING_STEPS[0] * 60 * 1000;
      } else {
        // Advance to next step
        card.step++;
        
        if (card.step >= SRS_CONFIG.LEARNING_STEPS.length) {
          // Graduate to review
          card.state = CARD_STATE.REVIEW;
          card.interval = SRS_CONFIG.GRADUATING_INTERVAL * 60 * 1000;
          card.step = 0;
        } else {
          // Stay in learning with next interval
          card.interval = SRS_CONFIG.LEARNING_STEPS[card.step] * 60 * 1000;
          card.state = card.state === CARD_STATE.RELEARNING ? CARD_STATE.RELEARNING : CARD_STATE.LEARNING;
        }
      }

      card.due = Date.now() + card.interval;
    }

    /**
     * Process review phase
     * @private
     */
    _processReviewStep(card, rating) {
      // Calculate new interval based on rating
      let intervalMultiplier;
      let easeDelta = 0;

      switch (rating) {
        case RATING.HARD:
          intervalMultiplier = SRS_CONFIG.HARD_INTERVAL;
          easeDelta = -0.15;
          break;
        case RATING.GOOD:
          intervalMultiplier = SRS_CONFIG.GOOD_INTERVAL;
          break;
        case RATING.EASY:
          intervalMultiplier = SRS_CONFIG.EASY_INTERVAL;
          easeDelta = 0.15;
          break;
        default:
          intervalMultiplier = SRS_CONFIG.GOOD_INTERVAL;
      }

      // Update ease factor
      card.ease = Math.max(
        SRS_CONFIG.MIN_EASE,
        Math.min(SRS_CONFIG.MAX_EASE, card.ease + easeDelta)
      );

      // Calculate new interval in days
      const currentIntervalDays = card.interval / (24 * 60 * 60 * 1000);
      let newIntervalDays;

      if (currentIntervalDays === 0) {
        // First successful review
        newIntervalDays = 1;
      } else {
        // Normal interval progression
        newIntervalDays = currentIntervalDays * card.ease * intervalMultiplier;
      }

      // Cap at maximum interval
      newIntervalDays = Math.min(newIntervalDays, SRS_CONFIG.MAX_INTERVAL);

      // Convert to milliseconds
      card.interval = Math.round(newIntervalDays * 24 * 60 * 60 * 1000);
      card.due = Date.now() + card.interval;
    }

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

    /**
     * Get the study queue for today
     * @param {Object} options - Queue options
     * @returns {Array} Ordered queue of card IDs
     */
    getStudyQueue(options = {}) {
      const {
        limit = 20,
        newRatio = 0.5,       // Ratio of new cards vs reviews
        topicFilter = null,    // Filter by topic
        prioritizeWeak = true  // Prioritize weak areas
      } = options;

      const now = Date.now();
      const cards = Array.from(this.cards.values());

      // Filter cards
      let eligible = cards.filter(card => {
        // Check due date
        if (card.due > now) return false;
        
        // Check topic filter
        if (topicFilter && card.metadata?.topic !== topicFilter) return false;
        
        return true;
      });

      // Separate new and review cards
      const newCards = eligible.filter(c => c.state === CARD_STATE.NEW);
      const dueCards = eligible.filter(c => c.state !== CARD_STATE.NEW);

      // Calculate counts
      const newLimit = Math.floor(limit * newRatio);
      const reviewLimit = limit - newLimit;

      // Sort new cards (by creation date)
      newCards.sort((a, b) => a.created - b.created);

      // Sort due cards by priority
      dueCards.sort((a, b) => {
        let scoreA = this._calculatePriority(a, now, prioritizeWeak);
        let scoreB = this._calculatePriority(b, now, prioritizeWeak);
        return scoreB - scoreA; // Higher score = higher priority
      });

      // Combine queues
      const queue = [
        ...dueCards.slice(0, reviewLimit),
        ...newCards.slice(0, newLimit)
      ];

      // Shuffle the combined queue slightly for interleaving
      return this._interleaveQueue(queue);
    }

    /**
     * Calculate priority score for a card
     * @private
     */
    _calculatePriority(card, now, prioritizeWeak) {
      let score = SRS_CONFIG.PRIORITY.REVIEW;

      // Overdue bonus
      const overdue = Math.max(0, now - card.due);
      score += overdue / (24 * 60 * 60 * 1000) * 10; // +10 per day overdue

      // Weak area bonus
      if (prioritizeWeak && card.lapses > 0) {
        score += card.lapses * 50;
      }

      // Low ease factor bonus (struggling cards)
      if (card.ease < 2.0) {
        score += (2.0 - card.ease) * 100;
      }

      // Leech penalty (don't prioritize leeches too much)
      if (card.isLeech) {
        score *= 0.5;
      }

      return score;
    }

    /**
     * Interleave queue for better learning
     * @private
     */
    _interleaveQueue(queue) {
      // Group by topic
      const byTopic = {};
      queue.forEach(card => {
        const topic = card.metadata?.topic || 'Unknown';
        if (!byTopic[topic]) byTopic[topic] = [];
        byTopic[topic].push(card);
      });

      // Interleave from different topics
      const result = [];
      const topics = Object.keys(byTopic);
      let topicIndex = 0;

      while (result.length < queue.length) {
        const topic = topics[topicIndex % topics.length];
        const card = byTopic[topic]?.shift();
        if (card) result.push(card.id);
        topicIndex++;
      }

      return result;
    }

    /**
     * Get daily statistics
     * @returns {Object} Stats object
     */
    getDailyStats() {
      const today = new Date().setHours(0, 0, 0, 0);
      const todayReviews = this.reviewLog.filter(r => r.timestamp >= today);

      return {
        total: todayReviews.length,
        correct: todayReviews.filter(r => r.rating > RATING.AGAIN).length,
        incorrect: todayReviews.filter(r => r.rating === RATING.AGAIN).length,
        byRating: {
          again: todayReviews.filter(r => r.rating === RATING.AGAIN).length,
          hard: todayReviews.filter(r => r.rating === RATING.HARD).length,
          good: todayReviews.filter(r => r.rating === RATING.GOOD).length,
          easy: todayReviews.filter(r => r.rating === RATING.EASY).length
        }
      };
    }

    /**
     * Get topic-wise mastery statistics
     * @returns {Array} Topic stats
     */
    getTopicStats() {
      const topicMap = new Map();

      this.cards.forEach(card => {
        const topic = card.metadata?.topic || 'Uncategorized';
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { total: 0, mastered: 0, weak: 0, avgEase: 0 });
        }

        const stats = topicMap.get(topic);
        stats.total++;
        stats.avgEase += card.ease;

        if (card.state === CARD_STATE.REVIEW && card.interval > 7 * 24 * 60 * 60 * 1000) {
          stats.mastered++;
        }
        if (card.lapses > 2) {
          stats.weak++;
        }
      });

      return Array.from(topicMap.entries()).map(([topic, stats]) => ({
        topic,
        total: stats.total,
        mastered: stats.mastered,
        weak: stats.weak,
        masteryPercent: Math.round((stats.mastered / stats.total) * 100),
        avgEase: (stats.avgEase / stats.total).toFixed(2)
      }));
    }

    /**
     * Get weak areas (topics with low mastery)
     * @param {number} threshold - Mastery percentage threshold
     * @returns {Array} Weak topics
     */
    getWeakAreas(threshold = 50) {
      return this.getTopicStats().filter(t => t.masteryPercent < threshold);
    }

    /**
     * Get overall readiness score
     * @returns {number} Readiness percentage (0-100)
     */
    getReadinessScore() {
      const cards = Array.from(this.cards.values());
      if (cards.length === 0) return 0;

      let score = 0;
      cards.forEach(card => {
        if (card.state === CARD_STATE.REVIEW) {
          // Calculate contribution based on interval and ease
          const days = card.interval / (24 * 60 * 60 * 1000);
          const easeBonus = (card.ease - SRS_CONFIG.MIN_EASE) / (SRS_CONFIG.MAX_EASE - SRS_CONFIG.MIN_EASE);
          score += Math.min(1, days / 30) * 0.7 + easeBonus * 0.3;
        } else if (card.state === CARD_STATE.NEW) {
          score += 0.05; // Small contribution for seen cards
        }
      });

      return Math.round((score / cards.length) * 100);
    }

    /**
     * Get due count (cards ready for review)
     * @returns {number}
     */
    getDueCount() {
      const now = Date.now();
      return Array.from(this.cards.values()).filter(c => c.due <= now).length;
    }

    /**
     * Get cards that are mistakes (high lapse count)
     * @returns {Array}
     */
    getMistakeCards() {
      return Array.from(this.cards.values())
        .filter(c => c.lapses > 0)
        .sort((a, b) => b.lapses - a.lapses);
    }

    // ============================================
    // STATS & ANALYTICS
    // ============================================

    _updateStats(rating, metadata) {
      this.stats.totalReviews++;
      
      if (rating === RATING.AGAIN) {
        this.stats.totalIncorrect++;
      } else {
        this.stats.totalCorrect++;
      }

      // Track by topic
      const topic = metadata?.topic || 'Unknown';
      if (!this.stats.byTopic[topic]) {
        this.stats.byTopic[topic] = { correct: 0, incorrect: 0 };
      }
      
      if (rating === RATING.AGAIN) {
        this.stats.byTopic[topic].incorrect++;
      } else {
        this.stats.byTopic[topic].correct++;
      }

      // Update streak
      const today = new Date().toDateString();
      if (this.stats.lastStudyDate !== today) {
        if (this.stats.lastStudyDate === new Date(Date.now() - 86400000).toDateString()) {
          this.stats.streak++;
        } else if (this.stats.lastStudyDate !== today) {
          this.stats.streak = 1;
        }
        this.stats.lastStudyDate = today;
      }
    }

    loadStats() {
      const defaultStats = {
        totalReviews: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        streak: 0,
        lastStudyDate: null,
        byTopic: {}
      };

      try {
        const saved = localStorage.getItem(STORAGE_KEYS.STATS);
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
      } catch {
        return defaultStats;
      }
    }

    saveStats() {
      try {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(this.stats));
      } catch (e) {
        console.error('[SRS] Failed to save stats:', e);
      }
    }

    // ============================================
    // PERSISTENCE
    // ============================================

    async loadCards() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.cards = new Map(Object.entries(parsed));
        }
      } catch (e) {
        console.error('[SRS] Failed to load cards:', e);
        this.cards = new Map();
      }
    }

    saveCards() {
      try {
        const obj = Object.fromEntries(this.cards);
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(obj));
      } catch (e) {
        console.error('[SRS] Failed to save cards:', e);
      }
    }

    async loadReviewLog() {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.REVIEW_LOG);
        if (saved) {
          this.reviewLog = JSON.parse(saved);
        }
      } catch (e) {
        console.error('[SRS] Failed to load review log:', e);
        this.reviewLog = [];
      }
    }

    saveReviewLog() {
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEW_LOG, JSON.stringify(this.reviewLog));
      } catch (e) {
        console.error('[SRS] Failed to save review log:', e);
      }
    }

    // ============================================
    // EXPORT/IMPORT
    // ============================================

    exportData() {
      return {
        cards: Object.fromEntries(this.cards),
        reviewLog: this.reviewLog,
        stats: this.stats,
        exportedAt: Date.now()
      };
    }

    importData(data) {
      if (data.cards) {
        this.cards = new Map(Object.entries(data.cards));
      }
      if (data.reviewLog) {
        this.reviewLog = data.reviewLog;
      }
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }
      this.saveCards();
      this.saveReviewLog();
      this.saveStats();
    }

    reset() {
      this.cards = new Map();
      this.reviewLog = [];
      this.stats = this.loadStats();
      localStorage.removeItem(STORAGE_KEYS.CARDS);
      localStorage.removeItem(STORAGE_KEYS.REVIEW_LOG);
      localStorage.removeItem(STORAGE_KEYS.STATS);
    }
  }

  // ============================================
  // EXPOSE TO GLOBAL
  // ============================================
  global.SRSEngine = SRSEngine;
  global.SRS_CONFIG = SRS_CONFIG;
  global.RATING = RATING;
  global.CARD_STATE = CARD_STATE;

})(typeof window !== 'undefined' ? window : global);
