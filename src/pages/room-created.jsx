import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './room-created.module.css';

const RoomCreated = () => {
  const router = useRouter();
  const { roomId } = router.query;
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${roomId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enterRoom = () => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div className={styles.roomCreatedContainer}>
      <h1>Room Created Successfully!</h1>
      <div className={styles.urlContainer}>
        <p>Share this URL with your friends:</p>
        <div className={styles.urlBox}>
          <span>{roomUrl}</span>
          <button onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <button onClick={enterRoom} className={styles.enterButton}>
        Enter Room
      </button>
    </div>
  );
};

export default RoomCreated; 