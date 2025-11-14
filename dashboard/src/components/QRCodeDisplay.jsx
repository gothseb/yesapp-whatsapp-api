import { useState, useEffect } from 'react';
import api from '../api/client';

function QRCodeDisplay({ sessionId }) {
  const [session, setSession] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionAndQR = async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch session details
      const sessionResponse = await api.getSession(sessionId);
      setSession(sessionResponse.data.session);

      // Fetch QR code if pending
      if (sessionResponse.data.session.status === 'pending') {
        const qrResponse = await api.getQRCode(sessionId);
        setQrCode(qrResponse.data.qr_code);
      } else {
        setQrCode(null);
      }
    } catch (err) {
      console.error('Error fetching session/QR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndQR();
    
    // Refresh every 5 seconds if pending
    const interval = setInterval(fetchSessionAndQR, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">← Select a session to view details</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-whatsapp-green rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card text-center">
        <p className="text-red-600">Session not found</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Session: {session.name}</h3>

      {/* Session Information Card */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">📋 Session Information</h4>
        
        {/* Session ID */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Session ID (pour n8n)</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={session.id}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(session.id);
                alert('✓ Session ID copié!');
              }}
              className="px-3 py-2 bg-whatsapp-green text-white rounded hover:bg-green-700 text-sm font-medium"
              title="Copier Session ID"
            >
              📋 Copier
            </button>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Status</label>
          <div className="mt-1">
            {session.status === 'connected' && (
              <span className="badge badge-green">✓ Connected</span>
            )}
            {session.status === 'pending' && (
              <span className="badge badge-yellow">⏳ Waiting for QR scan</span>
            )}
            {session.status === 'disconnected' && (
              <span className="badge badge-red">✗ Disconnected</span>
            )}
          </div>
        </div>
        
        {/* Phone Number */}
        {session.phone_number && (
          <div>
            <label className="text-xs text-gray-500 font-medium">WhatsApp Number</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={session.phone_number}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.phone_number);
                  alert('✓ Numéro copié!');
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                title="Copier numéro"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Created</label>
          <p className="text-sm text-gray-700 mt-1">
            {new Date(session.created_at).toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Client Status */}
        {session.client && (
          <div>
            <label className="text-xs text-gray-500 font-medium">Client Status</label>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${session.client.exists ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                {session.client.exists ? '✓ Client Active' : '○ No Client'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${session.client.ready ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {session.client.ready ? '✓ Ready' : '○ Not Ready'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Display */}
      {session.status === 'pending' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {qrCode ? (
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-4">
                📱 Scan this QR code with WhatsApp
              </h4>
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="mx-auto max-w-sm w-full bg-white p-4 rounded-lg shadow-md"
              />
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>1. Open WhatsApp on your phone</p>
                <p>2. Tap Menu (⋮) → Linked Devices</p>
                <p>3. Tap "Link a Device"</p>
                <p>4. Scan this QR code</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-whatsapp-green rounded-full animate-spin mb-3"></div>
              <p>Generating QR code...</p>
              <p className="text-xs mt-2">This usually takes a few seconds</p>
            </div>
          )}
        </div>
      )}

      {/* Connected State */}
      {session.status === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <h4 className="font-medium text-green-900 mb-2">
            WhatsApp Connected!
          </h4>
          <p className="text-sm text-green-700">
            You can now send and receive messages via the API
          </p>
          {session.phone_number && (
            <p className="text-sm text-green-600 mt-2">
              Connected as: {session.phone_number}
            </p>
          )}
        </div>
      )}

      {/* Disconnected State */}
      {session.status === 'disconnected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">✗</div>
          <h4 className="font-medium text-red-900 mb-2">
            Session Disconnected
          </h4>
          <p className="text-sm text-red-700 mb-4">
            The WhatsApp session was disconnected
          </p>
          <button
            onClick={async () => {
              try {
                await api.reconnectSession(sessionId);
                alert('Reconnection initiated. Please wait for QR code...');
              } catch (err) {
                alert('Failed to reconnect: ' + (err.response?.data?.message || err.message));
              }
            }}
            className="btn-primary"
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default QRCodeDisplay;
