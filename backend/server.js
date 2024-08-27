const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const { handleSockets } = require('./socket');
const { initDb } = require('./models');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
}));

initDb();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/ranking', async (req, res) => {
    const rankedList = await rankUsers();
    res.render('ranking', { rankedUsers: rankedList });
});

io.on('connection', (socket) => {
    handleSockets(socket, io);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
