import React from 'react';
import styles from './index.module.css';

const WordSelection = ({ words = [], onSelect, timeLeft }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.wordSelectionContainer}>
        <h2>Choose a Word to Draw</h2>
        <p className={styles.timeLeft}>Time left: {timeLeft} seconds</p>
        <div className={styles.wordsContainer}>
          {Array.isArray(words) && words.map((word, index) => {
            // Determine difficulty based on index (0=easy, 1=medium, 2=hard)
            const difficulty = index === 0 ? 'easy' : index === 1 ? 'medium' : 'hard';
            const difficultyClass = styles[difficulty];
            
            return (
              <button 
                key={word} 
                className={`${styles.wordButton} ${difficultyClass}`}
                onClick={() => onSelect(word)}
              >
                {word}
                <span className={styles.difficultyLabel}>{difficulty}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WordSelection; 