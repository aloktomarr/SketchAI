import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { socket } from '@/socket';
import styles from './lobby.module.css';

const Lobby = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const router = useRouter();

  useEffect(() => {
    socket.on('roomCreated', (roomName) => {
      router.push(`/room/${roomName}`);
    });

    return () => {
      socket.off('roomCreated');
    };
  }, [router]);

  const createRoom = () => {
    if (name && room) {
      socket.emit('createRoom', { room, name });
    }
  };

  return (
    <div className={styles.lobbyContainer}>
      <h1>Enter your name</h1>
      <input className={styles.inputlobby} type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <h1>Create a Room</h1>
      <input className={styles.inputlobby} type="text" value={room} onChange={(e) => setRoom(e.target.value)} />
      <button className={styles.buttonlobby} onClick={createRoom}>Start Game - Make a Room</button>
    </div>
  );
};

export default Lobby;