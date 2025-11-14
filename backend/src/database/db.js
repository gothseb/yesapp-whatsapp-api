import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || '../data/db.sqlite';
    
    // Resolve path relative to project root
    if (!path.isAbsolute(this.dbPath)) {
      this.dbPath = path.resolve(__dirname, '../../..', this.dbPath);
    }

    // Ensure data directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign keys
    
    console.log(`📊 Database connected: ${this.dbPath}`);
    
    // Run migrations on init
    this.runMigrations();
  }

  /**
   * Run all SQL migrations in order
   */
  runMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`🔄 Running ${migrationFiles.length} migration(s)...`);

    migrationFiles.forEach((file) => {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        this.db.exec(sql);
        console.log(`   ✅ ${file}`);
      } catch (error) {
        console.error(`   ❌ ${file}: ${error.message}`);
        throw error;
      }
    });

    console.log('✅ Migrations completed');
  }

  /**
   * Execute a SELECT query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} - Query results
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Execute a single SELECT query (returns one row)
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object|undefined} - Query result
   */
  queryOne(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(...params);
    } catch (error) {
      console.error('QueryOne error:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} - { changes, lastInsertRowid }
   */
  run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple statements in a transaction
   * @param {Function} callback - Function containing DB operations
   * @returns {*} - Result of callback
   */
  transaction(callback) {
    try {
      const transaction = this.db.transaction(callback);
      return transaction();
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  /**
   * Check if database connection is healthy
   * @returns {boolean}
   */
  isHealthy() {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get database stats
   * @returns {Object}
   */
  getStats() {
    try {
      const sessions = this.queryOne('SELECT COUNT(*) as count FROM sessions');
      const messages = this.queryOne('SELECT COUNT(*) as count FROM messages');
      const apiKeys = this.queryOne('SELECT COUNT(*) as count FROM api_keys');

      return {
        sessions: sessions.count,
        messages: messages.count,
        apiKeys: apiKeys.count,
        path: this.dbPath,
        size: fs.statSync(this.dbPath).size,
      };
    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('📊 Database closed');
    }
  }
}

// Create singleton instance
let dbInstance = null;

export function initDatabase(dbPath) {
  if (!dbInstance) {
    dbInstance = new DatabaseManager(dbPath);
  }
  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export default DatabaseManager;
