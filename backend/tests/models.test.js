// Simple test file to verify models work
import { initDatabase } from '../src/database/db.js';
import SessionModel from '../src/models/session.model.js';
import MessageModel from '../src/models/message.model.js';
import APIKeyModel from '../src/models/apikey.model.js';

console.log('🧪 Testing Models...\n');

// Initialize test database
const db = initDatabase('../data/test.db.sqlite');

// Test 1: Session Model
console.log('1️⃣  Testing SessionModel...');
const session = SessionModel.create('Test Session');
console.log('   ✅ Created session:', session.id);

const foundSession = SessionModel.findById(session.id);
console.log('   ✅ Found session:', foundSession.name);

const updated = SessionModel.update(session.id, { status: 'connected', phone_number: '+33612345678' });
console.log('   ✅ Updated session:', updated.status, updated.phone_number);

const allSessions = SessionModel.findAll();
console.log('   ✅ Total sessions:', allSessions.length);

// Test 2: Message Model
console.log('\n2️⃣  Testing MessageModel...');
const message = MessageModel.create({
  session_id: session.id,
  direction: 'outbound',
  from_number: '+33612345678',
  to_number: '+33698765432',
  content: 'Hello from test!',
  status: 'sent',
});
console.log('   ✅ Created message:', message.id);

const foundMessage = MessageModel.findById(message.id);
console.log('   ✅ Found message:', foundMessage.content);

const sessionMessages = MessageModel.findBySession(session.id);
console.log('   ✅ Session messages:', sessionMessages.total);

// Test 3: APIKey Model
console.log('\n3️⃣  Testing APIKeyModel...');
const apiKey = APIKeyModel.create('test-key', ['read', 'write']);
console.log('   ✅ Created API key:', apiKey.key.substring(0, 16) + '...');

const verified = APIKeyModel.verify(apiKey.key);
console.log('   ✅ Verified API key:', verified.name);

const invalidVerify = APIKeyModel.verify('invalid-key');
console.log('   ✅ Invalid key rejected:', invalidVerify === null);

// Test 4: Cleanup
console.log('\n4️⃣  Testing Delete operations...');
const deletedMessage = MessageModel.updateStatus(message.id, 'failed');
console.log('   ✅ Updated message status:', deletedMessage.status);

const deletedSession = SessionModel.delete(session.id);
console.log('   ✅ Deleted session:', deletedSession);

const deletedKey = APIKeyModel.delete(apiKey.keyHash);
console.log('   ✅ Deleted API key:', deletedKey);

console.log('\n✅ All tests passed!\n');

process.exit(0);
