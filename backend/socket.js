const { 
    createUser, loginUser, createRoom, restartGame, joinRoom, makeMove, chat 
} = require('./models');

function handleSockets(socket, io) {
    socket.on('create_user', async (userId) => {
        const user = await createUser(userId);
        if (user.error) {
            socket.emit('user_id', { message: user.error });
        } else {
            socket.emit('user_id', { id: user.id });
        }
    });

    socket.on('login_as_user', async (userId) => {
        const user = await loginUser(userId);
        if (user.error) {
            socket.emit('user_id', { message: user.error });
        } else {
            socket.emit('user_id', { id: user.id });
        }
    });

    socket.on('create_room', async (data) => {
        const roomId = data.room_id;
        await createRoom(roomId);
        socket.emit('room_created', { room_id: roomId });
    });

    socket.on('restart', async (data) => {
        const roomId = data.room_id;
        await restartGame(roomId);
        io.to(roomId).emit('restarted', { message: "Game Restarted" });
    });

    socket.on('join_room', async (data) => {
        await joinRoom(data, socket, io);
    });

    socket.on('make_move', async (data) => {
        await makeMove(data, socket, io);
    });

    socket.on('chat', async (data) => {
        await chat(data, socket, io);
    });
}

module.exports = { handleSockets };
