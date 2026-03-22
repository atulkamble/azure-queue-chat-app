import { useEffect, useState } from 'react';
import './Admin.css';

interface Message {
  id: string;
  userId: string;
  roomId: string;
  message: string;
  timestamp: number;
}

interface Stats {
  totalMessages: number;
  queueMessages: number;
  uniqueUsers: number;
  uniqueRooms: number;
  messagesByRoom: Record<string, number>;
  messagesByUser: Record<string, number>;
}

function Admin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'messages' | 'stats'>('messages');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterRoomId) params.append('roomId', filterRoomId);
      params.append('limit', '1000');

      const response = await fetch(`http://localhost:3000/api/admin/messages?${params}`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await fetch(`http://localhost:3000/api/admin/messages/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const deleteAllMessages = async () => {
    const confirmText = filterUserId || filterRoomId 
      ? 'Delete all filtered messages?' 
      : 'Delete ALL messages? This cannot be undone!';
    
    if (!confirm(confirmText)) return;

    try {
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterRoomId) params.append('roomId', filterRoomId);

      await fetch(`http://localhost:3000/api/admin/messages?${params}`, {
        method: 'DELETE',
      });
      fetchMessages();
      alert('Messages deleted successfully');
    } catch (error) {
      console.error('Failed to delete messages:', error);
      alert('Failed to delete messages');
    }
  };

  const clearQueue = async () => {
    if (!confirm('Clear all messages from queue?')) return;

    try {
      const response = await fetch('http://localhost:3000/api/admin/queue/clear', {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Cleared ${data.cleared} messages from queue`);
      fetchStats();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      alert('Failed to clear queue');
    }
  };

  const processQueue = async () => {
    try {
      await fetch('http://localhost:3000/api/queue/process', {
        method: 'POST',
      });
      alert('Queue processed successfully');
      fetchMessages();
      fetchStats();
    } catch (error) {
      console.error('Failed to process queue:', error);
      alert('Failed to process queue');
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [filterUserId, filterRoomId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🛠️ Admin Panel</h1>
        <div className="view-toggle">
          <button
            className={view === 'messages' ? 'active' : ''}
            onClick={() => setView('messages')}
          >
            Messages
          </button>
          <button
            className={view === 'stats' ? 'active' : ''}
            onClick={() => setView('stats')}
          >
            Statistics
          </button>
        </div>
      </header>

      {view === 'messages' ? (
        <div className="messages-view">
          <div className="filters">
            <input
              type="text"
              placeholder="Filter by User ID"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by Room ID"
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
            />
            <button onClick={fetchMessages} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={deleteAllMessages} className="danger">
              Delete Filtered
            </button>
            <button onClick={processQueue} className="primary">
              Process Queue
            </button>
          </div>

          <div className="message-count">
            <strong>{messages.length}</strong> messages found
          </div>

          <div className="messages-table-container">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Room</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="timestamp">{formatDate(msg.timestamp)}</td>
                    <td className="user">{msg.userId}</td>
                    <td className="room">{msg.roomId}</td>
                    <td className="message-text">{msg.message}</td>
                    <td className="actions">
                      <button
                        onClick={() => deleteMessage(msg.id, msg.userId)}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="stats-view">
          {stats && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Messages</h3>
                  <div className="stat-value">{stats.totalMessages}</div>
                </div>
                <div className="stat-card">
                  <h3>Queue Messages</h3>
                  <div className="stat-value">{stats.queueMessages}</div>
                  <button onClick={clearQueue} className="danger small">
                    Clear Queue
                  </button>
                </div>
                <div className="stat-card">
                  <h3>Unique Users</h3>
                  <div className="stat-value">{stats.uniqueUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Unique Rooms</h3>
                  <div className="stat-value">{stats.uniqueRooms}</div>
                </div>
              </div>

              <div className="breakdown">
                <div className="breakdown-section">
                  <h3>Messages by Room</h3>
                  <table>
                    <tbody>
                      {Object.entries(stats.messagesByRoom).map(([room, count]) => (
                        <tr key={room}>
                          <td>{room}</td>
                          <td className="count">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="breakdown-section">
                  <h3>Messages by User</h3>
                  <table>
                    <tbody>
                      {Object.entries(stats.messagesByUser).map(([user, count]) => (
                        <tr key={user}>
                          <td>{user}</td>
                          <td className="count">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="refresh-stats">
                <button onClick={fetchStats} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh Statistics'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
