'use client';

import { useState, useEffect } from 'react';
import Grid from './components/Grid';
import Chat from './components/Chat';
import MoveHistory from './components/MoveHistory';
import io from 'socket.io-client';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [userCreated, setUserCreated] = useState(false);
  const [gameScreen, setGameScreen] = useState(false);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('user_id', (data) => {
      if (data.id) {
        setUserCreated(true);
        setGameScreen(true);
      } else {
        alert(data.message);
      }
    });

    socketInstance.on('room_created', (data) => {
      alert(`Room ${data.room_id} created!`);
      setPlayerNumber(data.player_no);
    });

    socketInstance.on('room_join', (data) => {
      if (data.room_id) {
        alert(`Joined room ${data.room_id} as ${data.role}`);
        setCurrentRoomId(data.room_id);
        setPlayerNumber(data.player_no);
      } else {
        alert(data.message);
      }
    });

    return () => socketInstance.disconnect();
  }, []);

  const handleCreateUser = () => {
    if (userId) {
      socket.emit('create_user', { user_id: userId });
    }
  };

  const handleLoginUser = () => {
    if (userId) {
      socket.emit('login_as_user', { user_id: userId });
    }
  };

  const handleCreateRoom = () => {
    const roomId = prompt('Enter new ID for your game:');
    if (roomId) {
      socket.emit('create_room', { room_id: roomId });
    }
  };

  const handleJoinRoom = () => {
    const roomId = prompt('Enter Game ID:');
    if (roomId) {
      setCurrentRoomId(roomId);
      socket.emit('join_room', { room_id: roomId, user_id: userId });
    }
  };

  return (
    <div className="bg-yellow-100 min-h-screen flex flex-col items-center justify-center">
      {!userCreated ? (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            className="p-2 border-2 border-gray-300 rounded-md"
            placeholder="Enter User Name"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-pink-400 text-white rounded-md"
            onClick={handleCreateUser}
          >
            Create User
          </button>
          <button
            className="px-4 py-2 bg-pink-400 text-white rounded-md"
            onClick={handleLoginUser}
          >
            Login
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto">
          {!gameScreen ? (
            <div className="flex flex-col items-center space-y-4">
              <button
                className="px-4 py-2 bg-pink-400 text-white rounded-md"
                onClick={handleCreateRoom}
              >
                Create New Game
              </button>
              <button
                className="px-4 py-2 bg-pink-400 text-white rounded-md"
                onClick={handleJoinRoom}
              >
                Join Using Id
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-center text-2xl font-bold mb-4">
                Player {playerNumber}'s Turn
              </h2>
              <Grid socket={socket} currentRoomId={currentRoomId} />
              <Chat socket={socket} currentRoomId={currentRoomId} />
              <MoveHistory socket={socket} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
