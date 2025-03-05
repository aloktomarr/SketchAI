const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let rooms = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('createRoom', ({ room, name }) => {
    if (!rooms[room]) {
      rooms[room] = { players: [{ id: socket.id, name, score: 0 }], chat: [], drawing: [] };
      socket.join(room);
      socket.emit('roomCreated', room);
    }
  });

  socket.on('joinRoom', (room) => {
    if (rooms[room]) {
      rooms[room].players.push({ id: socket.id, name: 'Player', score: 0 });
      socket.join(room);
      socket.emit('roomJoined', room);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  socket.on('beginPath', (data) => {
    socket.to(data.room).emit('beginPath', data);
  });

  socket.on('drawLine', (data) => {
    socket.to(data.room).emit('drawLine', data);
  });

  socket.on('changeConfig', (data) => {
    socket.to(data.room).emit('changeConfig', data);
  });

  socket.on('sendMessage', (data) => {
    if (rooms[data.room]) {
      rooms[data.room].chat.push(data.message);
      socket.to(data.room).emit('receiveMessage', data.message);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter(player => player.id !== socket.id);
      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});