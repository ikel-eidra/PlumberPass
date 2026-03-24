export type UiTheme = "night" | "paper";

type ThemeToggleProps = {
  theme: UiTheme;
  onChange: (theme: UiTheme) => void;
  className?: string;
};

const options: Array<{ id: UiTheme; label: string }> = [
  { id: "night", label: "Night" },
  { id: "paper", label: "Paper" },
];

export default function ThemeToggle({ theme, onChange, className }: ThemeToggleProps) {
  return (
    <div className={["theme-toggle", className].filter(Boolean).join(" ")} aria-label="Theme selector">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={theme === option.id ? "is-active" : undefined}
          aria-pressed={theme === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
