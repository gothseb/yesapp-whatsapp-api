import { useState, useEffect } from 'react';
import api from '../api/client';

function GroupList({ sessionId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setGroups([]);
      return;
    }
    fetchGroups();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchGroups, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchGroups = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await api.getGroups(sessionId);
      if (response.data.success) {
        setGroups(response.data.groups || []);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to load groups';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`✓ ${label} copié!`);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!sessionId) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">Select a session to view groups</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📱 WhatsApp Groups</h3>
        <button
          onClick={fetchGroups}
          disabled={loading}
          className="px-3 py-1 bg-whatsapp-green text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Search Bar */}
      {groups.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading && groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          <p className="mt-2 text-gray-600">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No groups found</p>
          <p className="text-sm text-gray-400 mt-1">Make sure your session is connected</p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-600">
            Found <strong>{filteredGroups.length}</strong> group{filteredGroups.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-whatsapp-green transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        👥 {group.participants} member{group.participants !== 1 ? 's' : ''}
                      </span>
                      {group.isAdmin && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          👑 Admin
                        </span>
                      )}
                      {group.unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                          {group.unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group ID - Copiable */}
                <div className="mt-2">
                  <label className="text-xs text-gray-500 font-medium">Group ID (pour n8n)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={group.id}
                      readOnly
                      className="flex-1 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-mono"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => copyToClipboard(group.id, 'Group ID')}
                      className="px-2 py-1 bg-whatsapp-green text-white rounded hover:bg-green-700 text-xs font-medium whitespace-nowrap"
                      title="Copier Group ID"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {/* Quick n8n Example */}
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    📝 n8n Example
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <pre className="text-gray-700 whitespace-pre-wrap break-all">
{`{
  "to": "${group.id}",
  "text": "Message to ${group.name}"
}`}
                    </pre>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default GroupList;
