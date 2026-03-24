import type { Topic } from "../App";

interface TopicListProps {
  topics: Topic[];
  activeTopic: string | null;
  onSelectTopic: (topicName: string | null) => void;
}

export default function TopicList({ topics, activeTopic, onSelectTopic }: TopicListProps) {
  return (
    <div className="topic-list">
      <h3>Browse topics</h3>
      {topics.length === 0 ? (
        <p className="muted">Loading topics…</p>
      ) : (
        <ul>
          <li className={activeTopic === null ? "active" : ""}>
            <button type="button" onClick={() => onSelectTopic(null)}>
              <div>
                <strong>All Topics</strong>
                <p>Return to the mixed review queue.</p>
              </div>
            </button>
          </li>
          {topics.map((topic) => (
            <li key={topic.name} className={topic.name === activeTopic ? "active" : ""}>
              <button type="button" onClick={() => onSelectTopic(topic.name)}>
                <div>
                  <strong>{topic.name}</strong>
                  <p>{topic.subtopics.join(" · ")}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
