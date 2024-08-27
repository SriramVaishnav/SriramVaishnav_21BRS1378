// components/Chat.js
import { useState, useEffect, useRef } from 'react';

export default function Chat({ socket, currentRoomId }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('chat', (data) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          `${data.player}: ${data.chat}`,
        ]);
      });

      return () => {
        socket.off('chat');
      };
    }
  }, [socket]);

  const handleSend = () => {
    if (message && currentRoomId) {
      socket.emit('chat', { room_id: currentRoomId, chat_message: message });
      setMessage('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-md shadow-md">
      <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
      <div className="h-60 overflow-y-auto mb-2 border border-gray-600 p-2 bg-gray-700 rounded-md">
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          className="flex-grow p-2 border border-gray-600 rounded-l-md"
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-pink-400 text-white rounded-r-md"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
