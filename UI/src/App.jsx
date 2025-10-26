let WELCOME_SHOWN = false;    // make sure welcome message shows only once
import SideMenu from './components/SideMenu.jsx';
import { useEffect, useState, useRef } from "react";
import GameForm from './components/GameForm.jsx';
import GameMessage from './components/GameMessage.jsx';


const App = () => {
  // ---------- Side Menu------------
  // games: list of all chat rooms (here we only have one default game)
  // activeGame: which chat room is currently active
  const [games, setGames] = useState([{ id: "default", title: "New Game", messages: [] }]);
  const [activeGame, setActiveGame] = useState("default");

  // handle side menu open/close
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Detect clicks outside the side menu -> close it
  useEffect(() => {
      const handleClickOutside = (event) => {
      // If the menu is open and the click target is not within the menu area (menuRef)
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
          setIsMenuOpen(false); 
          }
      };
      // Add event listener; if menu is closed, remove event listener 
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // ---------- Game Status ------------
  const [messages, setMessages] = useState([]);       // All game message up to now
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState("welcome");      // Phase: welcome - start - discussion - end
  const [bots] = useState(["P1", "P2", "P3"]);  // bots name

  // ------------initialize game ------------
  // Phase 1: A brief intro
  useEffect(() => {
    // show welcome message only once when the game starts
    if (!WELCOME_SHOWN) {
      addMessage("host", "Welcome to 'Who is Human?', send 'start' to start game.");
      WELCOME_SHOWN = true;
    }
  }, []);

  // ----------helper function: add message ( ai-generated code )---------
  // "loading" is a reserved field for future expansion after connecting to real AI
  const addMessage = (role, content, loading = false) => {
    const id = `${role}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newMsg = { id, role, content, loading };
    setMessages((prev) => [...prev, newMsg]);
  };

  // ---------- Game phase control --------
  const triggerNextPhase = (games, userInput) => {
    // Phase 2: player type "start", host AI reveal discussion topic
    if (phase === "welcome" && userInput.toLowerCase().includes("start")) {
      setPhase("start");
      addMessage("host", "Topic: 'What is your favourite way to spend a day off?'");
      addMessage("host", "Order: P1 -> P2 -> P3 -> P0(user)");
      triggerBotTurns();    // start bots’ turns
    } 

    // *bug to be fixed here (phase 2&3 mixed)
    else if (phase === "discussion") {
      // after P0 speak, host will guess who is AI.
      addMessage("host", "P3 is AI! Game over, thanks for playing!");
      setPhase("end");
    }
  };

  // ---------Simulated AI response -------
  const triggerBotTurns = () => {
    setPhase("discussion");
    // fixed replies from 3 bots
    const fakeReplies = [
      "I am Gemini, I like watching movies.",
      "I am ChatGPT, I like board games.",
      "I am Doubao, I like outdoor sports."
    ];

    // show each bot’s reply with delay
    fakeReplies.forEach((text, i) => {
      setTimeout(() => {
        addMessage("bot", `${bots[i]}：${text}`);
        // After bot speaking, host will cue user to speak
        if (i === fakeReplies.length - 1) {
          setTimeout(() => {
            addMessage("host", "Your turn to speak");
          }, 1200);
        }
      }, (i + 1) * 2000);
    });
  };    


  // ----------- Render (UI layout) -------------
  return (
    <div className="outer-wrapper">
    <div className={`container ${isMenuOpen ? "menu-open" : ""}`}>

      {/* Side menu */}
      <SideMenu menuRef={menuRef} games={games} setGames={setGames} activeGame={activeGame} setActiveGame={setActiveGame} isMenuOpen={isMenuOpen}/>

      {/* Main chat window */}
      <div className="chat-popup">
        {/* Gamechat Header (title & menu button) */}
        <div className="chat-header">
          <div className="header-info">
            <button className="material-symbols-rounded" onClick={() => setIsMenuOpen((v) => !v)}>menu</button>
            <h2 className="logo-text">Who is Human?</h2>

          </div>
        </div>

        {/* Gamechat body (display chat content)*/}
        <div className="chat-body">
          {messages.map((m) => (
              <GameMessage key={m.id} message={m} />
            ))}
        </div>

        {/* Gamechat footer (input area)*/}
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
