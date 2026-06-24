import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const USER_ID = "local-user";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const MODE_LABELS = {
  chat: "Conversation",
  translation: "Translation",
  correction: "Correction",
  practice: "Practice",
};

const STARTERS = [
  "Hello! How are you?",
  "como se dice quiero viajar",
  "Give me a practice challenge",
];

function fallbackResponse(level) {
  return {
    reply: "I could not reach the backend. Please try again.",
    correction: null,
    explanation: null,
    suggestion: "Check that FastAPI is running on port 8000.",
    mode: "chat",
    level,
  };
}

function normalizeResponse(data, level) {
  const fallback = fallbackResponse(level);

  return {
    reply: typeof data?.reply === "string" ? data.reply : fallback.reply,
    correction: data?.correction ?? null,
    explanation: data?.explanation ?? null,
    suggestion: data?.suggestion ?? null,
    mode: MODE_LABELS[data?.mode] ? data.mode : "chat",
    level: LEVELS.includes(data?.level) ? data.level : level,
  };
}

function LoadingBubble() {
  return (
    <div className="assistant-bubble loading-bubble" aria-label="LinguaChat is thinking">
      <span />
      <span />
      <span />
    </div>
  );
}

function FeedbackCard({ label, children, tone }) {
  return (
    <div className={`feedback-card feedback-card--${tone}`}>
      <div className="feedback-label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function ChatTurn({ turn }) {
  return (
    <article className="chat-turn">
      <div className="user-row">
        <div className="user-bubble">{turn.user}</div>
      </div>

      {turn.pending && <LoadingBubble />}

      {turn.ai && (
        <div className="assistant-group">
          <div className="assistant-bubble">
            <div className="message-meta">
              <span className={`mode-badge mode-badge--${turn.ai.mode}`}>
                {MODE_LABELS[turn.ai.mode]}
              </span>
              <span>{turn.ai.level}</span>
            </div>
            <p>{turn.ai.reply}</p>
          </div>

          {(turn.ai.correction || turn.ai.explanation) && (
            <div className="feedback-grid">
              {turn.ai.correction && (
                <FeedbackCard label="Correction" tone="correction">
                  {turn.ai.correction}
                </FeedbackCard>
              )}
              {turn.ai.explanation && (
                <FeedbackCard label="Why" tone="explanation">
                  {turn.ai.explanation}
                </FeedbackCard>
              )}
            </div>
          )}

          {turn.ai.suggestion && (
            <div className="suggestion">
              <span>Next</span>
              {turn.ai.suggestion}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [level, setLevel] = useState(() => localStorage.getItem("linguachat-level") || "A1");
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("linguachat-theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const feedRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("linguachat-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("linguachat-level", level);
  }, [level]);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) {
      feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });
    }
  }, [chat]);

  const sendMessage = async (starterMessage) => {
    const userMessage = (starterMessage ?? message).trim();
    if (!userMessage || isSending) return;

    const turnId = `${Date.now()}-${userMessage}`;
    setChat((prev) => [...prev, { id: turnId, user: userMessage, pending: true, ai: null }]);
    setMessage("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: USER_ID,
          message: userMessage,
          level,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.reply || "LinguaChat could not answer.");
      }

      const ai = normalizeResponse(data, level);
      setChat((prev) =>
        prev.map((turn) =>
          turn.id === turnId ? { ...turn, pending: false, ai } : turn,
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "The backend is unavailable.");
      setChat((prev) =>
        prev.map((turn) =>
          turn.id === turnId
            ? { ...turn, pending: false, ai: fallbackResponse(level) }
            : turn,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="app-shell">
      <section className="chat-panel">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark">LC</div>
            <div>
              <h1>LinguaChat</h1>
              <p>English practice</p>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="level-control">
              <span>Level</span>
              <select value={level} onChange={(event) => setLevel(event.target.value)}>
                {LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="theme-control" title="Toggle dark mode">
              <input
                type="checkbox"
                checked={isDark}
                onChange={(event) => setIsDark(event.target.checked)}
              />
              <span className="toggle-track" aria-hidden="true">
                <span className="toggle-thumb" />
              </span>
              <span className="theme-label">Dark</span>
            </label>
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="chat-feed" ref={feedRef} aria-live="polite">
          {chat.length === 0 && (
            <div className="empty-state">
              <div className="empty-mark">LC</div>
              <h2>Start a conversation</h2>
              <div className="starter-list">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => sendMessage(starter)}
                    disabled={isSending}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((turn) => (
            <ChatTurn key={turn.id} turn={turn} />
          ))}
        </div>

        <div className="composer">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            disabled={isSending}
          />
          <button
            className="send-button"
            type="button"
            onClick={() => sendMessage()}
            disabled={isSending || !message.trim()}
          >
            Send
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
