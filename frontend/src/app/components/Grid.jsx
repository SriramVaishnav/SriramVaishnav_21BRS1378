// components/Grid.js
import { useState, useEffect } from 'react';

export default function Grid({ socket, currentRoomId }) {
  const [grid, setGrid] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.on('grid', (data) => {
        setGrid(data.grid);
        setSelectedPiece(null);
      });

      socket.on('move', (data) => {
        if (data.grid) {
          setGrid(data.grid);
        } else {
          alert(data.message);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('grid');
        socket.off('move');
      }
    };
  }, [socket]);

  const handleCellClick = (cell, rowIndex, cellIndex) => {
    if (cell && cell.startsWith('1')) { // Assuming player 1 is always the client
      setSelectedPiece({ piece: cell, x: rowIndex, y: cellIndex });
    }
  };

  const handleMove = (move) => {
    if (selectedPiece && currentRoomId) {
      socket.emit('make_move', {
        room_id: currentRoomId,
        selected_piece: selectedPiece.piece,
        position_x: selectedPiece.x,
        position_y: selectedPiece.y,
        move,
      });
      setSelectedPiece(null);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-1">
      {grid.map((row, rowIndex) =>
        row.map((cell, cellIndex) => (
          <div
            key={`${rowIndex}-${cellIndex}`}
            className={`w-16 h-16 border-2 flex items-center justify-center ${
              selectedPiece?.x === rowIndex && selectedPiece?.y === cellIndex
                ? 'bg-pink-400 text-white'
                : 'bg-white'
            }`}
            onClick={() => handleCellClick(cell, rowIndex, cellIndex)}
          >
            {cell}
          </div>
        ))
      )}
      {selectedPiece && (
        <div className="mt-4">
          <h3 className="text-center mb-2">Available Moves</h3>
          <div className="flex justify-center space-x-2">
            <button
              className="px-4 py-2 bg-pink-400 text-white rounded-md"
              onClick={() => handleMove('L')}
            >
              Left
            </button>
            <button
              className="px-4 py-2 bg-pink-400 text-white rounded-md"
              onClick={() => handleMove('R')}
            >
              Right
            </button>
            <button
              className="px-4 py-2 bg-pink-400 text-white rounded-md"
              onClick={() => handleMove('T')}
            >
              Top
            </button>
            <button
              className="px-4 py-2 bg-pink-400 text-white rounded-md"
              onClick={() => handleMove('B')}
            >
              Bottom
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
