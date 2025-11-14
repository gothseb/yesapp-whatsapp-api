import APIKeyModel from '../models/apikey.model.js';

/**
 * Authentication Middleware
 * Validates API Key from X-API-Key header
 */
export function authMiddleware(req, res, next) {
  // Extract API key from header
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing API key. Please provide X-API-Key header.',
    });
  }

  // Verify API key
  const verified = APIKeyModel.verify(apiKey);

  if (!verified) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid API key.',
    });
  }

  // Attach auth info to request
  req.auth = {
    keyHash: verified.keyHash,
    name: verified.name,
    permissions: verified.permissions,
  };

  next();
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!req.auth.permissions.includes(permission) && !req.auth.permissions.includes('*')) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Permission '${permission}' required.`,
      });
    }

    next();
  };
}

export default authMiddleware;
