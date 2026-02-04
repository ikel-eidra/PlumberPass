import type { Question } from "../App";

interface MistakeLibraryProps {
  items: Question[];
}

export default function MistakeLibrary({ items }: MistakeLibraryProps) {
  return (
    <div className="mistake-library">
      <h3>Mistake library</h3>
      {items.length === 0 ? (
        <p className="muted">No mistakes yet. Keep going!</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.prompt}</strong>
              <p>
                {item.topic} · {item.subtopic}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
