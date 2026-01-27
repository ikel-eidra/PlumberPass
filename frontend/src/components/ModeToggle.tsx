import type { Mode } from "../App";

interface ModeToggleProps {
  mode: Mode;
  modes: readonly Mode[];
  onChange: (mode: Mode) => void;
}

export default function ModeToggle({ mode, modes, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="Mode selection">
      {modes.map((option) => (
        <button
          key={option}
          type="button"
          className={option === mode ? "active" : ""}
          onClick={() => onChange(option)}
        >
          {option} mode
        </button>
      ))}
    </div>
  );
}
