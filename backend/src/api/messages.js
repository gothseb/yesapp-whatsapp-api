import express from 'express';
import { getMessageService } from '../services/message.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  validateSessionId,
  validatePhoneNumber,
  validateMessageContent,
} from '../middleware/validation.middleware.js';
import { rateLimitMessages, getRateLimitStats } from '../middleware/ratelimit.middleware.js';

const router = express.Router();
const messageService = getMessageService();

/**
 * POST /api/v1/sessions/:id/messages
 * Send a message
 */
router.post(
  '/:id/messages',
  authMiddleware,
  validateSessionId,
  validatePhoneNumber,
  validateMessageContent,
  rateLimitMessages,
  async (req, res) => {
    try {
      const { id: sessionId } = req.params;
      const { to, text, media } = req.body;

      let message;

      if (media) {
        // Send media message
        if (!media.type || !media.data) {
          return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Media requires type and data (base64)',
          });
        }

        message = await messageService.sendMediaMessage(sessionId, to, {
          type: media.type,
          data: media.data,
          mimetype: media.mimetype || 'application/octet-stream',
          filename: media.filename,
          caption: text || media.caption,
        });
      } else {
        // Send text message
        message = await messageService.sendMessage(sessionId, to, text);
      }

      res.status(200).json({
        success: true,
        message: {
          id: message.id,
          session_id: message.session_id,
          to: message.to_number,
          status: message.status,
          timestamp: message.timestamp,
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: error.message,
        });
      }

      if (error.message.includes('not connected') || error.message.includes('not ready')) {
        return res.status(503).json({
          error: 'SERVICE_UNAVAILABLE',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to send message',
      });
    }
  }
);

/**
 * GET /api/v1/sessions/:id/messages
 * Get messages for a session
 */
router.get(
  '/:id/messages',
  authMiddleware,
  validateSessionId,
  (req, res) => {
    try {
      const { id: sessionId } = req.params;
      const { limit = 50, offset = 0, direction } = req.query;

      const result = messageService.getMessages(sessionId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        direction,
      });

      res.json({
        success: true,
        messages: result.messages.map((m) => ({
          id: m.id,
          direction: m.direction,
          from: m.from_number,
          to: m.to_number,
          content: m.content,
          media_type: m.media_type,
          media_url: m.media_url,
          status: m.status,
          timestamp: m.timestamp,
        })),
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.offset + result.messages.length < result.total,
        },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch messages',
      });
    }
  }
);

/**
 * GET /api/v1/sessions/:id/messages/:messageId
 * Get a specific message
 */
router.get(
  '/:id/messages/:messageId',
  authMiddleware,
  validateSessionId,
  (req, res) => {
    try {
      const { messageId } = req.params;
      const message = messageService.getMessage(messageId);

      if (!message) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      res.json({
        success: true,
        message: {
          id: message.id,
          session_id: message.session_id,
          direction: message.direction,
          from: message.from_number,
          to: message.to_number,
          content: message.content,
          media_type: message.media_type,
          media_url: message.media_url,
          status: message.status,
          timestamp: message.timestamp,
          metadata: message.metadata,
        },
      });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch message',
      });
    }
  }
);

/**
 * GET /api/v1/sessions/:id/messages/stats
 * Get message statistics for a session
 */
router.get(
  '/:id/messages-stats',
  authMiddleware,
  validateSessionId,
  (req, res) => {
    try {
      const { id: sessionId } = req.params;
      const stats = messageService.getStats(sessionId);
      const rateLimitStats = getRateLimitStats(sessionId);

      res.json({
        success: true,
        stats: {
          messages: stats,
          rateLimit: rateLimitStats,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch statistics',
      });
    }
  }
);

export default router;
