import React from 'react';
import styles from './index.module.css';

const GameControls = ({ gameState, onStartGame }) => {
  return (
    <div className={styles.gameControls}>
      {gameState === 'lobby' && (
        <button 
          className={styles.startGameButton}
          onClick={onStartGame}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default GameControls; 