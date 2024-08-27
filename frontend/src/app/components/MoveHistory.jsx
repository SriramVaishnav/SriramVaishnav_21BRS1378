// components/MoveHistory.js
import { useState, useEffect, useRef } from 'react';

export default function MoveHistory({ socket }) {
  const [moveHistory, setMoveHistory] = useState([]);
  const moveHistoryEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('history', (data) => {
        setMoveHistory((prevHistory) => [
          ...prevHistory,
          `Move: ${data.move}`,
        ]);
      });

      return () => {
        socket.off('history');
      };
    }
  }, [socket]);

  useEffect(() => {
    moveHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moveHistory]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-md shadow-md mt-4">
      <h3 className="text-xl font-semibold mb-2">Live Move History</h3>
      <div className="h-60 overflow-y-auto border border-gray-600 p-2 bg-gray-700 rounded-md">
        {moveHistory.map((move, index) => (
          <p key={index}>{move}</p>
        ))}
        <div ref={moveHistoryEndRef} />
      </div>
    </div>
  );
}
