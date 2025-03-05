import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    if (room) {
      socket.emit('joinRoom', room);
      socket.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
      });
    }
  }, [room]);

  const sendMessage = () => {
    socket.emit('sendMessage', { room, message });
    setMessage('');
  };

  return (
    <div className={styles.roomContainer}>
      <div className={styles.rankings}>
        <h2>Rankings</h2>
        <ul>
          {rankings.map((player, index) => (
            <li key={index}>{player.name}: {player.score}</li>
          ))}
        </ul>
      </div>
      <div className={styles.chat}>
        <h2>Chat</h2>
        <div className={styles.messages}>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <input className={styles.roomInput} type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className={styles.roomButton} onClick={sendMessage}>Send</button>
      </div>
      <div className={styles.board}>
        <Menu />
        <Board />
        <Toolbox />
      </div>
    </div>
  );
};

export default Room;