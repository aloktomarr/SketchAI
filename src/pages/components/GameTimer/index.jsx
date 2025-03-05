import React from 'react';
import styles from './index.module.css';

const GameTimer = ({ timeLeft, gameState }) => {
  // Format the time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Determine the label based on game state
  let label = 'Time Left';
  if (gameState === 'word_selection') {
    label = 'Choose a Word';
  } else if (gameState === 'round_end') {
    label = 'Next Round In';
  } else if (gameState === 'game_end') {
    label = 'Game Ending';
  }
  
  // Determine color based on time left
  let timerClass = styles.timer;
  if (timeLeft <= 10) {
    timerClass = `${styles.timer} ${styles.urgent}`;
  } else if (timeLeft <= 30) {
    timerClass = `${styles.timer} ${styles.warning}`;
  }
  
  return (
    <div className={styles.timerContainer}>
      <div className={styles.timerLabel}>{label}</div>
      <div className={timerClass}>{formattedTime}</div>
    </div>
  );
};

export default GameTimer; 