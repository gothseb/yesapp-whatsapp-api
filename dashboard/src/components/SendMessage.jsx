import { useState } from 'react';
import api from '../api/client';

function SendMessage({ sessionId }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!sessionId) {
      alert('Please select a session first');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    // Validate phone number format (E.164)
    if (!phoneNumber.match(/^\+[1-9]\d{6,14}$/)) {
      alert('Invalid phone number format. Use E.164 format (e.g., +33612345678)');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const response = await api.sendMessage(sessionId, phoneNumber, message);
      setLastResult({
        success: true,
        message: 'Message sent successfully!',
        data: response.data,
      });
      
      // Clear form on success
      setMessage('');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setLastResult(null), 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message';
      setLastResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setSending(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">← Select a connected session to send messages</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">📤 Send Message</h3>

      <form onSubmit={handleSendMessage} className="space-y-4">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+33612345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
            disabled={sending}
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: +[country code][number] (E.164 format)
          </p>
        </div>

        {/* Message Textarea */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent resize-none"
            disabled={sending}
          />
          <p className="mt-1 text-xs text-gray-500">
            {message.length} characters
          </p>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={sending || !phoneNumber.trim() || !message.trim()}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </span>
          ) : (
            'Send Message'
          )}
        </button>
      </form>

      {/* Result Message */}
      {lastResult && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            lastResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">
              {lastResult.success ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              <p className="font-medium">{lastResult.message}</p>
              {lastResult.success && lastResult.data?.message && (
                <p className="text-xs mt-1 opacity-75">
                  Message ID: {lastResult.data.message.id}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Examples */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Quick Examples</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">France:</span> +33612345678
          </div>
          <div>
            <span className="font-medium">USA:</span> +14155551234
          </div>
          <div>
            <span className="font-medium">Brazil:</span> +5511987654321
          </div>
        </div>
      </div>
    </div>
  );
}

export default SendMessage;
