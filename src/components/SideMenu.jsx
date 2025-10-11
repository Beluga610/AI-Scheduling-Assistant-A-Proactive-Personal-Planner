import AddIcon from './AddIcon.jsx';
import DeleteIcon from './DeleteIcon.jsx';
import ChatBubbleIcon from './ChatBubbleIcon.jsx';

const SideMenu = ({menuRef, isMenuOpen, games, setGames, activeGame, setActiveGame}) => {

    const createNewGame = () => {
        // check if any existing game chat is empty
        const emptyGame = games.find((conv) => conv.messages.length ===0);

        if (emptyGame) {
            // if an empty game exists, make it active instead of creating a new one
            setActiveGame(emptyGame.id);
            return;
        }

        // only create a new Game if there are no empty ones
        const newId = `conv-${Date.now()}`;
        setGames([{id: newId, title: "New Game", message: []}, ...games]);
        setActiveGame(newId);
    };

    // delete games and handle active selection
    const deleteGame = (id, e) => {
        e.stopPropagation();    //prevent triggering game selection

        //check if this is the last game
        if (games.length === 1) {
            const newGame = { id: "default", title: "New Game", messages: []};
            setGames([newGame]);
            setActiveGame("default");    //Set active to match the new game ID
        } else {
            //remove the game
            const updatedGames = games.filter((conv) => conv.id !== id);
            setGames(updatedGames);

            // if deleting the active Game, switch to another one
            if (activeGame === id) {
                //find the first game that isn't being deleted
                const nextGame = updatedGames[0];
                setActiveGame(nextGame.id);
            }
        }
    };

    return (
        <div ref={menuRef} className={`sideMenu ${isMenuOpen ? "open" : ""}`}>

            {/* sideMenu header */}
        <div className="sideMenu-header">
            <button className="newGame-btn" onClick={createNewGame}>
                <AddIcon />
                <span>New chat</span>
            </button>
        </div>

        {/* sideMenu body*/}
        <div className="sideMenu-content">
            <h2 className="sideMenu-title">Game history</h2>
            <ul className="gameList">
                {games.map((conv) => (
                    <li key={conv.id} 
                    className={`gameItem ${activeGame === conv.id ? "active" : ""}`}
                    onClick={() => setActiveGame(conv.id)}>
                        <div className="game-icon-title">
                            <div className="game-icon">
                                <ChatBubbleIcon />
                            </div>
                            <span className="game-title">{conv.title}</span>
                        </div>
                    {/* only show delete button if more than one game or not a new game */}
                    <button 
                    className={`delete-btn ${games.length > 1 || conv.title !== "New Game" ? "" : "hide"}`} 
                    onClick={(e) => deleteGame(conv.id, e)}>
                        <DeleteIcon />
                    </button>
                    </li>
                ))}
          </ul>
        </div>

        {/* sideMenu Footer*/}
        <div className="sideMenu-footer">
            <span>mode</span>
        </div>
        </div>
    );
};

export default SideMenu;