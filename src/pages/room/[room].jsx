import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/socket';
import Board from '../components/Board';
import Menu from '../components/Menu';
import Toolbox from '../components/Toolbox';
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
      setMessages((prevMessages) => [...prevMessages, data.message]);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      setMessages((prevMessages) => [...prevMessages, data.message]);
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
      alert(`Error: ${message}`);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('roomHistory', handleRoomHistory);
    socket.on('error', handleError);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('roomHistory', handleRoomHistory);
      socket.off('error', handleError);
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!message.trim() || !room) return;
    
    console.log(`Sending message in room ${room}:`, message);
    const messageData = {
      text: message,
      sender: userName.current,
      time: new Date().toLocaleTimeString()
    };
    
    socket.emit('sendMessage', { room, message: messageData });
    setMessages((prevMessages) => [...prevMessages, messageData]);
    setMessage('');
  }, [message, room]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!mounted) {
    return <div suppressHydrationWarning>Loading...</div>;
  }

  if (!isConnected) {
    return (
      <div className={styles.connectionError}>
        <h1>Connecting to server...</h1>
        <p>Please wait while we establish connection.</p>
      </div>
    );
  }

  return (
    <div className={styles.roomContainer}>
      <div className={styles.rankings}>
        <h2>Players {players.length ? `(${players.length})` : ''}</h2>
        <ul className={styles.playersList}>
          {Array.isArray(players) && players.map((player, index) => (
            <li key={player.id || index} className={styles.playerItem}>
              <span className={styles.playerName} suppressHydrationWarning>
                {player.name}{player.id === socket.id ? ' (You)' : ''}
              </span>
              <span className={styles.playerScore}>{player.score}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className={styles.board}>
        <Menu />
        <Board />
        <Toolbox />
      </div>
      
      <div className={styles.chat}>
        <h2>Chat</h2>
        <div className={styles.messages}>
          {Array.isArray(messages) && messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.messageItem} ${msg?.sender === userName.current ? styles.ownMessage : ''}`}
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
                <p className={styles.systemMessage}>{msg}</p>
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
          />
          <button 
            className={styles.roomButton} 
            onClick={sendMessage}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;