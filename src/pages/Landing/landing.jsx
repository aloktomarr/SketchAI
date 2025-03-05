import { useRouter } from 'next/router';
import styles from './landing.module.css';
import { io } from 'socket.io-client';

const Landing = () => {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/Lobby/lobby');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
  };

  return (
    <div className={styles.landingContainer}>
      <h1 className={styles.title}>Welcome to Scribble</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={handleCreateRoom}>
          Create a Room
        </button>
        <button className={styles.button} onClick={handleJoinRoom}>
          Join a Room
        </button>
      </div>
    </div>
  );
};

export default Landing; 