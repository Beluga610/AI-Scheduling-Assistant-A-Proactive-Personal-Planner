// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_GAME,
  START_GAME,
  SEND_MESSAGE,
  GET_GAME,
  NEXT_PHASE,
  SUBMIT_VOTE,
} from './graphql/queries';
import './App.css';

interface Player {
  id: string;
  name: string;
  kind: string;
  isEliminated: boolean;
}

interface Message {
  id: string;
  playerName: string;
  text: string;
  timestamp: string;
}

interface GameData {
  id: string;
  phase: string;
  round: number;
  winner: string | null;
  players: Player[];
  messages: Message[];
}

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('human1');
  const [message, setMessage] = useState('');
  const [playerName, setPlayerName] = useState('玩家1');

  // GraphQL Mutations
  const [createGame, { loading: creating }] = useMutation(CREATE_GAME);
  const [startGame, { loading: starting }] = useMutation(START_GAME);
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [nextPhase] = useMutation(NEXT_PHASE);
  const [submitVote] = useMutation(SUBMIT_VOTE);

  // Query game state (轮询)
  const { data, refetch } = useQuery(GET_GAME, {
    variables: { id: gameId },
    skip: !gameId,
    pollInterval: 2000, // 每2秒刷新一次
  });

  const game: GameData | null = data?.game;

  // 创建游戏
  const handleCreateGame = async () => {
    try {
      const { data } = await createGame({
        variables: { playerName },
      });
      setGameId(data.createGame.id);
      const humanPlayer = data.createGame.players.find(
        (p: Player) => p.kind === 'HUMAN'
      );
      setPlayerId(humanPlayer?.id || 'human1');
      console.log('✅ 游戏创建成功:', data.createGame.id);
    } catch (error) {
      console.error('❌ 创建游戏失败:', error);
      alert('创建游戏失败: ' + (error as Error).message);
    }
  };

  // 开始游戏
  const handleStartGame = async () => {
    if (!gameId) return;
    try {
      await startGame({ variables: { gameId } });
      console.log('✅ 游戏开始');
    } catch (error) {
      console.error('❌ 开始游戏失败:', error);
      alert('开始游戏失败: ' + (error as Error).message);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!gameId || !message.trim()) return;
    try {
      await sendMessage({
        variables: {
          gameId,
          playerId,
          text: message,
        },
      });
      setMessage('');
      console.log('✅ 消息发送成功');
      // 手动刷新以立即看到消息
      setTimeout(() => refetch(), 500);
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      alert('发送消息失败: ' + (error as Error).message);
    }
  };

  // 进入投票
  const handleNextPhase = async () => {
    if (!gameId) return;
    try {
      await nextPhase({ variables: { gameId } });
      console.log('✅ 进入投票阶段');
    } catch (error) {
      console.error('❌ 切换阶段失败:', error);
    }
  };

  // 投票
  const handleVote = async (targetId: string) => {
    if (!gameId) return;
    try {
      await submitVote({
        variables: {
          gameId,
          voterId: playerId,
          targetId,
        },
      });
      console.log('✅ 投票成功');
    } catch (error) {
      console.error('❌ 投票失败:', error);
    }
  };

  const getPhaseText = (phase: string) => {
    const phases: Record<string, string> = {
      LOBBY: '等待中',
      DISCUSSION: '讨论中',
      VOTING: '投票中',
      FINISHED: '已结束',
    };
    return phases[phase] || phase;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 谁是人类？</h1>
        <p className="subtitle">React + Apollo Client + DeepSeek</p>
      </header>

      {/* 连接状态 */}
      <div className="connection-status">
        <div className="status-dot"></div>
        <span>连接到 GraphQL: http://localhost:4000/graphql</span>
      </div>

      {/* 游戏状态 */}
      {game && (
        <div className="game-status">
          <div className="status-item">
            <span className="label">状态:</span>
            <span className="value">{getPhaseText(game.phase)}</span>
          </div>
          <div className="status-item">
            <span className="label">回合:</span>
            <span className="value">{game.round}</span>
          </div>
          <div className="status-item">
            <span className="label">游戏 ID:</span>
            <span className="value">{game.id.substring(0, 12)}...</span>
          </div>
        </div>
      )}

      {/* 获胜者横幅 */}
      {game?.winner && (
        <div className="winner-banner">
          <h2>🎉 游戏结束！</h2>
          <p>{game.winner === 'HUMAN' ? '人类获胜！' : 'AI 获胜！'}</p>
        </div>
      )}

      {/* 创建游戏 */}
      {!gameId && (
        <div className="create-game">
          <input
            type="text"
            placeholder="输入你的名字"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input"
          />
          <button
            onClick={handleCreateGame}
            disabled={creating}
            className="btn btn-primary"
          >
            {creating ? '创建中...' : '创建游戏'}
          </button>
        </div>
      )}

      {/* 玩家列表 */}
      {game && (
        <div className="players">
          <h3>玩家列表</h3>
          <div className="player-list">
            {game.players.map((player) => (
              <div
                key={player.id}
                className={`player ${player.kind.toLowerCase()} ${
                  player.isEliminated ? 'eliminated' : ''
                }`}
              >
                {player.name} {player.kind === 'HUMAN' ? '👤' : '🤖'}
                {player.isEliminated && ' ❌'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 聊天框 */}
      {game && (
        <div className="chat-container">
          <div className="messages">
            {game.messages.map((msg) => {
              const player = game.players.find(
                (p) => p.name === msg.playerName
              );
              const kind = player?.kind || 'SYSTEM';
              return (
                <div
                  key={msg.id}
                  className={`message ${kind.toLowerCase()}`}
                >
                  <div className="message-sender">{msg.playerName}</div>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 输入框 */}
          {game.phase === 'DISCUSSION' && (
            <div className="input-area">
              <input
                type="text"
                placeholder="输入消息..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sending}
                className="input"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="btn btn-primary"
              >
                {sending ? '发送中...' : '发送'}
              </button>
            </div>
          )}

          {/* 投票区域 */}
          {game.phase === 'VOTING' && (
            <div className="voting-area">
              <h3>🗳️ 投票阶段</h3>
              <p>选择你认为是 AI 的玩家：</p>
              <div className="vote-buttons">
                {game.players
                  .filter((p) => !p.isEliminated && p.id !== playerId)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleVote(player.id)}
                      className="btn btn-vote"
                    >
                      投票: {player.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 控制按钮 */}
      {gameId && (
        <div className="controls">
          {game?.phase === 'LOBBY' && (
            <button
              onClick={handleStartGame}
              disabled={starting}
              className="btn btn-success"
            >
              {starting ? '启动中...' : '开始游戏'}
            </button>
          )}
          {game?.phase === 'DISCUSSION' && (
            <button onClick={handleNextPhase} className="btn btn-warning">
              进入投票
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn btn-danger"
          >
            重置
          </button>
        </div>
      )}

      {/* 调试信息 */}
      <details className="debug">
        <summary>🔍 调试信息</summary>
        <pre>{JSON.stringify({ gameId, playerId, game }, null, 2)}</pre>
      </details>
    </div>
  );
}

export default App;
