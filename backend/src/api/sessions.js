import express from 'express';
import { getSessionService } from '../services/session.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateSessionId } from '../middleware/validation.middleware.js';

const router = express.Router();
const sessionService = getSessionService();

/**
 * POST /api/v1/sessions
 * Create a new WhatsApp session
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Session name is required',
      });
    }

    const session = await sessionService.createSession(name);

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        qr_code: session.qr_code,
        created_at: session.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to create session',
    });
  }
});

/**
 * GET /api/v1/sessions
 * Get all sessions
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { status } = req.query;
    const filters = status ? { status } : {};

    const sessions = sessionService.getAllSessions(filters);

    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        phone_number: s.phone_number,
        created_at: s.created_at,
        last_activity: s.last_activity,
        client: s.client,
      })),
      total: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch sessions',
    });
  }
});

/**
 * GET /api/v1/sessions/:id
 * Get session by ID
 */
router.get('/:id', authMiddleware, validateSessionId, (req, res) => {
  try {
    const { id } = req.params;
    const session = sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        phone_number: session.phone_number,
        webhook_url: session.webhook_url,
        created_at: session.created_at,
        last_activity: session.last_activity,
        client: session.client,
        settings: session.settings,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch session',
    });
  }
});

/**
 * GET /api/v1/sessions/:id/qr
 * Get QR code for a session
 */
router.get('/:id/qr', authMiddleware, validateSessionId, (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = sessionService.getQRCode(id);

    if (!qrCode) {
      const session = sessionService.getSession(id);
      
      if (!session) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      if (session.status === 'connected') {
        return res.status(200).json({
          success: true,
          message: 'Session already connected',
          qr_code: null,
          status: 'connected',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'QR code not yet generated. Please wait...',
        qr_code: null,
        status: session.status,
      });
    }

    res.json({
      success: true,
      qr_code: qrCode,
      status: 'pending',
    });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch QR code',
    });
  }
});

/**
 * DELETE /api/v1/sessions/:id
 * Delete a session
 */
router.delete('/:id', authMiddleware, validateSessionId, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await sessionService.deleteSession(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete session',
    });
  }
});

/**
 * POST /api/v1/sessions/:id/reconnect
 * Reconnect a session
 */
router.post('/:id/reconnect', authMiddleware, validateSessionId, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.reconnectSession(id);

    res.json({
      success: true,
      message: 'Reconnection initiated',
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('Error reconnecting session:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to reconnect session',
    });
  }
});

export default router;
