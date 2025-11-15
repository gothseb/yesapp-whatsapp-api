import MessageModel from '../models/message.model.js';
import SessionModel from '../models/session.model.js';
import { getSessionService } from './session.service.js';

/**
 * Message Service
 * Business logic for sending and managing messages
 */
class MessageService {
  constructor() {
    this.sessionService = getSessionService();
  }

  /**
   * Send a text message
   * @param {string} sessionId - Session ID
   * @param {string} to - Recipient phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} Message object
   */
  async sendMessage(sessionId, to, text) {
    console.log(`📤 Sending message from session ${sessionId} to ${to}`);

    // Verify session exists and is connected
    const session = SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'connected') {
      throw new Error(`Session not connected (status: ${session.status})`);
    }

    // Get WhatsApp client
    const client = this.sessionService.getWhatsAppClient(sessionId);
    if (!client) {
      throw new Error('WhatsApp client not found');
    }

    if (!this.sessionService.isSessionReady(sessionId)) {
      throw new Error('WhatsApp client not ready');
    }

    // Déterminer si c'est un groupe ou un contact et formater
    let formattedRecipient;
    
    if (to.includes('@g.us')) {
      // C'est déjà un ID de groupe WhatsApp
      formattedRecipient = to;
      console.log(`   📱 Target: Group ${to}`);
    } else if (to.includes('@c.us')) {
      // C'est déjà un ID de contact WhatsApp
      formattedRecipient = to;
      console.log(`   📱 Target: Contact ${to}`);
    } else {
      // C'est un numéro de téléphone E.164, convertir en ID WhatsApp
      formattedRecipient = to.replace('+', '') + '@c.us';
      console.log(`   📱 Target: Phone ${to} → ${formattedRecipient}`);
    }

    // Create message record (status: pending)
    const message = MessageModel.create({
      session_id: sessionId,
      direction: 'outbound',
      from_number: session.phone_number,
      to_number: to,
      content: text,
      status: 'pending',
    });

    try {
      // Send via WhatsApp
      const sentMessage = await client.sendMessage(formattedRecipient, text);

      // Update message status
      MessageModel.updateStatus(message.id, 'sent');

      console.log(`   ✅ Message sent: ${message.id}`);

      // Update session activity
      SessionModel.updateActivity(sessionId);

      return {
        ...message,
        status: 'sent',
        whatsapp_id: sentMessage.id._serialized,
      };
    } catch (error) {
      console.error(`   ❌ Failed to send message:`, error);

      // Update message status to failed
      MessageModel.updateStatus(message.id, 'failed');

      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Send a media message
   * @param {string} sessionId - Session ID
   * @param {string} to - Recipient phone number
   * @param {Object} media - Media object { type, data, caption }
   * @returns {Promise<Object>} Message object
   */
  async sendMediaMessage(sessionId, to, media) {
    console.log(`📤 Sending ${media.type} from session ${sessionId} to ${to}`);

    // Verify session
    const session = SessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'connected') {
      throw new Error(`Session not connected (status: ${session.status})`);
    }

    // Get WhatsApp client
    const client = this.sessionService.getWhatsAppClient(sessionId);
    if (!client || !this.sessionService.isSessionReady(sessionId)) {
      throw new Error('WhatsApp client not ready');
    }

    // Déterminer si c'est un groupe ou un contact et formater
    let formattedRecipient;
    
    if (to.includes('@g.us')) {
      // C'est déjà un ID de groupe WhatsApp
      formattedRecipient = to;
      console.log(`   📱 Target: Group ${to}`);
    } else if (to.includes('@c.us')) {
      // C'est déjà un ID de contact WhatsApp
      formattedRecipient = to;
      console.log(`   📱 Target: Contact ${to}`);
    } else {
      // C'est un numéro de téléphone E.164, convertir en ID WhatsApp
      formattedRecipient = to.replace('+', '') + '@c.us';
      console.log(`   📱 Target: Phone ${to} → ${formattedRecipient}`);
    }

    // Create message record
    const message = MessageModel.create({
      session_id: sessionId,
      direction: 'outbound',
      from_number: session.phone_number,
      to_number: to,
      content: media.caption || null,
      media_type: media.type,
      status: 'pending',
    });

    try {
      // Prepare media (whatsapp-web.js format)
      const MessageMedia = (await import('whatsapp-web.js')).default.MessageMedia;
      const messageMedia = new MessageMedia(
        media.mimetype,
        media.data, // base64
        media.filename || 'file'
      );

      // Send via WhatsApp
      const sentMessage = await client.sendMessage(formattedRecipient, messageMedia, {
        caption: media.caption || '',
      });

      // Update message status
      MessageModel.updateStatus(message.id, 'sent');

      console.log(`   ✅ Media message sent: ${message.id}`);

      // Update session activity
      SessionModel.updateActivity(sessionId);

      return {
        ...message,
        status: 'sent',
        whatsapp_id: sentMessage.id._serialized,
      };
    } catch (error) {
      console.error(`   ❌ Failed to send media:`, error);
      MessageModel.updateStatus(message.id, 'failed');
      throw new Error(`Failed to send media: ${error.message}`);
    }
  }

  /**
   * Get messages for a session
   * @param {string} sessionId - Session ID
   * @param {Object} options - { limit, offset, direction }
   * @returns {Object} Messages with pagination
   */
  getMessages(sessionId, options = {}) {
    return MessageModel.findBySession(sessionId, options);
  }

  /**
   * Get message by ID
   * @param {string} messageId - Message ID
   * @returns {Object|null} Message
   */
  getMessage(messageId) {
    return MessageModel.findById(messageId);
  }

  /**
   * Get message statistics
   * @param {string} sessionId - Session ID (optional)
   * @returns {Object} Stats
   */
  getStats(sessionId = null) {
    if (sessionId) {
      return MessageModel.getStatsForSession(sessionId);
    }

    // Global stats
    return {
      total: MessageModel.getRecentCount(),
      sessions: SessionModel.findAll().map((s) => ({
        sessionId: s.id,
        name: s.name,
        stats: MessageModel.getStatsForSession(s.id),
      })),
    };
  }
}

// Create singleton instance
let messageServiceInstance = null;

export function getMessageService() {
  if (!messageServiceInstance) {
    messageServiceInstance = new MessageService();
  }
  return messageServiceInstance;
}

export default MessageService;
