// 正常流程：接收输入 -> 更新当前会话 -> 显示消息 -> 调用AI生成回复 -> 更新当前会话 -> 显示消息

// 假流程
import { useState } from "react";

const GameForm = ({ triggerNextPhase, isLoading, setIsLoading, addMessage, phase }) => {
  const [gameText, setGameText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || !gameText.trim()) return;

    setIsLoading(true);

    // User's message
    addMessage("human", gameText);
    const userInput = gameText;

    setGameText("");

    // Simulate a brief delay
    setTimeout(() => {
      triggerNextPhase(null, userInput);
      setIsLoading(false);
    }, 500);
  };

  return (
    <form action="#" className="chat-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={phase === "end" ? "Game Over" : "Message..."}
        className="message-input"
        value={gameText}
        onChange={(e) => setGameText(e.target.value)}
        disabled={phase === "end"}
        required
      />
      <button type="submit" className="material-symbols-rounded" disabled={phase === "end"}>
        arrow_upward
      </button>
    </form>
  );
};

export default GameForm;
