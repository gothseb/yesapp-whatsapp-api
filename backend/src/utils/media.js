import axios from 'axios';
import mime from 'mime-types';

/**
 * Media Utilities
 * Handle media download and conversion
 */

/**
 * Download image from URL and convert to base64
 * @param {string} url - Image URL
 * @returns {Promise<Object>} { data: base64, mimetype, filename }
 */
export async function downloadImageAsBase64(url) {
  try {
    console.log(`📥 Downloading image from: ${url}`);

    // Download image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 16 * 1024 * 1024, // 16MB max
      headers: {
        'User-Agent': 'YesApp-WhatsApp-API/1.0',
      },
    });

    // Convert to base64
    const base64 = Buffer.from(response.data).toString('base64');

    // Get mimetype from response headers or URL
    let mimetype = response.headers['content-type'];
    if (!mimetype || mimetype === 'application/octet-stream') {
      // Try to guess from URL
      mimetype = mime.lookup(url) || 'image/jpeg';
    }

    // Extract filename from URL
    const urlParts = new URL(url);
    let filename = urlParts.pathname.split('/').pop() || 'image';
    
    // Add extension if missing
    if (!filename.includes('.')) {
      const ext = mime.extension(mimetype);
      filename = `${filename}.${ext || 'jpg'}`;
    }

    console.log(`   ✅ Downloaded: ${filename} (${mimetype}, ${(base64.length / 1024).toFixed(2)} KB)`);

    return {
      data: base64,
      mimetype,
      filename,
    };
  } catch (error) {
    console.error(`   ❌ Failed to download image:`, error.message);
    
    if (error.code === 'ENOTFOUND') {
      throw new Error('Image URL not found or unreachable');
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error('Image download timeout (max 30s)');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Image not found (404)');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Access to image forbidden (403)');
    }
    
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Validate image URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get media type from mimetype
 * @param {string} mimetype
 * @returns {string} 'image', 'video', 'audio', or 'document'
 */
export function getMediaType(mimetype) {
  if (!mimetype) return 'document';
  
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  
  return 'document';
}
