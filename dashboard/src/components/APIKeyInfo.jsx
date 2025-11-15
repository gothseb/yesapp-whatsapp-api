import { useState } from 'react';
import { API_KEY } from '../api/client';

function APIKeyInfo() {
  const [showKey, setShowKey] = useState(false);

  const isKeyConfigured = API_KEY && API_KEY !== 'YOUR_API_KEY_HERE';

  if (!isKeyConfigured) {
    return (
      <div className="card bg-yellow-50 border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          ⚠️ API Key Non Configurée
        </h3>
        <p className="text-sm text-yellow-800 mb-3">
          Configurez votre API Key pour utiliser le dashboard.
        </p>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>1. Créez le fichier <code className="bg-yellow-100 px-1 rounded">dashboard/.env</code></p>
          <p>2. Ajoutez: <code className="bg-yellow-100 px-1 rounded">VITE_API_KEY=votre-clé</code></p>
          <p>3. Redémarrez le dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">🔑 API Configuration</h3>
      
      <div className="space-y-3">
        {/* API Key */}
        <div>
          <label className="text-xs text-gray-500 font-medium">API Key (pour n8n)</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={API_KEY}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              title={showKey ? 'Masquer' : 'Afficher'}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(API_KEY);
                alert('✓ API Key copiée!');
              }}
              className="px-3 py-2 bg-whatsapp-green text-white rounded hover:bg-green-700 text-sm font-medium"
              title="Copier API Key"
            >
              📋 Copier
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Utilisez cette clé dans le header <code className="bg-gray-100 px-1 rounded">X-API-Key</code>
          </p>
        </div>

        {/* API Base URL */}
        <div>
          <label className="text-xs text-gray-500 font-medium">API Base URL</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value="http://localhost:3000/api/v1"
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText('http://localhost:3000/api/v1');
                alert('✓ URL copiée!');
              }}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              title="Copier URL"
            >
              📋
            </button>
          </div>
        </div>

        {/* Quick n8n Setup */}
        <div className="mt-4 space-y-3">
          {/* Example 1: Text Message */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">🚀 Configuration n8n - Message Texte</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Method:</strong> POST</p>
              <p><strong>URL:</strong> http://localhost:3000/api/v1/sessions/SESSION_ID/messages</p>
              <p><strong>Header:</strong> X-API-Key: {API_KEY.substring(0, 20)}...</p>
              <p><strong>Body:</strong> {`{"to": "+33612345678", "text": "Hello!"}`}</p>
            </div>
          </div>

          {/* Example 2: Image Message */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">📸 Configuration n8n - Envoi Image (2 nœuds)</h4>
            <div className="text-xs text-green-800 space-y-2">
              <div>
                <p className="font-semibold">1️⃣ Download Image (HTTP Request):</p>
                <p className="ml-3">URL: https://example.com/image.jpg</p>
                <p className="ml-3">Response Format: File</p>
              </div>
              <div>
                <p className="font-semibold">2️⃣ Send to WhatsApp (HTTP Request):</p>
                <p className="ml-3"><strong>Method:</strong> POST</p>
                <p className="ml-3"><strong>Header:</strong> X-API-Key: {API_KEY.substring(0, 20)}...</p>
                <p className="ml-3"><strong>Body:</strong> {`{"to": "+33612345678", "text": "Image", "media": {"type": "image", "mimetype": "image/jpeg", "data": "{{$binary.data.toString('base64')}}"}}`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default APIKeyInfo;
