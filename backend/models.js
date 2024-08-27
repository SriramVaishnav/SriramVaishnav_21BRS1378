const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: String,  // Ensure this matches the type used
    played: Number,
    won: Number
});

const roomSchema = new mongoose.Schema({
    id: String,
    grid: Array,
    players: Object,
    visitors: [String],
    chance: String,
    winner: String,
    ended: Number
});

const matchHistorySchema = new mongoose.Schema({
    id: String,
    moves: [String],
    grid: [Array],
    movesCount: Number,
    winner: String,
    ended: Number
});

const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const MatchHistory = mongoose.model('MatchHistory', matchHistorySchema);

async function initDb() {
    await mongoose.connect('mongodb://localhost:27017/your_db_name', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('MongoDB connected...');
}

async function createUser(userId) {
    if (typeof userId !== 'string') {
        throw new Error('User ID must be a string');
    }

    let user = await User.findOne({ id: userId });
    if (user) {
        return { error: "User Already Exists. Try Different Name" };
    }

    user = new User({ id: userId, played: 0, won: 0 });
    await user.save();
    return user;
}

async function loginUser(userId) {
    if (typeof userId !== 'string') {
        throw new Error('User ID must be a string');
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
        return { error: "The user name doesn't exist." };
    }
    return user;
}

async function createRoom(roomId) {
    if (typeof roomId !== 'string') {
        throw new Error('Room ID must be a string');
    }

    const grid = [
        ['0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0'],
        ['0', '0', '0', '0', '0']
    ];
    
    const roomData = {
        id: roomId,
        grid: grid,
        players: {},
        visitors: [],
        chance: "A",
        winner: "",
        ended: 0
    };

    const room = new Room(roomData);
    await room.save();

    const matchHistory = new MatchHistory({
        id: roomId,
        moves: [],
        grid: [],
        movesCount: 0,
        winner: "",
        ended: 0
    });

    await matchHistory.save();
}

async function restartGame(roomId) {
    const room = await Room.findOne({ id: roomId });
    if (room) {
        room.grid = [
            ['A-P1', 'A-P2', 'A-H1', 'A-H2', 'A-P3'],
            ['0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
            ['B-P1', 'B-P2', 'B-H1', 'B-H2', 'B-P3']
        ];
        room.winner = "";
        room.ended = 0;
        await room.save();
    }
}

async function joinRoom(data, socket, io) {
    const { room_id: roomId, user_id: userId } = data;
    const room = await Room.findOne({ id: roomId });
    const user = await User.findOne({ id: userId });

    if (!room || !user) {
        socket.emit('room_join', { message: 'Invalid Room Id or User Id' });
        return;
    }

    socket.join(roomId);

    const players = room.players;
    const visitors = room.visitors;

    if (players[userId]) {
        socket.emit('room_join', { room_id: roomId, role: 'player', player_no: players[userId] });
    } else if (visitors.includes(userId)) {
        socket.emit('room_join', { room_id: roomId, role: 'visitor' });
    } else {
        if (Object.keys(players).length < 2) {
            const playerRole = Object.keys(players).length === 0 ? "A" : "B";
            players[userId] = playerRole;
            room.players = players;
            user.played += 1;
            await room.save();
            await user.save();

            socket.emit('room_join', { room_id: roomId, role: 'player', player_no: playerRole });
        } else {
            room.visitors.push(userId);
            await room.save();
            socket.emit('room_join', { room_id: roomId, role: 'visitor' });
        }
    }

    io.to(roomId).emit('grid', { grid: room.grid });

    if (room.ended === 1) {
        socket.emit('message', { message: "Game has Ended" });
        io.to(roomId).emit('winner', { winner: room.winner });
    } else {
        io.to(roomId).emit('player_turn', { player_turn: room.chance });
    }
}

async function makeMove(data, socket, io) {
    const { room_id: roomId, user_id: userId, selected_piece, position_x: x, position_y: y, move } = data;

    const room = await Room.findOne({ id: roomId });
    const matchHistory = await MatchHistory.findOne({ id: roomId });

    if (!room || !matchHistory) {
        socket.emit('move', { message: "Invalid Room Id" });
        return;
    }

    if (!room.players[userId]) {
        socket.emit('move', { message: "Unauthorized Access" });
        return;
    }

    if (room.ended === 1) {
        io.to(roomId).emit('winner', { winner: room.winner });
        socket.emit('message', { message: "Game has Ended" });
        return;
    }

    if (room.players[userId] !== room.chance) {
        socket.emit('move', { message: "Wait for opponent to move" });
        return;
    }

    const player = selected_piece[0];
    const piece = selected_piece[2];
    const opponent = player === 'A' ? 'B' : 'A';

    const fromX = move.fromX;
    const fromY = move.fromY;
    const toX = move.toX;
    const toY = move.toY;

    let temp = room.grid[fromX][fromY];
    room.grid[fromX][fromY] = '0';
    room.grid[toX][toY] = temp;

    const matchMove = `${userId} moved ${piece} from (${fromX}, ${fromY}) to (${toX}, ${toY})`;
    matchHistory.moves.push(matchMove);
    matchHistory.grid.push(room.grid);
    matchHistory.movesCount += 1;

    room.chance = opponent;
    await room.save();
    await matchHistory.save();

    io.to(roomId).emit('grid', { grid: room.grid });
    io.to(roomId).emit('player_turn', { player_turn: room.chance });
    io.to(roomId).emit('move', { message: matchMove });
}

async function chat(data, socket, io) {
    const { room_id: roomId, user_id: userId, message } = data;
    const user = await User.findOne({ id: userId });
    if (user) {
        io.to(roomId).emit('chat', { user_id: userId, message: message });
    }
}

module.exports = { 
    initDb, createUser, loginUser, createRoom, restartGame, joinRoom, makeMove, chat 
};
