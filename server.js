const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('beginPath', (data) => {
    socket.broadcast.emit('beginPath', data);
  });

  socket.on('drawLine', (data) => {
    socket.broadcast.emit('drawLine', data);
  });

  socket.on('changeConfig', (data) => {
    socket.broadcast.emit('changeConfig', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});