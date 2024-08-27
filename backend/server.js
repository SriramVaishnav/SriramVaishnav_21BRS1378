const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
  players: {},
  board: Array(5).fill().map(() => Array(5).fill(null)), // 5x5 grid
  currentPlayer: 'A',
};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { event, data } = JSON.parse(message);

    switch (event) {
      case 'initGame':
        handleInitGame(ws, data);
        break;
      case 'playerMove':
        handlePlayerMove(ws, data);
        break;
      case 'restartGame':
        handleRestartGame();
        break;
    }
  });
});

function handleInitGame(ws, { playerId, positions }) {
  if (!gameState.players[playerId]) {
    gameState.players[playerId] = positions;
    updateBoard(playerId, positions);
  }

  if (Object.keys(gameState.players).length === 2) {
    broadcast({ event: 'startGame', data: gameState });
  }
}

function handlePlayerMove(ws, { playerId, character, move }) {
  if (gameState.currentPlayer !== playerId) {
    ws.send(JSON.stringify({ event: 'invalidMove', data: 'Not your turn' }));
    return;
  }

  const position = findCharacterPosition(playerId, character);
  if (!position) {
    ws.send(JSON.stringify({ event: 'invalidMove', data: 'Character not found' }));
    return;
  }

  const newPosition = calculateNewPosition(position, move, character);
  if (!isValidMove(newPosition)) {
    ws.send(JSON.stringify({ event: 'invalidMove', data: 'Invalid move' }));
    return;
  }

  handleMove(playerId, character, position, newPosition);
  checkGameOver(ws);
}

function handleMove(playerId, character, oldPos, newPos) {
  const [oldX, oldY] = oldPos;
  const [newX, newY] = newPos;

  if (gameState.board[newX][newY]) {
    const opponentId = gameState.board[newX][newY].charAt(0);
    if (opponentId !== playerId) {
      gameState.players[opponentId] = gameState.players[opponentId].filter(
        (char) => char.position[0] !== newX || char.position[1] !== newY
      );
    }
  }

  gameState.board[oldX][oldY] = null;
  gameState.board[newX][newY] = `${playerId}-${character}`;
  gameState.players[playerId].find((char) => char.name === character).position = newPos;

  gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'A' : 'B';
  broadcast({ event: 'gameStateUpdate', data: gameState });
}

function updateBoard(playerId, positions) {
  positions.forEach(({ name, position }) => {
    const [x, y] = position;
    gameState.board[x][y] = `${playerId}-${name}`;
  });
}

function calculateNewPosition([x, y], move, character) {
  const moveMap = {
    L: [0, -1],
    R: [0, 1],
    F: [-1, 0],
    B: [1, 0],
    FL: [-1, -1],
    FR: [-1, 1],
    BL: [1, -1],
    BR: [1, 1],
  };
  
  let steps = 1;
  if (character === 'H1') steps = 2;
  else if (character === 'H2') steps = 2;

  return [x + moveMap[move][0] * steps, y + moveMap[move][1] * steps];
}

function isValidMove([x, y]) {
  return x >= 0 && x < 5 && y >= 0 && y < 5;
}

function findCharacterPosition(playerId, character) {
  const characterObj = gameState.players[playerId].find((char) => char.name === character);
  return characterObj ? characterObj.position : null;
}

function checkGameOver(ws) {
  if (!gameState.players['A'].length) {
    broadcast({ event: 'gameOver', data: 'Player B wins' });
  } else if (!gameState.players['B'].length) {
    broadcast({ event: 'gameOver', data: 'Player A wins' });
  }
}

function handleRestartGame() {
  gameState = {
    players: {},
    board: Array(5).fill().map(() => Array(5).fill(null)),
    currentPlayer: 'A',
  };
  broadcast({ event: 'restart', data: gameState });
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');
