/**
 * Validation Middleware
 * Validates and sanitizes user inputs
 */

/**
 * Validate phone number (E.164 format)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // E.164 format: +[country code][number] (7-15 digits total)
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validate UUID format
 * @param {string} id - UUID
 * @returns {boolean}
 */
export function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Middleware: Validate recipient (phone number or group ID)
 * Supports:
 * - E.164 phone numbers: +33612345678
 * - WhatsApp group IDs: 120363XXXXX@g.us
 * - WhatsApp contact IDs: 33612345678@c.us
 */
export function validatePhoneNumber(req, res, next) {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Recipient "to" is required',
    });
  }

  // Si c'est un ID de groupe WhatsApp (se termine par @g.us)
  if (to.includes('@g.us')) {
    const groupRegex = /^\d+@g\.us$/;
    if (!groupRegex.test(to)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid group ID format. Expected: 120363XXXXX@g.us',
      });
    }
    return next();
  }

  // Si c'est un ID de contact WhatsApp (se termine par @c.us)
  if (to.includes('@c.us')) {
    const contactRegex = /^\d+@c\.us$/;
    if (!contactRegex.test(to)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid contact ID format. Expected: 33612345678@c.us',
      });
    }
    return next();
  }

  // Sinon, valider comme numéro de téléphone E.164
  // E.164 format: +[country code][number]
  // Example: +33612345678, +14155551234
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!e164Regex.test(to)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message:
        'Invalid format. Use E.164 (+33612345678), group ID (120363XXX@g.us), or contact ID (33612345678@c.us)',
    });
  }

  next();
}

/**
 * Middleware: Validate session ID parameter
 */
export function validateSessionId(req, res, next) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Session ID is required',
    });
  }

  if (!isValidUUID(id)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid session ID format',
    });
  }

  next();
}

/**
 * Middleware: Validate message content
 */
export function validateMessageContent(req, res, next) {
  const { text, media } = req.body;

  if (!text && !media) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Either text or media is required',
    });
  }

  if (text && typeof text !== 'string') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Text must be a string',
    });
  }

  if (text && text.length > 10000) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Text too long (max 10000 characters)',
    });
  }

  next();
}

/**
 * Sanitize string input
 * @param {string} input
 * @returns {string}
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and trim
  return input.replace(/\0/g, '').trim();
}

export default {
  validatePhoneNumber,
  validateSessionId,
  validateMessageContent,
  isValidPhoneNumber,
  isValidUUID,
  sanitizeString,
};
