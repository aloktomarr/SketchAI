import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { socket } from '@/socket';
import styles from './lobby.module.css';

const Lobby = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Listen for room creation success
    socket.on('roomCreated', (roomId) => {
      // Store user name in localStorage for later use
      localStorage.setItem('userName', name);
      router.push(`/room-created?roomId=${roomId}`);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('error');
    };
  }, [router, name]);

  const createRoom = () => {
    if (name && room) {
      socket.emit('createRoom', { room, name });
    } else {
      alert('Please enter both name and room');
    }
  };

  return (
    <div className={styles.lobbyContainer}>
      <h1>Enter your name</h1>
      <input 
        className={styles.inputlobby} 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Your name"
      />
      <h1>Create a Room</h1>
      <input 
        className={styles.inputlobby} 
        type="text" 
        value={room} 
        onChange={(e) => setRoom(e.target.value)} 
        placeholder="Room name"
      />
      <button className={styles.buttonlobby} onClick={createRoom}>
        Create Room
      </button>
    </div>
  );
};

export default Lobby;