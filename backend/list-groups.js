#!/usr/bin/env node
import { getSessionService } from './src/services/session.service.js';
import SessionModel from './src/models/session.model.js';

const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Usage: node list-groups.js [session-id]');
  const sessions = SessionModel.findAll();
  if (sessions.length > 0) {
    console.log('\nSessions disponibles:\n');
    sessions.forEach(s => console.log(`  ${s.id} - ${s.name} (${s.status})`));
  }
  process.exit(1);
}

async function listGroups() {
  try {
    const sessionService = getSessionService();
    const client = sessionService.getWhatsAppClient(sessionId);

    if (!client || !sessionService.isSessionReady(sessionId)) {
      console.error('Session non connectée');
      process.exit(1);
    }

    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    console.log(`\n${groups.length} groupe(s) trouvé(s):\n`);
    
    groups.forEach(group => {
      const me = client.info.wid._serialized;
      const participant = group.participants.find(p => p.id._serialized === me);
      
      console.log(`📱 ${group.name}`);
      console.log(`   ID: ${group.id._serialized}`);
      console.log(`   Participants: ${group.participants.length}`);
      console.log(`   Admin: ${participant?.isAdmin ? 'Oui' : 'Non'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

listGroups();
