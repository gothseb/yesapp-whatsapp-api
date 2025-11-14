// Create a new API key manually
import crypto from 'crypto';
import { initDatabase } from './src/database/db.js';

console.log('\n🔑 Creating new API Key...\n');

// Initialize database
const db = initDatabase();

// Generate random key
const key = crypto.randomBytes(32).toString('hex');
const keyHash = crypto.createHash('sha256').update(key).digest('hex');

// Insert into database
const sql = `INSERT INTO api_keys (key_hash, name, permissions, created_at) VALUES (?, ?, ?, ?)`;
db.run(sql, [keyHash, 'manual-key', JSON.stringify(['read', 'write']), Date.now()]);

console.log('━'.repeat(80));
console.log('🔐 NEW API KEY GENERATED - COPY THIS NOW!');
console.log('━'.repeat(80));
console.log('');
console.log(`   ${key}`);
console.log('');
console.log('━'.repeat(80));
console.log('');
console.log('📝 Next steps:');
console.log('   1. Copy the key above');
console.log('   2. Update dashboard/.env with: VITE_API_KEY=<your-key>');
console.log('   3. Restart the dashboard');
console.log('');

db.close();
process.exit(0);
