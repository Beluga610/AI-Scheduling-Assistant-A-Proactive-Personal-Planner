// Normal process: user input -> update conversation and display message -> call ai to generate response -> update&display


// Dummy process: Simulate one round of speaking using hardcoded data and a timer.
import { useState } from "react";

const GameForm = ({ triggerNextPhase, isLoading, setIsLoading, addMessage, phase }) => {
  const [gameText, setGameText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prevent users from clicking "send" before the host has finished speaking; avoid triggering the action repeatedly
    if (isLoading || !gameText.trim()) return;
    
    setIsLoading(true);

    // User's message
    addMessage("human", gameText);
    const userInput = gameText;

    setGameText("");

    // A brief delay to stimulate AI thinking (currently no backend)
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
