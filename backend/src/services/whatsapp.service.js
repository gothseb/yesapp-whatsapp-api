import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import SessionModel from '../models/session.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WhatsApp Service
 * Manages WhatsApp Web clients for multiple sessions
 */
class WhatsAppService {
  constructor() {
    // Map to store active WhatsApp clients
    // Key: sessionId, Value: WhatsApp Client instance
    this.clients = new Map();

    // Sessions path for storing auth data
    this.sessionsPath = process.env.SESSIONS_PATH || path.resolve(__dirname, '../../../data/sessions');

    console.log('📱 WhatsApp Service initialized');
    console.log(`   Sessions path: ${this.sessionsPath}`);
  }

  /**
   * Initialize WhatsApp client for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Client>}
   */
  async initClient(sessionId) {
    // Check if client already exists
    if (this.clients.has(sessionId)) {
      console.log(`📱 Client already exists for session ${sessionId}`);
      return this.clients.get(sessionId);
    }

    console.log(`📱 Initializing WhatsApp client for session ${sessionId}...`);

    // Create new WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    // Setup event listeners
    this._setupEventListeners(client, sessionId);

    // Store client
    this.clients.set(sessionId, client);

    // Initialize client
    try {
      await client.initialize();
      console.log(`✅ Client initialized for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to initialize client for session ${sessionId}:`, error);
      this.clients.delete(sessionId);
      throw error;
    }

    return client;
  }

  /**
   * Setup event listeners for WhatsApp client
   * @private
   */
  _setupEventListeners(client, sessionId) {
    // QR Code received
    client.on('qr', async (qr) => {
      console.log(`📱 QR code received for session ${sessionId}`);
      
      try {
        // Generate QR code as base64 data URL
        const qrDataURL = await qrcode.toDataURL(qr);
        
        // Update session with QR code
        SessionModel.update(sessionId, {
          qr_code: qrDataURL,
          status: 'pending',
        });

        console.log(`   ✅ QR code saved for session ${sessionId}`);
      } catch (error) {
        console.error(`   ❌ Error generating QR code for session ${sessionId}:`, error);
      }
    });

    // Client authenticated
    client.on('authenticated', () => {
      console.log(`✅ Authenticated session ${sessionId}`);
    });

    // Client ready
    client.on('ready', async () => {
      console.log(`✅ Session ${sessionId} is ready!`);

      try {
        // Get connected phone number
        const info = client.info;
        const phoneNumber = info.wid.user;

        // Update session status
        SessionModel.update(sessionId, {
          status: 'connected',
          phone_number: `+${phoneNumber}`,
          qr_code: null, // Clear QR code
        });

        console.log(`   📱 Connected to: +${phoneNumber}`);
      } catch (error) {
        console.error(`   ❌ Error updating session ${sessionId}:`, error);
      }
    });

    // Authentication failure
    client.on('auth_failure', (msg) => {
      console.error(`❌ Authentication failed for session ${sessionId}:`, msg);
      
      SessionModel.update(sessionId, {
        status: 'disconnected',
        qr_code: null,
      });
    });

    // Client disconnected
    client.on('disconnected', (reason) => {
      console.log(`⚠️  Session ${sessionId} disconnected:`, reason);

      SessionModel.update(sessionId, {
        status: 'disconnected',
      });

      // Try to reconnect after delay
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect session ${sessionId}...`);
        this.reconnect(sessionId);
      }, 5000);
    });

    // Message received
    client.on('message', async (message) => {
      console.log(`📩 Message received in session ${sessionId}`);
      
      // This will be handled by message service later
      // For now, just log it
      console.log(`   From: ${message.from}`);
      console.log(`   Body: ${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}`);
    });

    // Loading screen
    client.on('loading_screen', (percent) => {
      console.log(`📱 Session ${sessionId} loading: ${percent}%`);
    });
  }

  /**
   * Get client for a session
   * @param {string} sessionId
   * @returns {Client|null}
   */
  getClient(sessionId) {
    return this.clients.get(sessionId) || null;
  }

  /**
   * Check if session has active client
   * @param {string} sessionId
   * @returns {boolean}
   */
  hasClient(sessionId) {
    return this.clients.has(sessionId);
  }

  /**
   * Check if client is ready
   * @param {string} sessionId
   * @returns {boolean}
   */
  isClientReady(sessionId) {
    const client = this.getClient(sessionId);
    if (!client) return false;

    try {
      return client.info !== null && client.info !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Reconnect a session
   * @param {string} sessionId
   */
  async reconnect(sessionId) {
    const client = this.getClient(sessionId);
    
    if (!client) {
      console.log(`⚠️  No client found for session ${sessionId}, creating new one`);
      return await this.initClient(sessionId);
    }

    try {
      console.log(`🔄 Reconnecting session ${sessionId}...`);
      await client.initialize();
    } catch (error) {
      console.error(`❌ Reconnection failed for session ${sessionId}:`, error);
      
      // Remove old client and create new one
      this.clients.delete(sessionId);
      return await this.initClient(sessionId);
    }
  }

  /**
   * Destroy client and cleanup
   * @param {string} sessionId
   */
  async destroyClient(sessionId) {
    const client = this.getClient(sessionId);
    
    if (!client) {
      console.log(`⚠️  No client to destroy for session ${sessionId}`);
      return;
    }

    try {
      console.log(`🗑️  Destroying client for session ${sessionId}...`);
      await client.destroy();
      this.clients.delete(sessionId);
      console.log(`   ✅ Client destroyed for session ${sessionId}`);
    } catch (error) {
      console.error(`   ❌ Error destroying client for session ${sessionId}:`, error);
      // Force remove from map
      this.clients.delete(sessionId);
    }
  }

  /**
   * Get all active sessions
   * @returns {Array<string>} Session IDs
   */
  getActiveSessions() {
    return Array.from(this.clients.keys());
  }

  /**
   * Get service stats
   * @returns {Object}
   */
  getStats() {
    const activeSessions = this.getActiveSessions();
    const readySessions = activeSessions.filter((id) => this.isClientReady(id));

    return {
      totalClients: this.clients.size,
      activeSessions: activeSessions.length,
      readySessions: readySessions.length,
    };
  }

  /**
   * Cleanup all clients (for graceful shutdown)
   */
  async cleanup() {
    console.log('🧹 Cleaning up WhatsApp Service...');
    
    const destroyPromises = Array.from(this.clients.keys()).map((sessionId) =>
      this.destroyClient(sessionId)
    );

    await Promise.allSettled(destroyPromises);
    
    console.log('✅ WhatsApp Service cleanup completed');
  }
}

// Create singleton instance
let whatsappServiceInstance = null;

export function getWhatsAppService() {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService();
  }
  return whatsappServiceInstance;
}

export default WhatsAppService;
