import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { CHAT_WITH_AI, GET_ME_QUERY } from "../graphql/queries";
// Don't forget to create the CSS file first!
import "./AssistantPanel.css";

export default function AssistantPanel() {
  // Chat history state
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(() => {
    const saved = localStorage.getItem("chat_history");
    return saved ? JSON.parse(saved) : [
      { 
        role: "assistant", 
        text: "Hello! I'm Hitch, your Dating Strategist. Tell me your date target or let's plan a date!"
      }
    ];
  });

  // Persist chat history
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

  // Auto-scroll to bottom
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input;

    // 0. Convert frontend message format to backend 'ChatMessageInput' format
    // We slice(-10) to only send the last 10 messages to save tokens/cost
    const historyToSend = messages.slice(-10).map(m => ({
      role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user', 
      content: m.text
    }));
    
    // 1. Show user message immediately
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");

    try {
      // 2. Send to backend
      const { data } = await sendMessage({ 
        variables: { 
          prompt: userText,
          history: historyToSend // Pass the history here
        } 
      });
      
      // 3. Show AI response
      const aiReply = data.chatWithAI.message;
      setMessages(prev => [...prev, { role: "assistant", text: aiReply }]);
      
    } catch (e) {
      // Error handling is done in onError
    }
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h2>AI Assistant</h2>
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
        
        {/* Loading Indicator */}
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