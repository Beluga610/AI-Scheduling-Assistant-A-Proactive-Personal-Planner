import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { CHAT_WITH_AI, GET_ME_QUERY } from "../graphql/queries";

export default function AssistantPanel() {
  // 聊天记录状态
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_history");
    return saved ? JSON.parse(saved) : [
      { role: "assistant", text: "你好，我是你的 AI 日程助手。你可以对我说：“帮我安排明天下午3点和 Leo 喝咖啡”" }
    ];
  });
  // 2. 每次 messages 变化时，自动保存到 localStorage
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState("");

  // 这里的 refetchQueries: [GET_ME_QUERY] 是最关键的！
  // 它的作用是：当 AI 创建完日程后，自动通知 React 重新拉取最新的日历数据
  const [sendMessage, { loading }] = useMutation(CHAT_WITH_AI, {
    refetchQueries: [{ query: GET_ME_QUERY }],
    onError: (err) => {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { role: "assistant", text: "抱歉，我好像遇到了一点问题，请稍后再试。" }]);
    }
  });

  // 自动滚动到底部
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]); // loading 变化时也滚一下，为了看 loading 状态

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input;
    
    // 1. 用户消息立即上屏
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setInput("");

    try {
      // 2. 发送给后端
      const { data } = await sendMessage({ variables: { prompt: userText } });
      
      // 3. 后端返回 AI 的回复
      const aiReply = data.chatWithAI.message;
      setMessages(prev => [...prev, { role: "assistant", text: aiReply }]);
      
    } catch (e) {
      // 错误已经在 onError 处理了，这里不用做太多
    }
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h2>AI 助手</h2>
        <p className="assistant-subtitle">自然语言自动排程</p>
      </div>

      <div className="assistant-chat-history" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`assistant-message ${m.role === 'user' ? 'user' : 'bot'}`}>
            {m.text}
          </div>
        ))}
        
        {/* Loading 状态展示 */}
        {loading && (
          <div className="assistant-message bot">
            <span className="typing-indicator">AI 正在思考并安排日程... 🤖</span>
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
          placeholder="例如：明天下午和 Leo 喝下午茶"
          disabled={loading}
        />
        <button 
          className="assistant-send-btn" 
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "..." : "发送"}
        </button>
      </div>
    </div>
  );
}