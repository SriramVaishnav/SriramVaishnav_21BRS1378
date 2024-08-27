"use client";

import { useEffect, useRef, useState } from 'react';

export default function Home() {
    const [board, setBoard] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [message, setMessage] = useState('');
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:3000');

        ws.current.onopen = () => console.log('Connected to the game server');

        ws.current.onmessage = (event) => {
            const { type, state, message: errorMessage, winner } = JSON.parse(event.data);

            if (type === 'init' || type === 'stateUpdate') {
                setBoard(state.board || []);
                setCurrentPlayer(state.currentPlayer || '');
                setMessage('');
            } else if (type === 'error') {
                setMessage(errorMessage || 'An error occurred');
            } else if (type === 'gameOver') {
                setMessage(`Game Over! Winner: Player ${winner}`);
            }
        };

        return () => {
            ws.current.close();
        };
    }, []);

    const sendMove = (character, move) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'move',
                data: { player: currentPlayer, character, move }
            }));
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <p className='text-red-600 text-7xl'>board length: {board}</p>
            <h1 className="text-4xl font-bold mb-8">Turn-based Chess-lie Game</h1>
            <div className="grid grid-cols-5 gap-2 mb-6">
                {board.length > 0 ? (
                    board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="w-16 h-16 bg-white border border-gray-400 flex items-center justify-center"
                            >
                                {cell || '-'}
                            </div>
                        ))
                    )
                ) : (
                    <div className="col-span-5 text-center text-gray-500">Loading...</div>
                )}
            </div>
            <div className="text-lg font-semibold mb-4">Current Player: {currentPlayer}</div>
            <div className="text-red-500 mb-4">{message}</div>
            <div className="flex space-x-4">
                {/* Example buttons for sending moves */}
                <button
                    onClick={() => sendMove('P1', 'L')}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Move P1 Left
                </button>
                <button
                    onClick={() => sendMove('H1', 'F')}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Move H1 Forward
                </button>
            </div>
        </div>
    );
}
