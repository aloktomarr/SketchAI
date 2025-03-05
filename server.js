const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin for development
    methods: ["GET", "POST"]
  }
});

let rooms = {};

const GAME_STATES = {
  LOBBY: 'lobby',
  WORD_SELECTION: 'word_selection',
  DRAWING: 'drawing',
  ROUND_END: 'round_end',
  GAME_END: 'game_end'
};

const ROUND_TIME = 80; // seconds
const WORD_SELECTION_TIME = 15; // seconds
const ROUND_END_TIME = 5; // seconds

// Word lists by difficulty
const WORDS = {
  easy: ['dog', 'cat', 'sun', 'cup', 'tree', 'book', 'door', 'car', 'fish', 'house', 'ball', 'apple'],
  medium: ['airplane', 'birthday', 'soccer', 'pizza', 'beach', 'computer', 'bicycle', 'mountain', 'television', 'rainbow'],
  hard: ['skyscraper', 'earthquake', 'astronaut', 'lighthouse', 'waterfall', 'dinosaur', 'volcano', 'orchestra', 'submarine']
};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('createRoom', ({ room, name }) => {
    console.log(`Creating room ${room} by ${name}`);
    if (!rooms[room]) {
      rooms[room] = {
        players: [{ id: socket.id, name, score: 0 }],
        chat: [],
        drawing: [],
        gameState: GAME_STATES.LOBBY,
        currentDrawer: null,
        currentWord: null,
        wordOptions: [],
        roundTimeLeft: 0,
        timer: null,
        correctGuessers: [],
        wordHint: null
      };
      socket.join(room);
      socket.emit('roomCreated', room);
      console.log(`Room ${room} created, players:`, rooms[room].players);
    } else {
      socket.emit('error', 'Room already exists');
    }
  });

  socket.on('joinRoom', ({ room, name }) => {
    console.log(`${name} is trying to join room ${room}`);
    if (rooms[room]) {
      // Check if player is already in the room (might be rejoining)
      const existingPlayerIndex = rooms[room].players.findIndex(p => p.id === socket.id);
      if (existingPlayerIndex >= 0) {
        rooms[room].players[existingPlayerIndex].name = name;
      } else {
        rooms[room].players.push({ id: socket.id, name, score: 0 });
      }
      
      socket.join(room);
      console.log(`${name} joined room ${room}, total players:`, rooms[room].players.length);
      
      // Notify everyone in the room about the new player
      io.to(room).emit('userJoined', {
        message: `${name} joined the room`,
        players: rooms[room].players
      });
      
      // Send room history to the new player
      console.log(`Sending room history to ${name}`);
      socket.emit('roomHistory', {
        chat: rooms[room].chat,
        drawing: rooms[room].drawing,
        players: rooms[room].players
      });
    } else {
      console.log(`Failed to join room ${room} - does not exist`);
      socket.emit('error', 'Room does not exist');
    }
  });

  socket.on('beginPath', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('beginPath: Invalid room', data.room);
      return;
    }
    
    console.log(`beginPath in room ${data.room}`);
    rooms[data.room].drawing.push({
      type: 'beginPath',
      x: data.x,
      y: data.y,
      color: data.color,
      size: data.size
    });
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('beginPath', data);
  });

  socket.on('drawLine', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('drawLine: Invalid room', data.room);
      return;
    }
    
    rooms[data.room].drawing.push({
      type: 'drawLine',
      x: data.x,
      y: data.y
    });
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('drawLine', data);
  });

  socket.on('changeConfig', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('changeConfig: Invalid room', data.room);
      return;
    }
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('changeConfig', data);
  });

  socket.on('clearCanvas', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('clearCanvas: Invalid room', data.room);
      return;
    }
    
    // Clear the drawing history for this room
    rooms[data.room].drawing = [];
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('clearCanvas');
  });

  socket.on('sendMessage', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('sendMessage: Invalid room', data.room);
      return;
    }
    
    console.log(`Message in room ${data.room}:`, data.message.text);
    
    // Check if this is a correct guess during the drawing phase
    if (rooms[data.room].gameState === GAME_STATES.DRAWING && 
        data.message.text.toLowerCase() === rooms[data.room].currentWord.toLowerCase() &&
        socket.id !== rooms[data.room].currentDrawer.id) {
      
      // Check if player already guessed correctly
      if (!rooms[data.room].correctGuessers.includes(socket.id)) {
        // Calculate score based on time left and number of previous correct guessers
        const baseScore = Math.ceil(rooms[data.room].roundTimeLeft / 2);
        const position = rooms[data.room].correctGuessers.length;
        const score = baseScore + (position === 0 ? 50 : 30 - position * 5);
        
        // Add player to correct guessers
        rooms[data.room].correctGuessers.push(socket.id);
        
        // Update player's score
        const playerIndex = rooms[data.room].players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          rooms[data.room].players[playerIndex].score += score;
        }
        
        // Send a special message to everyone
        const correctGuessMessage = {
          text: `${data.message.sender} guessed the word correctly! (+${score} points)`,
          time: new Date().toLocaleTimeString(),
          isSystem: true
        };
        
        rooms[data.room].chat.push(correctGuessMessage);
        io.to(data.room).emit('receiveMessage', correctGuessMessage);
        
        // Update scores for everyone
        io.to(data.room).emit('updateScores', {
          players: rooms[data.room].players
        });
        
        // If everyone has guessed correctly, end the round early
        const nonDrawingPlayers = rooms[data.room].players.filter(p => p.id !== rooms[data.room].currentDrawer.id);
        if (rooms[data.room].correctGuessers.length >= nonDrawingPlayers.length) {
          endRound(data.room);
        }
        
        // Don't broadcast the exact guess to others
        return;
      }
    }
    
    // Store the message in room history
    rooms[data.room].chat.push(data.message);
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('receiveMessage', data.message);
  });

  socket.on('actionMenuEvent', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('actionMenuEvent: Invalid room', data.room);
      return;
    }
    
    console.log(`Menu action '${data.action}' in room ${data.room}`);
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('actionMenuEvent', data);
  });

  socket.on('menuItemChange', (data) => {
    if (!data.room || !rooms[data.room]) {
      console.log('menuItemChange: Invalid room', data.room);
      return;
    }
    
    console.log(`Menu item change in room ${data.room}: ${data.menuItem}`);
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('menuItemChange', data);
  });

  socket.on('startGame', ({ room }) => {
    if (!rooms[room]) return;
    
    console.log(`Starting game in room ${room}`);
    
    // Shuffle players to determine drawing order
    rooms[room].players = shuffleArray(rooms[room].players);
    
    // Start first round
    startNewRound(room);
    
    // Notify all players that the game has started
    io.to(room).emit('gameStarted', {
      players: rooms[room].players,
      currentDrawer: rooms[room].currentDrawer
    });
  });

  socket.on('selectWord', ({ room, word }) => {
    if (!rooms[room] || rooms[room].gameState !== GAME_STATES.WORD_SELECTION) return;
    if (socket.id !== rooms[room].currentDrawer.id) return;
    
    console.log(`Word selected in room ${room}: ${word}`);
    
    // Set the current word and change game state
    rooms[room].currentWord = word;
    rooms[room].gameState = GAME_STATES.DRAWING;
    rooms[room].roundTimeLeft = ROUND_TIME;
    rooms[room].correctGuessers = [];
    
    // Clear the canvas for everyone
    io.to(room).emit('clearCanvas');
    rooms[room].drawing = [];
    
    // Notify drawer that they can start drawing
    socket.emit('startDrawing', { word });
    
    // Notify other players that drawing has started (without revealing the word)
    socket.to(room).emit('drawingStarted', {
      drawer: rooms[room].currentDrawer.name,
      wordLength: word.length
    });
    
    // Start the round timer
    startRoundTimer(room);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(player => player.id === socket.id);
      
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        
        // Notify others that this player left
        socket.to(roomId).emit('userLeft', {
          message: `${playerName} left the room`,
          players: room.players
        });
        
        console.log(`${playerName} left room ${roomId}, remaining players:`, room.players.length);
        
        // Clean up empty rooms
        if (room.players.length === 0) {
          console.log(`Deleting empty room ${roomId}`);
          delete rooms[roomId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Server is running fine');
});

// Helper functions
function startNewRound(room) {
  if (!rooms[room]) return;
  
  // Clear any existing timers
  if (rooms[room].timer) {
    clearInterval(rooms[room].timer);
  }
  
  // Clear the canvas
  rooms[room].drawing = [];
  
  // Select the next drawer
  let nextDrawerIndex = 0;
  if (rooms[room].currentDrawer) {
    const currentIndex = rooms[room].players.findIndex(p => p.id === rooms[room].currentDrawer.id);
    nextDrawerIndex = (currentIndex + 1) % rooms[room].players.length;
  }
  
  rooms[room].currentDrawer = rooms[room].players[nextDrawerIndex];
  rooms[room].gameState = GAME_STATES.WORD_SELECTION;
  
  // Generate 3 random words for selection
  rooms[room].wordOptions = generateWordOptions();
  
  // Send word options to the drawer
  const drawerSocket = io.sockets.sockets.get(rooms[room].currentDrawer.id);
  if (drawerSocket) {
    drawerSocket.emit('selectWord', {
      words: rooms[room].wordOptions,
      timeLeft: WORD_SELECTION_TIME
    });
  }
  
  // Notify other players that word selection is happening
  io.to(room).emit('wordSelectionStarted', {
    drawer: rooms[room].currentDrawer.name,
    timeLeft: WORD_SELECTION_TIME
  });
  
  // Start word selection timer
  rooms[room].roundTimeLeft = WORD_SELECTION_TIME;
  startWordSelectionTimer(room);
  
  // Reset the word hint
  rooms[room].wordHint = null;
}

function startWordSelectionTimer(room) {
  if (!rooms[room]) return;
  
  rooms[room].timer = setInterval(() => {
    rooms[room].roundTimeLeft -= 1;
    
    if (rooms[room].roundTimeLeft <= 0) {
      clearInterval(rooms[room].timer);
      
      // If no word was selected, choose one randomly
      if (rooms[room].gameState === GAME_STATES.WORD_SELECTION) {
        const randomIndex = Math.floor(Math.random() * rooms[room].wordOptions.length);
        rooms[room].currentWord = rooms[room].wordOptions[randomIndex];
        rooms[room].gameState = GAME_STATES.DRAWING;
        rooms[room].roundTimeLeft = ROUND_TIME;
        rooms[room].correctGuessers = [];
        
        // Notify drawer of the selected word
        const drawerSocket = io.sockets.sockets.get(rooms[room].currentDrawer.id);
        if (drawerSocket) {
          drawerSocket.emit('startDrawing', { 
            word: rooms[room].currentWord 
          });
        }
        
        // Notify other players that drawing has started
        io.to(room).emit('drawingStarted', {
          drawer: rooms[room].currentDrawer.name,
          wordLength: rooms[room].currentWord.length
        });
        
        // Start the round timer
        startRoundTimer(room);
      }
    } else {
      // Update time for everyone
      io.to(room).emit('timerUpdate', {
        timeLeft: rooms[room].roundTimeLeft,
        state: rooms[room].gameState
      });
    }
  }, 1000);
}

function startRoundTimer(room) {
  if (!rooms[room]) return;
  
  // Clear any existing timer
  if (rooms[room].timer) {
    clearInterval(rooms[room].timer);
  }
  
  // Set up a new timer that ticks every second
  rooms[room].timer = setInterval(() => {
    // Decrement the time left
    rooms[room].roundTimeLeft -= 1;
    
    // Broadcast the updated time to all clients
    io.to(room).emit('timerUpdate', {
      timeLeft: rooms[room].roundTimeLeft
    });
    
    // During drawing phase, provide hints at certain intervals
    if (rooms[room].gameState === GAME_STATES.DRAWING) {
      const totalTime = ROUND_TIME;
      const elapsedTime = totalTime - rooms[room].roundTimeLeft;
      const word = rooms[room].currentWord;
      
      // Reveal more letters as time passes
      if (word && word.length > 3) {
        // At 1/3 of the time, reveal one letter
        if (elapsedTime === Math.floor(totalTime / 3)) {
          revealLetterHint(room, 1);
        }
        // At 2/3 of the time, reveal another letter
        else if (elapsedTime === Math.floor(totalTime * 2 / 3)) {
          revealLetterHint(room, 2);
        }
      }
    }
    
    // Check if time has run out
    if (rooms[room].roundTimeLeft <= 0) {
      // Stop the timer
      clearInterval(rooms[room].timer);
      
      // Handle the end of the current phase
      if (rooms[room].gameState === GAME_STATES.WORD_SELECTION) {
        // If time runs out during word selection, pick a random word
        const randomWord = rooms[room].wordOptions[Math.floor(Math.random() * rooms[room].wordOptions.length)];
        rooms[room].currentWord = randomWord;
        rooms[room].gameState = GAME_STATES.DRAWING;
        rooms[room].roundTimeLeft = ROUND_TIME;
        
        // Notify the drawer
        const drawerSocket = io.sockets.sockets.get(rooms[room].currentDrawer.id);
        if (drawerSocket) {
          drawerSocket.emit('startDrawing', { word: randomWord });
        }
        
        // Notify other players
        drawerSocket.to(room).emit('drawingStarted', {
          drawer: rooms[room].currentDrawer.name,
          wordLength: randomWord.length
        });
        
        // Start the drawing timer
        startRoundTimer(room);
      } else if (rooms[room].gameState === GAME_STATES.DRAWING) {
        // End the round if drawing time is up
        endRound(room);
      } else if (rooms[room].gameState === GAME_STATES.ROUND_END) {
        // Start the next round after the round end timer
        const currentDrawerIndex = rooms[room].players.findIndex(p => p.id === rooms[room].currentDrawer.id);
        const isLastDrawer = currentDrawerIndex === rooms[room].players.length - 1;
        
        if (isLastDrawer) {
          // End the game if all players have had a turn
          endGame(room);
        } else {
          // Start the next round
          startNewRound(room);
        }
      }
    }
  }, 1000);
}

function endRound(room) {
  if (!rooms[room]) return;
  
  // Clear any existing timer
  if (rooms[room].timer) {
    clearInterval(rooms[room].timer);
  }
  
  rooms[room].gameState = GAME_STATES.ROUND_END;
  rooms[room].roundTimeLeft = ROUND_END_TIME;
  
  // Award points to the drawer based on how many people guessed correctly
  if (rooms[room].correctGuessers.length > 0) {
    const drawerIndex = rooms[room].players.findIndex(p => p.id === rooms[room].currentDrawer.id);
    if (drawerIndex !== -1) {
      const drawerPoints = Math.min(rooms[room].correctGuessers.length * 20, 100);
      rooms[room].players[drawerIndex].score += drawerPoints;
      
      // Notify everyone about drawer points
      const drawerPointsMessage = {
        text: `${rooms[room].currentDrawer.name} earned ${drawerPoints} points for ${rooms[room].correctGuessers.length} correct guesses!`,
        time: new Date().toLocaleTimeString(),
        isSystem: true
      };
      
      rooms[room].chat.push(drawerPointsMessage);
      io.to(room).emit('receiveMessage', drawerPointsMessage);
    }
  }
  
  // Reveal the word to everyone
  const wordRevealMessage = {
    text: `The word was: ${rooms[room].currentWord}`,
    time: new Date().toLocaleTimeString(),
    isSystem: true
  };
  
  rooms[room].chat.push(wordRevealMessage);
  io.to(room).emit('receiveMessage', wordRevealMessage);
  
  // Update scores for everyone
  io.to(room).emit('updateScores', {
    players: rooms[room].players
  });
  
  // Notify everyone that the round has ended
  io.to(room).emit('roundEnded', {
    word: rooms[room].currentWord,
    correctGuessers: rooms[room].correctGuessers.length,
    nextRoundIn: ROUND_END_TIME
  });
  
  // Start the round end timer
  startRoundTimer(room);
}

function endGame(room) {
  if (!rooms[room]) return;
  
  rooms[room].gameState = GAME_STATES.GAME_END;
  
  // Sort players by score to determine winner
  const sortedPlayers = [...rooms[room].players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  
  // Notify everyone that the game has ended
  io.to(room).emit('gameEnded', {
    winner: winner,
    players: sortedPlayers
  });
  
  // Add game end message to chat
  const gameEndMessage = {
    text: `Game over! ${winner.name} wins with ${winner.score} points!`,
    time: new Date().toLocaleTimeString(),
    isSystem: true
  };
  
  rooms[room].chat.push(gameEndMessage);
  io.to(room).emit('receiveMessage', gameEndMessage);
  
  // Reset game state after a delay
  setTimeout(() => {
    if (rooms[room]) {
      rooms[room].gameState = GAME_STATES.LOBBY;
      rooms[room].currentDrawer = null;
      rooms[room].currentWord = null;
      rooms[room].wordOptions = [];
      
      // Reset scores
      rooms[room].players.forEach(player => {
        player.score = 0;
      });
      
      // Notify everyone that we're back in the lobby
      io.to(room).emit('returnToLobby', {
        players: rooms[room].players
      });
    }
  }, 10000); // 10 seconds after game end
}

function generateWordOptions() {
  const options = [];
  
  // Add one easy word
  options.push(WORDS.easy[Math.floor(Math.random() * WORDS.easy.length)]);
  
  // Add one medium word
  options.push(WORDS.medium[Math.floor(Math.random() * WORDS.medium.length)]);
  
  // Add one hard word
  options.push(WORDS.hard[Math.floor(Math.random() * WORDS.hard.length)]);
  
  return options;
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Add this function to reveal letters as hints
function revealLetterHint(room, numLetters) {
  if (!rooms[room] || !rooms[room].currentWord) return;
  
  const word = rooms[room].currentWord;
  
  // If we haven't created a hint array yet, create one with all underscores
  if (!rooms[room].wordHint) {
    rooms[room].wordHint = Array(word.length).fill('_');
  }
  
  // Find positions that haven't been revealed yet
  const hiddenPositions = [];
  for (let i = 0; i < word.length; i++) {
    if (rooms[room].wordHint[i] === '_') {
      hiddenPositions.push(i);
    }
  }
  
  // Shuffle the positions and pick the first numLetters
  const shuffled = shuffleArray(hiddenPositions);
  const positionsToReveal = shuffled.slice(0, numLetters);
  
  // Reveal these positions
  positionsToReveal.forEach(pos => {
    rooms[room].wordHint[pos] = word[pos];
  });
  
  // Create the hint string with spaces between characters
  const hintString = rooms[room].wordHint.join(' ');
  
  // Send the updated hint to all players except the drawer
  const drawerSocket = io.sockets.sockets.get(rooms[room].currentDrawer.id);
  if (drawerSocket) {
    drawerSocket.to(room).emit('wordHintUpdate', {
      hint: hintString
    });
  }
}

