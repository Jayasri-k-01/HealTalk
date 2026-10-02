import { useState, useEffect, useRef } from "react";
import {
  fetchPatientAssistantContext,
  sendAssistantMessage,
  fetchAssistantHistory,
  clearAssistantHistory,
} from "../../services/assistantService";
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Globe,
  Trash2,
  ShieldCheck,
  Heart,
  Pill,
} from "lucide-react";

function AiHealthAssistant({ user }) {
  const [preferredLang, setPreferredLang] = useState(user?.language || "English");
  const [patientContext, setPatientContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  const samplePrompts = [
    `What are common symptoms of hypertension?`,
    `How to manage a high fever at home?`,
    `What questions should I ask my doctor during my consultation?`,
    `Explain the difference between tension and migraine headaches`,
  ];

  useEffect(() => {
    loadAssistantContextAndHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadAssistantContextAndHistory = async () => {
    try {
      setLoadingContext(true);
      setError("");

      const [contextRes, historyRes] = await Promise.allSettled([
        fetchPatientAssistantContext(),
        fetchAssistantHistory(),
      ]);

      let initialLang = user?.language || "English";

      if (contextRes.status === "fulfilled" && contextRes.value.patient) {
        setPatientContext(contextRes.value);
        if (contextRes.value.patient.language) {
          initialLang = contextRes.value.patient.language;
          setPreferredLang(initialLang);
        }
      }

      if (
        historyRes.status === "fulfilled" &&
        historyRes.value.history &&
        historyRes.value.history.length > 0
      ) {
        setMessages(historyRes.value.history);
      } else {
        // Initial personalized greeting with real patient name and language
        const patientName = user?.name || contextRes.value?.patient?.name || "";
        setMessages([
          {
            id: 1,
            sender: "ai",
            text: `Hello ${patientName ? patientName + "! " : ""}I am your HealTalk AI Health Assistant. I can help explain symptoms, answer healthcare queries, and provide preliminary medical information in ${initialLang}. How can I assist you today?`,
            time: "Just now",
          },
        ]);
      }
    } catch (err) {
      console.error("Error initializing assistant:", err);
      setError("Failed to load medical context. Operating in standard mode.");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleSend = async (queryToSend) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");
    setIsTyping(true);
    setError("");

    try {
      const response = await sendAssistantMessage(text.trim(), preferredLang);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: response.response,
        time: response.time || timeStr,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Error sending query:", err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: "I am having difficulty connecting to the medical intelligence service. Please check your connection or discuss your symptoms with a HealTalk doctor.",
        time: timeStr,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear your conversation history with the assistant?")) return;
    try {
      await clearAssistantHistory();
      setMessages([
        {
          id: Date.now(),
          sender: "ai",
          text: `Conversation cleared. How can I help you today, ${user?.name || "Patient"}?`,
          time: "Just now",
        },
      ]);
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  return (
    <div className="ai-assistant-container">
      {/* AI Assistant Banner */}
      <div className="ai-header-banner">
        <div className="ai-title-group">
          <div className="ai-icon-large">
            <Bot size={28} />
          </div>
          <div>
            <h2>HealTalk AI Health Assistant</h2>
            <p>Preliminary symptom checker and AI medical information guide</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {patientContext && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f0f7f8",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                color: "#087f8c",
                fontWeight: "600",
                border: "1px solid #d5eaec",
              }}
            >
              <ShieldCheck size={14} />
              <span>Patient Profile Linked</span>
            </div>
          )}

          <div className="ai-lang-pill" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Globe size={15} />
            <span>Responding in:</span>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="French">French (Français)</option>
              <option value="Mandarin">Mandarin (中文)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="cancel-btn"
            title="Clear Chat History"
            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Warning Disclaimer */}
      <div className="medical-disclaimer-bar">
        <AlertTriangle size={16} className="warn-icon" />
        <span>
          <strong>Medical Notice:</strong> AI responses are for informational guidance only and do not replace professional diagnosis from a doctor.
        </span>
      </div>

      {/* Chat Messages Box */}
      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-row ${
                msg.sender === "user" ? "user-row" : "ai-row"
              }`}
            >
              <div className="chat-avatar">
                {msg.sender === "user" ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="chat-bubble">
                <div className="bubble-header">
                  <span className="sender-label">
                    {msg.sender === "user" ? "You" : "HealTalk AI"}
                  </span>
                  <span className="bubble-time">{msg.time}</span>
                </div>
                <p className="bubble-text" style={{ whiteSpace: "pre-line" }}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble-row ai-row">
              <div className="chat-avatar">
                <Bot size={18} />
              </div>
              <div className="chat-bubble typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="suggested-prompts-bar">
          <span className="prompts-label">
            <Sparkles size={14} /> Suggested Questions:
          </span>
          <div className="prompts-list">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                className="prompt-chip"
                onClick={() => handleSend(p)}
                disabled={isTyping}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-input-form"
        >
          <input
            type="text"
            placeholder={`Ask a health question in ${preferredLang}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className="send-btn" disabled={!inputQuery.trim() || isTyping}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AiHealthAssistant;
