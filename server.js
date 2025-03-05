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

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('createRoom', ({ room, name }) => {
    console.log(`Creating room ${room} by ${name}`);
    if (!rooms[room]) {
      rooms[room] = {
        players: [{ id: socket.id, name, score: 0 }],
        chat: [],
        drawing: []
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
    rooms[data.room].chat.push(data.message);
    
    // Broadcast to all OTHER clients in the room
    socket.to(data.room).emit('receiveMessage', data.message);
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

