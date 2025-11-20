import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { CHAT_WITH_AI, GET_ME_QUERY } from "../graphql/queries";
import "./AssistantPanel.css";

export default function AssistantPanel() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(() => {
    const saved = localStorage.getItem("chat_history");
    return saved ? JSON.parse(saved) : [
      { 
        role: "assistant", 
        text: "Hello! I'm Hitch, your Dating Strategist. Tell me your date target or let's plan a date!"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState("");

  // Setup mutation
  const [sendMessage, { loading }] = useMutation(CHAT_WITH_AI, {
    refetchQueries: [{ query: GET_ME_QUERY }],
    awaitRefetchQueries: true,
    onError: (err) => {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered a problem. Please try again." }]);
    }
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userText = input;
    const historyToSend = messages.slice(-10).map(m => ({
      role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user', 
      content: m.text
    }));
    
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");

    try {
      const { data } = await sendMessage({ 
        variables: { 
          prompt: userText,
          history: historyToSend
        } 
      });
      const aiReply = data.chatWithAI.message;
      setMessages(prev => [...prev, { role: "assistant", text: aiReply }]);
    
    } catch (e) {
    }
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h2>Hitch</h2>
        <h5>Your Personal Relationship Strategist</h5>
        <p className="assistant-subtitle">Natural Language Scheduling</p>
      </div>

      <div className="assistant-chat-history">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`assistant-message ${m.role === 'user' ? 'user' : 'bot'}`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {m.text}
          </div>
        ))}
        
        {loading && (
          <div className="assistant-message bot">
            <span className="typing-indicator">AI is thinking and scheduling... 🤖</span>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      <div className="assistant-input-area">
        <input
          className="assistant-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="e.g., Meeting with Jack on Friday..."
          disabled={loading}
        />
        <button 
          className="assistant-send-btn" 
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}