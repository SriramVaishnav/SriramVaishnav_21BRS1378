'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameInitialized, setGameInitialized] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    socket.onmessage = (event) => {
      const { event: serverEvent, data } = JSON.parse(event.data);
      switch (serverEvent) {
        case 'startGame':
        case 'gameStateUpdate':
          setGameState(data);
          break;
        case 'invalidMove':
          alert(data);
          break;
        case 'gameOver':
          alert(data);
          break;
        case 'restart':
          setGameState(data);
          setSelectedCharacter(null);
          setGameInitialized(false);
          setPlayerId('');
          break;
      }
    };
    setSocket(socket);

    return () => socket.close();
  }, []);

  const handleInitGame = () => {
    const positions = [
      { name: 'P1', position: [0, 0] },
      { name: 'P2', position: [0, 1] },
      { name: 'H1', position: [0, 2] },
      { name: 'H2', position: [0, 3] },
      { name: 'P3', position: [0, 4] },
    ];

    socket.send(JSON.stringify({
      event: 'initGame',
      data: { playerId, positions },
    }));

    setGameInitialized(true); // Hide input field after game initialization
  };

  const handleMove = (move) => {
    socket.send(JSON.stringify({
      event: 'playerMove',
      data: { playerId, character: selectedCharacter, move },
    }));
  };

  const renderBoard = () => {
    return gameState?.board.map((row, i) => (
      <div key={i} className="flex">
        {row.map((cell, j) => (
          <div
            key={j}
            className="w-16 h-16 border flex items-center justify-center"
            onClick={() => setSelectedCharacter(cell ? cell.split('-')[1] : null)}
          >
            {cell}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-8">
      {!gameInitialized && (
        <div className="flex items-center justify-center">
          <input
            type="text"
            placeholder="Enter Player ID (A or B)"
            className="border p-2 mr-4 text-black"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2" onClick={handleInitGame}>
            Initialize Game.
          </button>
        </div>
      )}

      {gameState && (
        <div>
          <div className="flex flex-col">{renderBoard()}</div>
          <div className="mt-4">
            {['L', 'R', 'F', 'B', 'FL', 'FR', 'BL', 'BR'].map((move) => (
              <button
                key={move}
                className="bg-green-500 text-white px-4 py-2 m-2"
                onClick={() => handleMove(move)}
                disabled={!selectedCharacter}
              >
                {move}
              </button>
            ))}
          </div>
          <button
            className="bg-red-500 text-white px-4 py-2 mt-4"
            onClick={() => socket.send(JSON.stringify({ event: 'restartGame' }))}
          >
            Restart Game
          </button>
        </div>
      )}
    </div>
  );
}
