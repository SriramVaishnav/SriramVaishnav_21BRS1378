// websocket.js

const WebSocket = require('ws');
const Game = require('./game');

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });
    const game = new Game();

    wss.on('connection', (ws) => {
        console.log('New player connected');
        
        // Send initial game state to the new player
        ws.send(JSON.stringify({ type: 'init', state: game.getGameState() }));

        ws.on('message', (message) => {
            const { type, data } = JSON.parse(message);
            
            switch (type) {
                case 'move':
                    const { player, character, move } = data;
                    const success = game.makeMove(player, character, move);

                    if (success) {
                        // Broadcast updated game state to all players
                        broadcastGameState(wss, game.getGameState());
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
                    break;
            }
        });

        ws.on('close', () => {
            console.log('Player disconnected');
        });
    });

    function broadcastGameState(wss, state) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'stateUpdate', state }));
            }
        });
    }
}

module.exports = setupWebSocketServer;
