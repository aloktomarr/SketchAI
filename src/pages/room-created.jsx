import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './room-created.module.css';

const RoomCreated = () => {
  const router = useRouter();
  const { roomId, room } = router.query; // Note: using roomId instead of room to match your URL
  const [roomLink, setRoomLink] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Check for both room and roomId parameters
    const roomIdentifier = roomId || room;
    if (roomIdentifier) {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : '';
      setRoomLink(`${baseUrl}/room/${roomIdentifier}`);
    }
  }, [roomId, room]);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && roomLink) {
      navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isMounted) {
    return (
      <div className={styles.container}>
        <h1>Loading...</h1>
      </div>
    );
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
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <button
        onClick={() => router.push(`/room/${roomId}`)}
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