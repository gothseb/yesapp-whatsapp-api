import crypto from 'crypto';
import { getDatabase } from '../database/db.js';

/**
 * APIKey Model
 * Manages API authentication keys
 */
class APIKeyModel {
  /**
   * Create a new API key
   * @param {string} name - Key name/description
   * @param {Array} permissions - Permissions array
   * @returns {Object} { key (plaintext), keyHash, name }
   */
  static create(name = 'default', permissions = ['read', 'write']) {
    const db = getDatabase();

    // Generate random key (32 bytes = 64 hex chars)
    const key = crypto.randomBytes(32).toString('hex');

    // Hash the key for storage
    const keyHash = this._hashKey(key);

    const now = Date.now();

    const sql = `
      INSERT INTO api_keys (key_hash, name, permissions, created_at)
      VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [keyHash, name, JSON.stringify(permissions), now]);

    return {
      key, // Return plaintext key ONLY on creation
      keyHash,
      name,
      permissions,
      created_at: now,
    };
  }

  /**
   * Verify an API key
   * @param {string} key - Plaintext key to verify
   * @returns {Object|null} Key info or null if invalid
   */
  static verify(key) {
    if (!key) return null;

    const db = getDatabase();
    const keyHash = this._hashKey(key);

    const sql = `
      SELECT key_hash, name, permissions, created_at, expires_at
      FROM api_keys
      WHERE key_hash = ?
    `;

    const apiKey = db.queryOne(sql, [keyHash]);

    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expires_at && apiKey.expires_at < Date.now()) {
      return null;
    }

    return {
      keyHash: apiKey.key_hash,
      name: apiKey.name,
      permissions: JSON.parse(apiKey.permissions),
      created_at: apiKey.created_at,
      expires_at: apiKey.expires_at,
    };
  }

  /**
   * Find all API keys (without plaintext keys)
   * @returns {Array} API keys
   */
  static findAll() {
    const db = getDatabase();
    const sql = 'SELECT key_hash, name, permissions, created_at, expires_at FROM api_keys';
    const keys = db.query(sql);

    return keys.map((k) => ({
      ...k,
      permissions: JSON.parse(k.permissions),
    }));
  }

  /**
   * Delete an API key
   * @param {string} keyHash - Key hash to delete
   * @returns {boolean} Success
   */
  static delete(keyHash) {
    const db = getDatabase();
    const sql = 'DELETE FROM api_keys WHERE key_hash = ?';
    const result = db.run(sql, [keyHash]);

    return result.changes > 0;
  }

  /**
   * Check if any API keys exist
   * @returns {boolean}
   */
  static hasKeys() {
    const db = getDatabase();
    const result = db.queryOne('SELECT COUNT(*) as count FROM api_keys');
    return result.count > 0;
  }

  /**
   * Hash a key using SHA256
   * @private
   */
  static _hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

export default APIKeyModel;
