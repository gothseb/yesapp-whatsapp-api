import { useState, useEffect } from 'react';
import api from '../api/client';

function SessionList({ onSessionSelect, selectedSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await api.getSessions();
      setSessions(response.data.sessions);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    setCreating(true);
    try {
      await api.createSession(newSessionName);
      setNewSessionName('');
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (id) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await api.deleteSession(id);
      fetchSessions();
      if (selectedSessionId === id) {
        onSessionSelect(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete session');
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-whatsapp-green rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Session Form */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Create New Session</h3>
        <form onSubmit={handleCreateSession} className="flex gap-2">
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Session name (e.g., My WhatsApp)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newSessionName.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* Sessions List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">
          Sessions ({sessions.length})
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No sessions yet. Create one to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSessionId === session.id
                    ? 'border-whatsapp-green bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{session.name}</h4>
                      {session.status === 'connected' && (
                        <span className="badge badge-green">Connected</span>
                      )}
                      {session.status === 'pending' && (
                        <span className="badge badge-yellow">Pending</span>
                      )}
                      {session.status === 'disconnected' && (
                        <span className="badge badge-red">Disconnected</span>
                      )}
                    </div>
                    {session.phone_number && (
                      <p className="text-sm text-gray-600 mt-1">{session.phone_number}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="ml-2 text-red-600 hover:text-red-800 p-2"
                    title="Delete session"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionList;
