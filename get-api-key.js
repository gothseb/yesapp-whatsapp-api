// Script to retrieve API key from database
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

const apiKeys = db.prepare('SELECT key_hash, name, created_at FROM api_keys').all();

console.log('\n🔑 API Keys in Database:\n');
console.log('━'.repeat(80));

if (apiKeys.length === 0) {
  console.log('No API keys found. Start the backend to generate one.');
} else {
  apiKeys.forEach((key, index) => {
    console.log(`${index + 1}. Name: ${key.name}`);
    console.log(`   Hash: ${key.key_hash.substring(0, 16)}...`);
    console.log(`   Created: ${new Date(key.created_at).toLocaleString()}`);
    console.log('');
  });
  
  console.log('⚠️  Note: The plaintext API key was shown only once during generation.');
  console.log('📝 Check backend startup logs or regenerate by deleting the database.');
}

console.log('━'.repeat(80));
console.log('\n💡 To generate a new API key:');
console.log('   1. Stop the backend');
console.log('   2. Delete data/db.sqlite');
console.log('   3. Restart backend - new key will be displayed');
console.log('');

db.close();
