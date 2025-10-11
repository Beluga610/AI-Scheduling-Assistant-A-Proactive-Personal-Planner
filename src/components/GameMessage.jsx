import BotIcon from "./BotIcon";
import HostIcon from "./HostIcon";

const GameMessage = ({message}) => {
    return(
        <div
         id={message.id} 
         className={`message ${message.role}-message ${message.loading ? "loading" : ""} ${message.error ? "error" : ""}`}>
            {/* adding the botplayer/host icon only if the role is bot/host */}
            {message.role === "host" && <HostIcon />}
            {message.role === "bot" && <BotIcon />}
            
            
            <p className="text">{message.content}</p>
        </div>
    );
};

export default GameMessage;