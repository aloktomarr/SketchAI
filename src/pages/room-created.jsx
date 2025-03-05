import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './room-created.module.css';

const RoomCreated = () => {
  const router = useRouter();
  const { room } = router.query;
  const [roomLink, setRoomLink] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Only access window in useEffect (client-side only)
    if (room) {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : '';
      setRoomLink(`${baseUrl}/room/${room}`);
    }
  }, [room]);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && roomLink) {
      navigator.clipboard.writeText(roomLink);
      alert('Room link copied to clipboard!');
    }
  };

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Room Created!</h1>
      <p>Share this link with your friends:</p>
      <div className={styles.linkContainer}>
        <input
          type="text"
          value={roomLink}
          readOnly
          className={styles.linkInput}
        />
        <button onClick={copyToClipboard} className={styles.copyButton}>
          Copy
        </button>
      </div>
      <button
        onClick={() => router.push(`/room/${room}`)}
        className={styles.joinButton}
      >
        Join Room
      </button>
    </div>
  );
};

// This ensures the page is always server-rendered
export const getServerSideProps = async () => {
  return { props: {} };
};

export default RoomCreated; 