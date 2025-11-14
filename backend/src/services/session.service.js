import SessionModel from '../models/session.model.js';
import { getWhatsAppService } from './whatsapp.service.js';

/**
 * Session Service
 * Business logic for managing WhatsApp sessions
 */
class SessionService {
  constructor() {
    this.whatsappService = getWhatsAppService();
  }

  /**
   * Create a new WhatsApp session
   * @param {string} name - Session name
   * @param {Object} settings - Optional settings
   * @returns {Promise<Object>} Created session
   */
  async createSession(name, settings = {}) {
    console.log(`📱 Creating session: ${name}`);

    // Create session in database
    const session = SessionModel.create(name, settings);

    // Initialize WhatsApp client
    try {
      await this.whatsappService.initClient(session.id);
      console.log(`✅ Session ${session.id} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize WhatsApp client:`, error);
      // Don't delete the session, user can retry
      throw new Error('Failed to initialize WhatsApp client: ' + error.message);
    }

    // Return session (QR code will be updated via events)
    return this.getSession(session.id);
  }

  /**
   * Get session by ID
   * @param {string} sessionId
   * @returns {Object|null}
   */
  getSession(sessionId) {
    const session = SessionModel.findById(sessionId);
    
    if (!session) return null;

    // Add client status info
    const hasClient = this.whatsappService.hasClient(sessionId);
    const isReady = this.whatsappService.isClientReady(sessionId);

    return {
      ...session,
      client: {
        exists: hasClient,
        ready: isReady,
      },
    };
  }

  /**
   * Get all sessions
   * @param {Object} filters - Optional filters
   * @returns {Array}
   */
  getAllSessions(filters = {}) {
    const sessions = SessionModel.findAll(filters);

    // Add client status to each session
    return sessions.map((session) => ({
      ...session,
      client: {
        exists: this.whatsappService.hasClient(session.id),
        ready: this.whatsappService.isClientReady(session.id),
      },
    }));
  }

  /**
   * Get QR code for a session
   * @param {string} sessionId
   * @returns {string|null} QR code data URL or null
   */
  getQRCode(sessionId) {
    const session = SessionModel.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'connected') {
      return null; // Already connected, no QR needed
    }

    return session.qr_code;
  }

  /**
   * Delete a session
   * @param {string} sessionId
   * @returns {Promise<boolean>}
   */
  async deleteSession(sessionId) {
    console.log(`🗑️  Deleting session: ${sessionId}`);

    // Destroy WhatsApp client first
    try {
      await this.whatsappService.destroyClient(sessionId);
    } catch (error) {
      console.error(`⚠️  Error destroying WhatsApp client:`, error);
      // Continue with deletion anyway
    }

    // Delete from database
    const deleted = SessionModel.delete(sessionId);

    if (deleted) {
      console.log(`✅ Session ${sessionId} deleted successfully`);
    }

    return deleted;
  }

  /**
   * Reconnect a session
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  async reconnectSession(sessionId) {
    console.log(`🔄 Reconnecting session: ${sessionId}`);

    const session = SessionModel.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Update status to pending
    SessionModel.update(sessionId, { status: 'pending' });

    // Reconnect WhatsApp client
    await this.whatsappService.reconnect(sessionId);

    return this.getSession(sessionId);
  }

  /**
   * Get session statistics
   * @returns {Object}
   */
  getStats() {
    const sessionStats = SessionModel.getStats();
    const whatsappStats = this.whatsappService.getStats();

    return {
      sessions: sessionStats,
      whatsapp: whatsappStats,
    };
  }

  /**
   * Check if session exists and is connected
   * @param {string} sessionId
   * @returns {boolean}
   */
  isSessionReady(sessionId) {
    const session = SessionModel.findById(sessionId);
    
    if (!session) return false;
    if (session.status !== 'connected') return false;

    return this.whatsappService.isClientReady(sessionId);
  }

  /**
   * Get WhatsApp client for a session (for internal use)
   * @param {string} sessionId
   * @returns {Client|null}
   */
  getWhatsAppClient(sessionId) {
    return this.whatsappService.getClient(sessionId);
  }
}

// Create singleton instance
let sessionServiceInstance = null;

export function getSessionService() {
  if (!sessionServiceInstance) {
    sessionServiceInstance = new SessionService();
  }
  return sessionServiceInstance;
}

export default SessionService;
