import { useEffect, useMemo, useState } from "react";
import type { Question } from "../App";

type StudyCard = {
  id: string;
  reps: number;
  correct: number;
  incorrect: number;
  lapses: number;
  intervalMinutes: number;
  dueAt: number;
  lastReviewedAt: number | null;
  lastResult: "correct" | "incorrect" | null;
};

type ReviewLogEntry = {
  questionId: string;
  topic: string;
  correct: boolean;
  timestamp: number;
  source: "study" | "mistake" | "mock";
};

export type TopicPerformance = {
  topic: string;
  accuracy: number;
  reviewed: number;
  due: number;
  nextFocus: string;
};

export type StudyStats = {
  totalAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  dueCount: number;
  newCount: number;
  masteredCount: number;
  readiness: number;
  streakDays: number;
  reviewedToday: number;
  topicPerformance: TopicPerformance[];
};

export type MistakeEntry = {
  question: Question;
  attempts: number;
  correct: number;
  incorrect: number;
  lapses: number;
  accuracy: number;
  dueNow: boolean;
  dueAt: number | null;
  lastReviewedAt: number | null;
  lastSource: ReviewLogEntry["source"] | null;
};

const STORAGE_KEYS = {
  cards: "pp_review_cards_v1",
  history: "pp_review_history_v1",
  bookmarks: "pp_bookmarks_v1",
  mistakes: "pp_mistakes_v1",
};

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const interleaveByTopic = (items: Question[]) => {
  const buckets = new Map<string, Question[]>();
  for (const item of items) {
    const topic = item.topic || "General Plumbing";
    const bucket = buckets.get(topic) ?? [];
    bucket.push(item);
    buckets.set(topic, bucket);
  }

  const topics = Array.from(buckets.keys()).sort((left, right) => left.localeCompare(right));
  const queue: Question[] = [];
  let remaining = true;

  while (remaining) {
    remaining = false;
    for (const topic of topics) {
      const nextQuestion = buckets.get(topic)?.shift();
      if (nextQuestion) {
        queue.push(nextQuestion);
        remaining = true;
      }
    }
  }

  return queue;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getDayKey = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

export function useStudyProgress(questions: Question[], extraQuestions: Question[] = []) {
  const [cards, setCards] = useState<Record<string, StudyCard>>(() =>
    readJson<Record<string, StudyCard>>(STORAGE_KEYS.cards, {}),
  );
  const [history, setHistory] = useState<ReviewLogEntry[]>(() =>
    readJson<ReviewLogEntry[]>(STORAGE_KEYS.history, []),
  );
  const [bookmarkIds, setBookmarkIds] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.bookmarks, []),
  );
  const [mistakeIds, setMistakeIds] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.mistakes, []),
  );

  useEffect(() => {
    writeJson(STORAGE_KEYS.cards, cards);
  }, [cards]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.history, history);
  }, [history]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.bookmarks, bookmarkIds);
  }, [bookmarkIds]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.mistakes, mistakeIds);
  }, [mistakeIds]);

  const questionById = useMemo(
    () =>
      new Map(
        [...questions, ...extraQuestions].map((question) => [question.id, question]),
      ),
    [extraQuestions, questions],
  );

  const reviewQueue = useMemo(() => {
    const now = Date.now();
    const due: Question[] = [];
    const fresh: Question[] = [];
    const later: Array<{ question: Question; dueAt: number }> = [];

    for (const question of questions) {
      const card = cards[question.id];
      if (!card) {
        fresh.push(question);
        continue;
      }

      if (card.dueAt <= now) {
        due.push(question);
      } else {
        later.push({ question, dueAt: card.dueAt });
      }
    }

    later.sort((left, right) => left.dueAt - right.dueAt);
    return [
      ...interleaveByTopic(due),
      ...interleaveByTopic(fresh),
      ...later.map((entry) => entry.question),
    ];
  }, [cards, questions]);

  const mistakeEntries = useMemo<MistakeEntry[]>(() => {
    const now = Date.now();
    const latestHistoryByQuestion = new Map<string, ReviewLogEntry>();
    for (const entry of history) {
      latestHistoryByQuestion.set(entry.questionId, entry);
    }

    return mistakeIds
      .flatMap((id) => {
        const question = questionById.get(id);
        if (!question) {
          return [];
        }

        const card = cards[id];
        const latestHistory = latestHistoryByQuestion.get(id);
        const correct = card?.correct ?? 0;
        const incorrect =
          card?.incorrect ?? (latestHistory && latestHistory.correct === false ? 1 : 0);
        const attempts = correct + incorrect;

        return [
          {
            question,
            attempts,
            correct,
            incorrect,
            lapses: card?.lapses ?? Math.max(1, incorrect),
            accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
            dueNow: card ? card.dueAt <= now : true,
            dueAt: card?.dueAt ?? null,
            lastReviewedAt: card?.lastReviewedAt ?? latestHistory?.timestamp ?? null,
            lastSource: latestHistory?.source ?? null,
          },
        ];
      })
      .sort((left, right) => {
        if (left.dueNow !== right.dueNow) {
          return left.dueNow ? -1 : 1;
        }
        if (left.lapses !== right.lapses) {
          return right.lapses - left.lapses;
        }
        return (right.lastReviewedAt ?? 0) - (left.lastReviewedAt ?? 0);
      });
  }, [cards, history, mistakeIds, questionById]);

  const mistakeQuestions = useMemo(
    () => mistakeEntries.map((entry) => entry.question),
    [mistakeEntries],
  );

  const bookmarkedQuestions = useMemo(
    () =>
      bookmarkIds.map((id) => questionById.get(id)).filter((item): item is Question => Boolean(item)),
    [bookmarkIds, questionById],
  );

  const stats = useMemo<StudyStats>(() => {
    const now = Date.now();
    const totalAnswered = Object.values(cards).reduce(
      (sum, card) => sum + card.correct + card.incorrect,
      0,
    );
    const totalCorrect = Object.values(cards).reduce((sum, card) => sum + card.correct, 0);
    const totalIncorrect = Object.values(cards).reduce((sum, card) => sum + card.incorrect, 0);
    const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const dueCount = questions.filter((question) => (cards[question.id]?.dueAt ?? 0) <= now).filter(
      (question) => Boolean(cards[question.id]),
    ).length;
    const newCount = questions.filter((question) => !cards[question.id]).length;
    const masteredCount = Object.values(cards).filter(
      (card) => card.lastResult === "correct" && card.intervalMinutes >= 24 * 60 && card.correct >= 2,
    ).length;
    const reviewedToday = history.filter((entry) => getDayKey(entry.timestamp) === getDayKey(now)).length;

    const dayKeys = Array.from(new Set(history.map((entry) => getDayKey(entry.timestamp)))).sort();
    let streakDays = 0;
    const cursor = new Date();
    while (dayKeys.includes(cursor.toISOString().slice(0, 10))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const coverage = questions.length ? clamp(totalAnswered / Math.min(questions.length, 120), 0, 1) : 0;
    const mastery = questions.length ? masteredCount / questions.length : 0;
    const readiness = Math.round((coverage * 0.35 + mastery * 0.35 + accuracy / 100 * 0.3) * 100);

    const topicMap = new Map<
      string,
      { reviewed: number; correct: number; due: number; nextFocus: string }
    >();

    for (const question of questions) {
      const card = cards[question.id];
      const current = topicMap.get(question.topic) ?? {
        reviewed: 0,
        correct: 0,
        due: 0,
        nextFocus: question.subtopic,
      };
      if (card) {
        current.reviewed += card.correct + card.incorrect;
        current.correct += card.correct;
        if (card.dueAt <= now) {
          current.due += 1;
          current.nextFocus = question.subtopic || current.nextFocus;
        }
      }
      topicMap.set(question.topic, current);
    }

    const topicPerformance = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        accuracy: data.reviewed ? Math.round((data.correct / data.reviewed) * 100) : 0,
        reviewed: data.reviewed,
        due: data.due,
        nextFocus: data.nextFocus || "General",
      }))
      .sort((left, right) => {
        if (left.due !== right.due) {
          return right.due - left.due;
        }
        return left.accuracy - right.accuracy;
      })
      .slice(0, 6);

    return {
      totalAnswered,
      totalCorrect,
      totalIncorrect,
      accuracy,
      dueCount,
      newCount,
      masteredCount,
      readiness,
      streakDays,
      reviewedToday,
      topicPerformance,
    };
  }, [cards, history, questions]);

  const recordAnswer = (
    question: Question,
    isCorrect: boolean,
    source: ReviewLogEntry["source"] = "study",
  ) => {
    const now = Date.now();
    setCards((prev) => {
      const current = prev[question.id] ?? {
        id: question.id,
        reps: 0,
        correct: 0,
        incorrect: 0,
        lapses: 0,
        intervalMinutes: 0,
        dueAt: now,
        lastReviewedAt: null,
        lastResult: null,
      };

      const nextCorrect = current.correct + (isCorrect ? 1 : 0);
      const nextIncorrect = current.incorrect + (isCorrect ? 0 : 1);
      const nextReps = current.reps + 1;
      const intervalMinutes = isCorrect
        ? current.intervalMinutes === 0
          ? 10
          : current.intervalMinutes < 60
            ? current.intervalMinutes * 6
            : Math.round(current.intervalMinutes * 2.2)
        : 5;

      return {
        ...prev,
        [question.id]: {
          ...current,
          reps: nextReps,
          correct: nextCorrect,
          incorrect: nextIncorrect,
          lapses: current.lapses + (isCorrect ? 0 : 1),
          intervalMinutes,
          dueAt: now + intervalMinutes * 60 * 1000,
          lastReviewedAt: now,
          lastResult: isCorrect ? "correct" : "incorrect",
        },
      };
    });

    setHistory((prev) =>
      [
        ...prev,
        { questionId: question.id, topic: question.topic, correct: isCorrect, timestamp: now, source },
      ].slice(-1200),
    );
    setMistakeIds((prev) => {
      if (isCorrect) {
        return prev.filter((id) => id !== question.id);
      }
      return prev.includes(question.id) ? prev : [...prev, question.id];
    });
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarkIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    );
  };

  const isBookmarked = (questionId: string) => bookmarkIds.includes(questionId);

  return {
    bookmarkedQuestions,
    cards,
    isBookmarked,
    mistakeEntries,
    mistakeQuestions,
    recordAnswer,
    reviewQueue,
    stats,
    toggleBookmark,
  };
}
