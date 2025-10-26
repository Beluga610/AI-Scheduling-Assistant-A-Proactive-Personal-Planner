import AddIcon from './AddIcon.jsx';
import DeleteIcon from './DeleteIcon.jsx';
import ChatBubbleIcon from './ChatBubbleIcon.jsx';

const SideMenu = ({ menuRef, isMenuOpen, games, setGames, activeGame, setActiveGame}) => {
  // Create new games
  const createNewGame = () => {
    const newId = `game-${Date.now()}`;
    const newTitle = `Game ${games.length + 1}`;
    const newGame = { id: newId, title: newTitle, messages: [] };

    setGames([...games, newGame]);
    setActiveGame(newId);
  };

  // Delete games
  const deleteGame = (id) => {
    const updatedGames = games.filter((g) => g.id !== id);
    setGames(updatedGames);

    // if delete active games by mistake, auto switch to the last game 
    if (activeGame === id && updatedGames.length > 0) {
      setActiveGame(updatedGames[updatedGames.length - 1].id);
    }
  };

  return (
    <div ref={menuRef} className={`sideMenu ${isMenuOpen ? "open" : ""}`}>
        {/* sideMenu header */}
        <div className="sideMenu-header">
        <h3>Sessions</h3>
        <button className="newGame-btn" onClick={createNewGame}>
            <AddIcon />
            <span>New chat</span>
        </button>
      </div>

      <ul className="gameList">
        {(games || []).map((conv) => (
          <li key={conv.id}
            className={`gameItem ${activeGame === conv.id ? "active" : ""}`}
            onClick={() => setActiveGame(conv.id)}>
                <div className="game-icon-title">
                    <div className="game-icon">
                        <ChatBubbleIcon />
                    </div>
                    <span className="game-title">{conv.title}</span>
                    <button className={`delete-btn ${conv.messages.length > 0 ? "" : "hide"}`}
                     onClick={(e) => {e.stopPropagation(); deleteGame(conv.id);}}>
                     <DeleteIcon />
                    </button>
                </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideMenu;
