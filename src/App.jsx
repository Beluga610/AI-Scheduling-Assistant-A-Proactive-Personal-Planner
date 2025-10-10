import HostIcon from './components/HostIcon.jsx';
import BotIcon from './components/BotIcon.jsx';
// import GameIcon from './components/GameIcon.jsx';
// import GameForm from './components/GameForm.jsx';
// import GameMessage from './components/GameMessage.jsx';
// import { useEffect, useState, useRef } from "react";


const App = () => {
  return (
    <div className="container">
      <div className="chat-popup">

        {/* Gamechat Header  */}
        <div className="chat-header">
          <div className="header-info">
            <button className="material-symbols-rounded">menu</button>
            <h2 className="logo-text">Who is Human?</h2>

          </div>
        </div>

        {/* Gamechat body */}
        <div className="chat-body">
          <div className="message host-message">
            <HostIcon />
            <p className="message-text">🐖host-message placeholder</p>
          </div>

          <div className="message bot-message">
            {/* <GameIcon /> */}
            <BotIcon />
            <p className="message-text">🤖bot-message placeholder</p>
            </div>

          <div className="message user-message">
            <p className="message-text">🙂user-message placeholder</p>
          </div>
        </div>

        {/* Gamechat footer */}
        <div className="chat-footer">
          <form action="#" className="chat-form">
            <input type="text" placeholder='Message...' className="message-input" required/>
            <button className="material-symbols-rounded">arrow_upward</button>
          </form>
        </div>

      </div>


      <div className="sidemenu">
        <div className="newGame">
          <p>Add new game  [+] </p>
        </div>
        <div className="sessionList">
          <p>session-1    ...</p>
          <p>session-2    ...</p>
          <button className="material-symbols-rounded">delete</button>
        </div>
      </div>

    </div>

      
  );
};

export default App;
