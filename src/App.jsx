let WELCOME_SHOWN = false;
import SideMenu from './components/SideMenu.jsx';
import { useEffect, useState, useRef } from "react";
import GameForm from './components/GameForm.jsx';
import GameMessage from './components/GameMessage.jsx';


const App = () => {
  // ---------- Side Menu------------
  const [games, setGames] = useState([{ id: "default", title: "New Game", messages: [] }]);
  const [activeGame, setActiveGame] = useState("default");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
      const handleClickOutside = (event) => {
      // If the menu is open and the click target is not within the menu area (menuRef)
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
          setIsMenuOpen(false); 
          }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // ---------- Game Status------------
  const [messages, setMessages] = useState([]);       // All game message up to now
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState("welcome");      // Phase: welcome - start - discussion - end
  const [bots] = useState(["P1", "P2", "P3"]);  // bots name
  // const [hasWelcomed, setHasWelcomed] = useState(false);

  // initialize game
  useEffect(() => {
    if (!WELCOME_SHOWN) {
      addMessage("host", "Welcome to 'Who is Human?', send 'start' to start game.");
      WELCOME_SHOWN = true;
    }
  }, []);

  // ----------helper function: add message ---------
  const addMessage = (role, content, loading = false) => {
    const id = `${role}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newMsg = { id, role, content, loading };
    setMessages((prev) => [...prev, newMsg]);
  };

  // ---------- Game phase control --------
  const triggerNextPhase = (games, userInput) => {
    if (phase === "welcome" && userInput.toLowerCase().includes("start")) {
      setPhase("start");
      addMessage("host", "Topic: 'What is your favourite way to spend a day off?'");
      addMessage("host", "Order: P1 -> P2 -> P3 -> P0(user)");
      triggerBotTurns();
    } 
    else if (phase === "discussion") {
      // after P0 speak, host will guess who is AI.
      addMessage("host", "P3 is AI! Game over, thanks for playing!");
      setPhase("end");
    }
  };

  // ---------Mock AI response -------
  const triggerBotTurns = () => {
    setPhase("discussion");
    const fakeReplies = [
      "I am Gemini, I like watching movies.",
      "I am ChatGPT, I like board games.",
      "I am Doubao, I like outdoor sports."
    ];

    fakeReplies.forEach((text, i) => {
      setTimeout(() => {
        addMessage("bot", `${bots[i]}：${text}`);
        if (i === fakeReplies.length - 1) {
          // After bot speaking, host will cue user
          setTimeout(() => {
            addMessage("host", "Your turn to speak");
          }, 1200);
        }
      }, (i + 1) * 2000);
    });
  };    


  return (
    <div className="outer-wrapper">
    <div className={`container ${isMenuOpen ? "menu-open" : ""}`}>

      <SideMenu menuRef={menuRef} games={games} setGames={setGames} activeGame={activeGame} setActiveGame={setActiveGame} isMenuOpen={isMenuOpen}/>

      <div className="chat-popup">
        {/* Gamechat Header  */}
        <div className="chat-header">
          <div className="header-info">
            <button className="material-symbols-rounded" onClick={() => setIsMenuOpen((v) => !v)}>menu</button>
            <h2 className="logo-text">Who is Human?</h2>

          </div>
        </div>

        {/* Gamechat body */}
        <div className="chat-body">
          {messages.map((m) => (
              <GameMessage key={m.id} message={m} />
            ))}
        </div>

        {/* Gamechat footer */}
        <div className="chat-footer">
          <GameForm 
          triggerNextPhase={triggerNextPhase} 
          isLoading={isLoading} 
          setIsLoading={setIsLoading}
          addMessage={addMessage}
          phase={phase} />
        </div>
      </div>

    </div>
    </div>

  ); 
};

export default App;
