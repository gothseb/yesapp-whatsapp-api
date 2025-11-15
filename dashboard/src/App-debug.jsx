import { useState, useEffect } from 'react';
import SessionList from './components/SessionList';
import QRCodeDisplay from './components/QRCodeDisplay';
import SendMessage from './components/SendMessage';
import APIKeyInfo from './components/APIKeyInfo';
import GroupList from './components/GroupList';
import Login from './components/Login';
import api from './api/client';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [health, setHealth] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const authStatus = sessionStorage.getItem('dashboardAuth');
    console.log('🔐 Auth Status:', authStatus);
    setDebugInfo(`Auth status: ${authStatus}`);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    console.log('✅ Login successful');
    setIsAuthenticated(true);
    setDebugInfo('Login successful, loading dashboard...');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dashboardAuth');
    setIsAuthenticated(false);
  };

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // useEffect pour fetch health après authentification
  useEffect(() => {
    console.log('🏥 Fetching health check...');
    setDebugInfo('Fetching health...');
    
    const fetchHealth = async () => {
      try {
        console.log('📡 Calling API health endpoint...');
        const response = await api.getHealth();
        console.log('✅ Health response:', response.data);
        setHealth(response.data);
        setError(null);
        setDebugInfo('Connected to API');
      } catch (err) {
        console.error('❌ Health check error:', err);
        setError('Cannot connect to API');
        setDebugInfo(`Error: ${err.message}`);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  console.log('🎨 Rendering dashboard, health:', health, 'error:', error);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Debug Info Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-sm text-center">
        🐛 Debug Mode: {debugInfo}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">YesApp</h1>
                <p className="text-sm text-gray-500">WhatsApp API Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {health && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    {health.status === 'healthy' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Se déconnecter"
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <p className="mt-2 text-sm text-red-600">
              Backend: https://l8g04s04scsw0so8ss8ckcoc.sebapp-lab.com
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🎯 Dashboard Loaded Successfully!</h2>
          <div className="space-y-2 text-sm">
            <p>✅ Authentication: OK</p>
            <p>✅ React Rendering: OK</p>
            <p className={health ? 'text-green-600' : 'text-gray-400'}>
              {health ? '✅' : '⏳'} API Connection: {health ? 'OK' : 'Pending...'}
            </p>
          </div>
        </div>

        {!error && (
          <div className="space-y-6">
            <APIKeyInfo />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SessionList
                  onSessionSelect={setSelectedSessionId}
                  selectedSessionId={selectedSessionId}
                />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <QRCodeDisplay sessionId={selectedSessionId} />
                <SendMessage sessionId={selectedSessionId} />
              </div>
            </div>

            {selectedSessionId && (
              <GroupList sessionId={selectedSessionId} />
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>YesApp WhatsApp API v1.0.0 - Debug Mode</p>
      </footer>
    </div>
  );
}

export default App;
