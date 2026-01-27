import type { PointerEvent } from "react";
import type { Mode, Question } from "../App";

interface QuestionCardProps {
  question: Question;
  mode: Mode;
  showExplanation: boolean;
  onToggleExplanation: () => void;
  onAnswer: (choiceLabel: string) => void;
  selectedAnswer: string | null;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}

const voiceHints: Record<Mode, string> = {
  Voice: "Say A, B, C, D, or E. Use ‘Repeat’ or ‘Next’.",
  Screen: "Tap an option or swipe for the next question.",
  Hybrid: "Listen + tap, or answer by voice A–E."
};

export default function QuestionCard({
  question,
  mode,
  showExplanation,
  onToggleExplanation,
  onAnswer,
  selectedAnswer,
  onSwipeNext,
  onSwipePrevious,
  onSwipeUp,
  onSwipeDown
}: QuestionCardProps) {
  let startX = 0;
  let startY = 0;

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    startX = event.clientX;
    startY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const threshold = 60;

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
        {question.choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            className={`choice ${selectedAnswer === choice.label ? "selected" : ""}`}
            onClick={() => onAnswer(choice.label)}
          >
            <span className="choice-label">{choice.label}</span>
            <span>{choice.text}</span>
          </button>
        ))}
      </div>

      <button type="button" className="explain-toggle" onClick={onToggleExplanation}>
        {showExplanation ? "Hide explanation" : "Explain"}
      </button>

      {showExplanation && (
        <div className="explanation">
          <p className="short">{question.explanation_short}</p>
          <p className="long">{question.explanation_long}</p>
        </div>
      )}
    </article>
  );
}
