import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';

/**
 * Session Model
 * Manages WhatsApp session data
 */
class SessionModel {
  /**
   * Create a new session
   * @param {string} name - Session name
   * @param {Object} settings - Optional settings
   * @returns {Object} Created session
   */
  static create(name, settings = {}) {
    const db = getDatabase();
    const id = uuidv4();
    const now = Date.now();

    const sql = `
      INSERT INTO sessions (id, name, status, created_at, last_activity, settings)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
      id,
      name,
      'pending',
      now,
      now,
      JSON.stringify(settings),
    ]);

    return this.findById(id);
  }

  /**
   * Find session by ID
   * @param {string} id - Session ID
   * @returns {Object|null} Session or null
   */
  static findById(id) {
    const db = getDatabase();
    const sql = 'SELECT * FROM sessions WHERE id = ?';
    const session = db.queryOne(sql, [id]);

    return session ? this._formatSession(session) : null;
  }

  /**
   * Find all sessions
   * @param {Object} filters - Optional filters { status }
   * @returns {Array} Sessions
   */
  static findAll(filters = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM sessions';
    const params = [];

    if (filters.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    const sessions = db.query(sql, params);
    return sessions.map((s) => this._formatSession(s));
  }

  /**
   * Update session
   * @param {string} id - Session ID
   * @param {Object} data - Data to update
   * @returns {Object|null} Updated session or null
   */
  static update(id, data) {
    const db = getDatabase();
    const updates = [];
    const params = [];

    // Build dynamic UPDATE query
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.phone_number !== undefined) {
      updates.push('phone_number = ?');
      params.push(data.phone_number);
    }

    if (data.qr_code !== undefined) {
      updates.push('qr_code = ?');
      params.push(data.qr_code);
    }

    if (data.webhook_url !== undefined) {
      updates.push('webhook_url = ?');
      params.push(data.webhook_url);
    }

    if (data.settings !== undefined) {
      updates.push('settings = ?');
      params.push(JSON.stringify(data.settings));
    }

    // Always update last_activity
    updates.push('last_activity = ?');
    params.push(Date.now());

    if (updates.length === 1) {
      // Only last_activity updated
      return this.findById(id);
    }

    params.push(id);

    const sql = `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`;
    const result = db.run(sql, params);

    return result.changes > 0 ? this.findById(id) : null;
  }

  /**
   * Delete session
   * @param {string} id - Session ID
   * @returns {boolean} Success
   */
  static delete(id) {
    const db = getDatabase();
    const sql = 'DELETE FROM sessions WHERE id = ?';
    const result = db.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Update last activity timestamp
   * @param {string} id - Session ID
   */
  static updateActivity(id) {
    const db = getDatabase();
    const sql = 'UPDATE sessions SET last_activity = ? WHERE id = ?';
    db.run(sql, [Date.now(), id]);
  }

  /**
   * Get sessions count by status
   * @returns {Object} { total, pending, connected, disconnected }
   */
  static getStats() {
    const db = getDatabase();
    const total = db.queryOne('SELECT COUNT(*) as count FROM sessions').count;
    const pending = db.queryOne('SELECT COUNT(*) as count FROM sessions WHERE status = ?', [
      'pending',
    ]).count;
    const connected = db.queryOne('SELECT COUNT(*) as count FROM sessions WHERE status = ?', [
      'connected',
    ]).count;
    const disconnected = db.queryOne('SELECT COUNT(*) as count FROM sessions WHERE status = ?', [
      'disconnected',
    ]).count;

    return {
      total,
      pending,
      connected,
      disconnected,
    };
  }

  /**
   * Format session object (parse JSON fields)
   * @private
   */
  static _formatSession(session) {
    if (!session) return null;

    return {
      ...session,
      settings: JSON.parse(session.settings || '{}'),
    };
  }
}

export default SessionModel;
