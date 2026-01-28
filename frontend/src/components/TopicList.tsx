import type { Topic } from "../App";

interface TopicListProps {
  topics: Topic[];
  activeTopic: string;
}

export default function TopicList({ topics, activeTopic }: TopicListProps) {
  return (
    <div className="topic-list">
      <h3>Browse topics</h3>
      {topics.length === 0 ? (
        <p className="muted">Loading topics…</p>
      ) : (
        <ul>
          {topics.map((topic) => (
            <li key={topic.name} className={topic.name === activeTopic ? "active" : ""}>
              <div>
                <strong>{topic.name}</strong>
                <p>{topic.subtopics.join(" · ")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
