import React from 'react';

const GameControls = ({ gameState, onStartGame }) => {
  return (
    <div className="gameControls">
      {gameState === 'lobby' && (
        <button 
          className="startGameButton"
          onClick={onStartGame}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default GameControls; 