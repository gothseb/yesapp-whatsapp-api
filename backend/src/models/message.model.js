import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';

/**
 * Message Model
 * Manages WhatsApp messages data
 */
class MessageModel {
  /**
   * Create a new message
   * @param {Object} data - Message data
   * @returns {Object} Created message
   */
  static create(data) {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    const sql = `
      INSERT INTO messages (
        id, session_id, direction, from_number, to_number,
        content, media_type, media_url, status, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      id,
      data.session_id,
      data.direction,
      data.from_number,
      data.to_number,
      data.content || null,
      data.media_type || null,
      data.media_url || null,
      data.status || 'pending',
      data.timestamp || now,
      JSON.stringify(data.metadata || {}),
    ]);

    return this.findById(id);
  }

  /**
   * Find message by ID
   * @param {string} id - Message ID
   * @returns {Object|null} Message or null
   */
  static findById(id) {
    const db = getDatabase();
    const sql = 'SELECT * FROM messages WHERE id = ?';
    const message = db.queryOne(sql, [id]);

    return message ? this._formatMessage(message) : null;
  }

  /**
   * Find messages by session
   * @param {string} sessionId - Session ID
   * @param {Object} options - { limit, offset, direction }
   * @returns {Object} { messages, total }
   */
  static findBySession(sessionId, options = {}) {
    const db = getDatabase();
    const { limit = 50, offset = 0, direction = null } = options;

    // Build query
    let sql = 'SELECT * FROM messages WHERE session_id = ?';
    const params = [sessionId];

    if (direction) {
      sql += ' AND direction = ?';
      params.push(direction);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const messages = db.query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM messages WHERE session_id = ?';
    const countParams = [sessionId];

    if (direction) {
      countSql += ' AND direction = ?';
      countParams.push(direction);
    }

    const total = db.queryOne(countSql, countParams).count;

    return {
      messages: messages.map((m) => this._formatMessage(m)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Update message status
   * @param {string} id - Message ID
   * @param {string} status - New status
   * @returns {Object|null} Updated message or null
   */
  static updateStatus(id, status) {
    const db = getDatabase();
    const sql = 'UPDATE messages SET status = ? WHERE id = ?';
    const result = db.run(sql, [status, id]);

    return result.changes > 0 ? this.findById(id) : null;
  }

  /**
   * Get message stats for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Stats
   */
  static getStatsForSession(sessionId) {
    const db = getDatabase();

    const total = db.queryOne('SELECT COUNT(*) as count FROM messages WHERE session_id = ?', [
      sessionId,
    ]).count;

    const sent = db.queryOne(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND direction = ?',
      [sessionId, 'outbound']
    ).count;

    const received = db.queryOne(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND direction = ?',
      [sessionId, 'inbound']
    ).count;

    const failed = db.queryOne(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND status = ?',
      [sessionId, 'failed']
    ).count;

    return {
      total,
      sent,
      received,
      failed,
    };
  }

  /**
   * Get recent messages (last 24h)
   * @param {string} sessionId - Session ID (optional)
   * @returns {number} Count
   */
  static getRecentCount(sessionId = null) {
    const db = getDatabase();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    let sql = 'SELECT COUNT(*) as count FROM messages WHERE timestamp > ?';
    const params = [oneDayAgo];

    if (sessionId) {
      sql += ' AND session_id = ?';
      params.push(sessionId);
    }

    return db.queryOne(sql, params).count;
  }

  /**
   * Delete old messages (cleanup)
   * @param {number} daysOld - Days threshold
   * @returns {number} Deleted count
   */
  static deleteOld(daysOld = 90) {
    const db = getDatabase();
    const threshold = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const sql = 'DELETE FROM messages WHERE timestamp < ?';
    const result = db.run(sql, [threshold]);

    return result.changes;
  }

  /**
   * Format message object (parse JSON fields)
   * @private
   */
  static _formatMessage(message) {
    if (!message) return null;

    return {
      ...message,
      metadata: JSON.parse(message.metadata || '{}'),
    };
  }
}

export default MessageModel;
