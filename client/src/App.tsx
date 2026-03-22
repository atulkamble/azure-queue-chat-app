import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Message {
  id: string;
  userId: string;
  roomId: string;
  message: string;
  timestamp: number;
}

const API_BASE_URL = '/api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState('user1');
  const [roomId, setRoomId] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages on component mount and when room/user changes
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [userId, roomId]);

  // Fetch queue status periodically
  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${userId}/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse()); // Display oldest first
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/queue/status`);
      if (response.ok) {
        const data = await response.json();
        setQueueCount(data.messageCount);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          roomId,
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>☁️ Azure Queue Chat</h1>
        <div className="status">
          <span className="status-indicator"></span>
          Queue: {queueCount} messages
        </div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>User:</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="user1">User 1</option>
            <option value="user2">User 2</option>
            <option value="user3">User 3</option>
          </select>
        </div>
        <div className="control-group">
          <label>Room:</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="general">General</option>
            <option value="tech">Tech Talk</option>
            <option value="random">Random</option>
          </select>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.userId === userId ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="message-user">{msg.userId}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="send-button" disabled={loading || !newMessage.trim()}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;
