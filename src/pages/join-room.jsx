import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './join-room.module.css';

const JoinRoom = () => {
  const [roomUrl, setRoomUrl] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomUrl && name) {
      const roomId = roomUrl.split('/').pop();
      router.push(`/room/${roomId}?name=${name}`);
    }
  };

  return (
    <div className={styles.joinRoomContainer}>
      <h1>Join a Room</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />
      <input
        type="text"
        placeholder="Enter room URL"
        value={roomUrl}
        onChange={(e) => setRoomUrl(e.target.value)}
        className={styles.input}
      />
      <button onClick={handleJoinRoom} className={styles.button}>
        Join Room
      </button>
    </div>
  );
};

export default JoinRoom; 