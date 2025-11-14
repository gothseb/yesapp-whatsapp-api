import express from 'express';
import { getSessionService } from '../services/session.service.js';

const router = express.Router();
const sessionService = getSessionService();

/**
 * GET /sessions/:sessionId/groups
 * Liste tous les groupes WhatsApp de la session
 */
router.get('/:sessionId/groups', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Vérifier que le client existe et est prêt
    const client = sessionService.getWhatsAppClient(sessionId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not connected',
      });
    }

    if (!sessionService.isSessionReady(sessionId)) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not ready',
      });
    }

    console.log(`📱 Fetching groups for session ${sessionId}`);

    // Récupérer tous les chats
    const chats = await client.getChats();

    // Filtrer uniquement les groupes et formater les données
    const groups = await Promise.all(
      chats
        .filter((chat) => chat.isGroup)
        .map(async (group) => {
          try {
            // Vérifier si l'utilisateur est admin
            const me = client.info.wid._serialized;
            const participant = group.participants.find(
              (p) => p.id._serialized === me
            );

            return {
              id: group.id._serialized,
              name: group.name,
              participants: group.participants.length,
              isAdmin: participant?.isAdmin || false,
              isSuperAdmin: participant?.isSuperAdmin || false,
              timestamp: group.timestamp,
              unreadCount: group.unreadCount || 0,
            };
          } catch (error) {
            console.error(`Error processing group ${group.id._serialized}:`, error);
            return null;
          }
        })
    );

    // Filtrer les groupes null (erreurs)
    const validGroups = groups.filter((g) => g !== null);

    console.log(`   ✅ Found ${validGroups.length} groups`);

    res.json({
      success: true,
      count: validGroups.length,
      groups: validGroups,
    });
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /sessions/:sessionId/groups/:groupId
 * Obtenir les détails d'un groupe spécifique
 */
router.get('/:sessionId/groups/:groupId', async (req, res) => {
  try {
    const { sessionId, groupId } = req.params;

    const client = sessionService.getWhatsAppClient(sessionId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not connected',
      });
    }

    // Formater l'ID du groupe si nécessaire
    const formattedGroupId = groupId.includes('@g.us')
      ? groupId
      : `${groupId}@g.us`;

    console.log(`📱 Fetching group details: ${formattedGroupId}`);

    // Récupérer le chat du groupe
    const chat = await client.getChatById(formattedGroupId);

    if (!chat.isGroup) {
      return res.status(400).json({
        success: false,
        error: 'Not a group chat',
      });
    }

    // Vérifier si l'utilisateur est admin
    const me = client.info.wid._serialized;
    const participant = chat.participants.find((p) => p.id._serialized === me);

    const groupDetails = {
      id: chat.id._serialized,
      name: chat.name,
      description: chat.groupMetadata?.desc || '',
      owner: chat.groupMetadata?.owner?._serialized || null,
      createdAt: chat.groupMetadata?.creation || null,
      participants: chat.participants.map((p) => ({
        id: p.id._serialized,
        isAdmin: p.isAdmin,
        isSuperAdmin: p.isSuperAdmin,
      })),
      participantCount: chat.participants.length,
      isAdmin: participant?.isAdmin || false,
      isSuperAdmin: participant?.isSuperAdmin || false,
      inviteCode: chat.groupMetadata?.inviteCode || null,
      unreadCount: chat.unreadCount || 0,
    };

    res.json({
      success: true,
      group: groupDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching group details:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
