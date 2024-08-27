const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const { handleSockets } = require('./socket');
const { initDb } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

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
