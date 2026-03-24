import { useRef, type PointerEvent } from "react";
import type { Mode, Question } from "../App";

interface QuestionCardProps {
  question: Question;
  mode: Mode;
  showExplanation: boolean;
  allowExplanation?: boolean;
  revealAnswer?: boolean;
  onChoiceIntent?: () => void;
  onToggleExplanation: () => void;
  onAnswer: (choiceLabel: string) => void;
  selectedAnswer: string | null;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}

const voiceHints: Record<Mode, string> = {
  Voice: "Say A-E or speak the option text itself. You can also tap the choice.",
  Screen: "Tap an option or swipe for the next question.",
  Hybrid: "Listen first, then answer by voice or by tapping the option."
};

export default function QuestionCard({
  question,
  mode,
  showExplanation,
  allowExplanation = true,
  revealAnswer = true,
  onChoiceIntent,
  onToggleExplanation,
  onAnswer,
  selectedAnswer,
  onSwipeNext,
  onSwipePrevious,
  onSwipeUp,
  onSwipeDown
}: QuestionCardProps) {
  const swipeStartRef = useRef<{ x: number; y: number; tracking: boolean }>({
    x: 0,
    y: 0,
    tracking: false,
  });
  const suppressSwipeUntilRef = useRef(0);
  const pointerHandledChoiceRef = useRef<string | null>(null);
  const isAnswered = selectedAnswer !== null;

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest("button, a, input, select, textarea, label"));

  const suppressSwipe = () => {
    suppressSwipeUntilRef.current = Date.now() + 500;
    swipeStartRef.current = { x: 0, y: 0, tracking: false };
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) {
      suppressSwipe();
      return;
    }

    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      tracking: true,
    };
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (Date.now() < suppressSwipeUntilRef.current) {
      swipeStartRef.current.tracking = false;
      return;
    }

    if (!swipeStartRef.current.tracking || isInteractiveTarget(event.target)) {
      swipeStartRef.current.tracking = false;
      return;
    }

    const deltaX = event.clientX - swipeStartRef.current.x;
    const deltaY = event.clientY - swipeStartRef.current.y;
    const threshold = 60;
    swipeStartRef.current.tracking = false;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        onSwipePrevious();
      } else {
        onSwipeNext();
      }
      return;
    }

    if (Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        onSwipeUp();
      } else {
        onSwipeDown();
      }
    }
  };

  return (
    <article
      className="question-card"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role="group"
      aria-label="Question card with swipe controls"
    >
      <header>
        <p className="topic-tag">
          {question.topic} · {question.subtopic}
        </p>
        <h2>{question.prompt}</h2>
        <p className="voice-hint">{voiceHints[mode]}</p>
      </header>

      <div className="choices">
        {question.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.label;
          const isCorrect = choice.label === question.answer_key;
          const stateClass = isAnswered && revealAnswer
            ? isCorrect
              ? "is-correct"
              : isSelected
              ? "is-wrong"
              : "is-muted"
            : "";

          return (
            <button
              key={choice.label}
              type="button"
              className={`choice ${isSelected ? "selected" : ""} ${stateClass}`}
              onPointerDown={(event) => {
                suppressSwipe();
                onChoiceIntent?.();
                event.stopPropagation();
              }}
              onPointerUp={(event) => {
                suppressSwipe();
                pointerHandledChoiceRef.current = choice.label;
                onAnswer(choice.label);
                event.stopPropagation();
              }}
              onPointerCancel={suppressSwipe}
              onTouchStart={suppressSwipe}
              onClick={(event) => {
                if (pointerHandledChoiceRef.current === choice.label) {
                  pointerHandledChoiceRef.current = null;
                  event.preventDefault();
                  event.stopPropagation();
                  return;
                }
                onChoiceIntent?.();
                onAnswer(choice.label);
              }}
              disabled={isAnswered}
            >
              <span className="choice-label">{choice.label}</span>
              <span>{choice.text}</span>
            </button>
          );
        })}
      </div>

      {isAnswered ? (
        <div className="answer-reveal">
          {revealAnswer ? (
            <>
              <strong>Correct answer: {question.answer_key}</strong>
              <span>
                {selectedAnswer === question.answer_key
                  ? "Locked in correctly."
                  : "Review the correction, then move to the next card."}
              </span>
            </>
          ) : (
            <>
              <strong>Answer locked.</strong>
              <span>Mock answers stay hidden until the pressure run is finished.</span>
            </>
          )}
        </div>
      ) : null}

      {allowExplanation ? (
        <button
          type="button"
          className="explain-toggle"
          onPointerDown={(event) => {
            suppressSwipe();
            event.stopPropagation();
          }}
          onPointerUp={(event) => {
            suppressSwipe();
            event.stopPropagation();
          }}
          onPointerCancel={suppressSwipe}
          onTouchStart={suppressSwipe}
          onClick={onToggleExplanation}
        >
          {showExplanation ? "Hide explanation" : "Explain"}
        </button>
      ) : null}

      {allowExplanation && showExplanation && (
        <div className="explanation">
          <p className="short">{question.explanation_short}</p>
          <p className="long">{question.explanation_long}</p>
        </div>
      )}
    </article>
  );
}
