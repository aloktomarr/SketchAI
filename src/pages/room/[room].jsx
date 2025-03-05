import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/socket';
import Board from '../components/Board';
import Menu from '../components/Menu';
import Toolbox from '../components/Toolbox';
import WordSelection from '../components/WordSelection';
import GameTimer from '../components/GameTimer';
import styles from './room.module.css';

const Room = () => {
  const router = useRouter();
  const { room } = router.query;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [players, setPlayers] = useState([]);
  const messagesEndRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const roomJoined = useRef(false);
  const [mounted, setMounted] = useState(false);
  
  // Game state
  const [gameState, setGameState] = useState('lobby');
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [wordOptions, setWordOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [wordLength, setWordLength] = useState(0);
  const [wordHint, setWordHint] = useState('');
  const [canDraw, setCanDraw] = useState(false);
  
  useEffect(() => {
    setIsConnected(socket.connected);
    setMounted(true);
  }, []);
  
  const userName = useRef('Guest');
  useEffect(() => {
    userName.current = localStorage.getItem('userName') || router.query.name || 'Guest';
  }, [router.query.name]);

  useEffect(() => {
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      if (room && userName.current && roomJoined.current) {
        console.log('Rejoining room after reconnect');
        socket.emit('joinRoom', { room, name: userName.current });
      }
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [room]);

  useEffect(() => {
    if (!room || !isConnected || !mounted) return;
    
    console.log(`Joining room ${room} as ${userName.current}`);
    socket.emit('joinRoom', { room, name: userName.current });
    roomJoined.current = true;

    return () => {
      roomJoined.current = false;
    };
  }, [room, isConnected, mounted]);

  useEffect(() => {
    if (!room) return;

    const handleReceiveMessage = (message) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      setMessages((prev) => [...prev, data.message]);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      setMessages((prev) => [...prev, data.message]);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleRoomHistory = (data) => {
      console.log('Room history received:', data);
      if (data.chat) {
        setMessages(data.chat);
      }
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleError = (message) => {
      console.error('Socket error:', message);
      setMessages((prev) => [...prev, message]);
    };

    // Game-related event handlers
    const handleGameStarted = (data) => {
      console.log('Game started:', data);
      setGameState('word_selection');
      setPlayers(data.players);
      setCurrentDrawer(data.currentDrawer);
      
      const isDrawer = data.currentDrawer.id === socket.id;
      setCanDraw(isDrawer);
      
      setMessages(prev => [...prev, {
        text: 'Game started! Get ready to draw and guess!',
        time: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };
    
    const handleSelectWord = (data) => {
      console.log('Word selection:', data);
      setGameState('word_selection');
      setWordOptions(data.words);
      setTimeLeft(data.timeLeft);
    };
    
    const handleStartDrawing = (data) => {
      console.log('Start drawing:', data);
      setGameState('drawing');
      setCurrentWord(data.word);
      setCanDraw(true);
    };
    
    const handleDrawingStarted = (data) => {
      console.log('Drawing started:', data);
      setGameState('drawing');
      setCurrentDrawer(data.drawer);
      setWordLength(data.wordLength);
      setCanDraw(false);
      
      // Create initial word hint with underscores
      const initialHint = Array(data.wordLength).fill('_').join(' ');
      setWordHint(initialHint);
      
      // Clear current word for non-drawers
      setCurrentWord('');
      
      setMessages(prev => [...prev, {
        text: `${data.drawer} is drawing now!`,
        time: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };
    
    const handleTimerUpdate = (data) => {
      setTimeLeft(data.timeLeft);
    };
    
    const handleUpdateScores = (data) => {
      setPlayers(data.players);
    };
    
    const handleRoundEnded = (data) => {
      console.log('Round ended:', data);
      setGameState('round_end');
      setCanDraw(false);
      setTimeLeft(data.nextRoundIn);
    };
    
    const handleGameEnded = (data) => {
      console.log('Game ended:', data);
      setGameState('game_end');
      setPlayers(data.players);
      setCanDraw(false);
      
      setMessages(prev => [...prev, {
        text: `Game over! ${data.winner.name} wins with ${data.winner.score} points!`,
        time: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    };
    
    const handleReturnToLobby = (data) => {
      console.log('Return to lobby:', data);
      setGameState('lobby');
      setPlayers(data.players);
      setCurrentDrawer(null);
      setCurrentWord('');
      setWordOptions([]);
      setCanDraw(false);
    };

    // Add a new handler for word hint updates
    const handleWordHintUpdate = (data) => {
      console.log('Word hint update:', data);
      setWordHint(data.hint);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('roomHistory', handleRoomHistory);
    socket.on('error', handleError);
    
    // Game events
    socket.on('gameStarted', handleGameStarted);
    socket.on('selectWord', handleSelectWord);
    socket.on('startDrawing', handleStartDrawing);
    socket.on('drawingStarted', handleDrawingStarted);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('updateScores', handleUpdateScores);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('gameEnded', handleGameEnded);
    socket.on('returnToLobby', handleReturnToLobby);
    socket.on('wordHintUpdate', handleWordHintUpdate);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('roomHistory', handleRoomHistory);
      socket.off('error', handleError);
      
      // Game events
      socket.off('gameStarted', handleGameStarted);
      socket.off('selectWord', handleSelectWord);
      socket.off('startDrawing', handleStartDrawing);
      socket.off('drawingStarted', handleDrawingStarted);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('updateScores', handleUpdateScores);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('gameEnded', handleGameEnded);
      socket.off('returnToLobby', handleReturnToLobby);
      socket.off('wordHintUpdate', handleWordHintUpdate);
    };
  }, [room]);

  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim() || !room) return;

    const messageObj = {
      sender: userName.current,
      text: message,
      time: new Date().toLocaleTimeString()
    };

    socket.emit('sendMessage', { room, message: messageObj });
    setMessages((prev) => [...prev, messageObj]);
    setMessage('');
  }, [message, room]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }, [sendMessage]);

  const startGame = useCallback(() => {
    if (!room) return;
    socket.emit('startGame', { room });
  }, [room]);

  const selectWord = useCallback((word) => {
    if (!room) return;
    socket.emit('selectWord', { room, word });
  }, [room]);

  if (!isConnected) {
    return (
      <div className={styles.connectionError}>
        <h1>Connection Lost</h1>
        <p>Trying to reconnect to the server...</p>
      </div>
    );
  }

  return (
    <div className={styles.roomContainer}>
      <div className={styles.rankings}>
        <h2>Players</h2>
        <div className={styles.playersList}>
          {players.map((player, index) => (
            <div key={player.id} className={styles.playerItem}>
              <span className={styles.playerRank}>{index + 1}</span>
              <span className={styles.playerName}>
                {player.name} {player.id === socket.id ? '(You)' : ''}
                {currentDrawer && player.id === currentDrawer.id ? ' (Drawing)' : ''}
              </span>
              <span className={styles.playerScore}>{player.score}</span>
            </div>
          ))}
        </div>
        
        {gameState === 'lobby' && (
          <button 
            className={styles.startGameButton}
            onClick={startGame}
          >
            Start Game
          </button>
        )}
        
        {gameState !== 'lobby' && (
          <GameTimer timeLeft={timeLeft} gameState={gameState} />
        )}
        
        {gameState === 'drawing' && currentWord && (
          <div className={styles.currentWord}>
            <h3>Your Word:</h3>
            <p>{currentWord}</p>
          </div>
        )}
        
        {gameState === 'drawing' && !currentWord && (
          <div className={styles.wordHint}>
            <h3>Word Hint:</h3>
            <p>{wordHint}</p>
          </div>
        )}
      </div>
      
      <div className={styles.boardContainer}>
        {gameState === 'word_selection' && wordOptions.length > 0 && (
          <WordSelection words={wordOptions} onSelect={selectWord} timeLeft={timeLeft} />
        )}
        
        <Menu />
        <Board canDraw={canDraw} />
        <Toolbox />
      </div>
      
      <div className={styles.chatContainer}>
        <h2>Chat</h2>
        <div className={styles.messagesContainer}>
          {Array.isArray(messages) && messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.messageItem} ${msg?.sender === userName.current ? styles.ownMessage : ''} ${msg?.isSystem ? styles.systemMessage : ''}`}
              suppressHydrationWarning
            >
              {msg && msg.sender ? (
                <>
                  <span className={styles.messageSender} suppressHydrationWarning>
                    {msg.sender === userName.current ? 'You' : msg.sender}
                  </span>
                  <span className={styles.messageTime}>{msg.time}</span>
                  <p className={styles.messageText}>{msg.text}</p>
                </>
              ) : (
                <p className={styles.messageText}>{msg?.text || msg}</p>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.messageInput}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.roomInput}
            disabled={gameState === 'word_selection' && wordOptions.length > 0}
          />
          <button 
            className={styles.roomButton} 
            onClick={sendMessage}
            disabled={!message.trim() || (gameState === 'word_selection' && wordOptions.length > 0)}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;