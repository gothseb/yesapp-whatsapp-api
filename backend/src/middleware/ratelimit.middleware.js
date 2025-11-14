/**
 * Rate Limit Middleware
 * Limits message sending rate per session to avoid WhatsApp bans
 */

// Store message queues per session
// Map<sessionId, Array<{ timestamp, resolve, reject }>>
const messageQueues = new Map();

// Store last message timestamps per session
// Map<sessionId, timestamp>
const lastMessageTime = new Map();

// Configuration
const RATE_LIMIT_MESSAGES = parseInt(process.env.RATE_LIMIT_MESSAGES) || 50; // messages per window
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000; // 60 seconds

/**
 * Rate limit middleware for message sending
 * Ensures max RATE_LIMIT_MESSAGES messages per RATE_LIMIT_WINDOW per session
 */
export function rateLimitMessages(req, res, next) {
  const sessionId = req.params.id;

  if (!sessionId) {
    return next(); // No session ID, let validation handle it
  }

  // Get or create queue for this session
  if (!messageQueues.has(sessionId)) {
    messageQueues.set(sessionId, []);
  }

  const queue = messageQueues.get(sessionId);
  const now = Date.now();

  // Clean old messages from queue (older than window)
  const windowStart = now - RATE_LIMIT_WINDOW;
  const activeMessages = queue.filter((msg) => msg.timestamp > windowStart);
  messageQueues.set(sessionId, activeMessages);

  // Check if rate limit exceeded
  if (activeMessages.length >= RATE_LIMIT_MESSAGES) {
    // Calculate when next message can be sent
    const oldestMessage = activeMessages[0];
    const waitTime = oldestMessage.timestamp + RATE_LIMIT_WINDOW - now;

    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Max ${RATE_LIMIT_MESSAGES} messages per ${RATE_LIMIT_WINDOW / 1000} seconds.`,
      retryAfter: Math.ceil(waitTime / 1000), // seconds
      currentCount: activeMessages.length,
      limit: RATE_LIMIT_MESSAGES,
    });
  }

  // Add current message to queue
  activeMessages.push({
    timestamp: now,
  });
  messageQueues.set(sessionId, activeMessages);

  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MESSAGES);
  res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MESSAGES - activeMessages.length);
  res.setHeader('X-RateLimit-Reset', new Date(windowStart + RATE_LIMIT_WINDOW).toISOString());

  // Add minimum delay between messages (anti-spam)
  const lastTime = lastMessageTime.get(sessionId) || 0;
  const minDelay = 1000; // 1 second minimum between messages
  const timeSinceLastMessage = now - lastTime;

  if (timeSinceLastMessage < minDelay) {
    const delayNeeded = minDelay - timeSinceLastMessage;
    
    // Small delay to avoid spam
    setTimeout(() => {
      lastMessageTime.set(sessionId, Date.now());
      next();
    }, delayNeeded);
  } else {
    lastMessageTime.set(sessionId, now);
    next();
  }
}

/**
 * Get rate limit stats for a session
 * @param {string} sessionId
 * @returns {Object}
 */
export function getRateLimitStats(sessionId) {
  const queue = messageQueues.get(sessionId) || [];
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  const activeMessages = queue.filter((msg) => msg.timestamp > windowStart);

  return {
    currentCount: activeMessages.length,
    limit: RATE_LIMIT_MESSAGES,
    remaining: RATE_LIMIT_MESSAGES - activeMessages.length,
    windowSeconds: RATE_LIMIT_WINDOW / 1000,
    resetAt: new Date(windowStart + RATE_LIMIT_WINDOW).toISOString(),
  };
}

/**
 * Clear rate limit for a session (admin function)
 * @param {string} sessionId
 */
export function clearRateLimit(sessionId) {
  messageQueues.delete(sessionId);
  lastMessageTime.delete(sessionId);
  console.log(`🧹 Rate limit cleared for session ${sessionId}`);
}

/**
 * Cleanup old queues (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  for (const [sessionId, queue] of messageQueues.entries()) {
    const activeMessages = queue.filter((msg) => msg.timestamp > windowStart);
    
    if (activeMessages.length === 0) {
      messageQueues.delete(sessionId);
    } else {
      messageQueues.set(sessionId, activeMessages);
    }
  }

  // Clean last message times older than 1 hour
  for (const [sessionId, timestamp] of lastMessageTime.entries()) {
    if (now - timestamp > 3600000) {
      lastMessageTime.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export default {
  rateLimitMessages,
  getRateLimitStats,
  clearRateLimit,
  cleanupRateLimits,
};
