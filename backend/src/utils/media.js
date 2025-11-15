import https from 'https';
import http from 'http';
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
  return new Promise((resolve, reject) => {
    try {
      console.log(`📥 Downloading image from: ${url}`);

      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        headers: {
          'User-Agent': 'YesApp-WhatsApp-API/1.0',
        },
        timeout: 30000,
      };

      const req = client.get(url, options, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return downloadImageAsBase64(response.headers.location)
            .then(resolve)
            .catch(reject);
        }

        // Handle errors
        if (response.statusCode === 404) {
          return reject(new Error('Image not found (404)'));
        }
        if (response.statusCode === 403) {
          return reject(new Error('Access to image forbidden (403)'));
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }

        const chunks = [];
        let totalSize = 0;
        const maxSize = 16 * 1024 * 1024; // 16MB

        response.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > maxSize) {
            req.destroy();
            return reject(new Error('Image too large (max 16MB)'));
          }
          chunks.push(chunk);
        });

        response.on('end', () => {
          try {
            // Convert to base64
            const buffer = Buffer.concat(chunks);
            const base64 = buffer.toString('base64');

            // Get mimetype from response headers or URL
            let mimetype = response.headers['content-type'];
            if (!mimetype || mimetype === 'application/octet-stream') {
              mimetype = mime.lookup(url) || 'image/jpeg';
            }

            // Extract filename from URL
            let filename = urlObj.pathname.split('/').pop() || 'image';
            
            // Add extension if missing
            if (!filename.includes('.')) {
              const ext = mime.extension(mimetype);
              filename = `${filename}.${ext || 'jpg'}`;
            }

            console.log(`   ✅ Downloaded: ${filename} (${mimetype}, ${(base64.length / 1024).toFixed(2)} KB)`);

            resolve({
              data: base64,
              mimetype,
              filename,
            });
          } catch (error) {
            reject(new Error(`Failed to process image: ${error.message}`));
          }
        });

        response.on('error', (error) => {
          reject(new Error(`Download error: ${error.message}`));
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Image download timeout (max 30s)'));
      });

      req.on('error', (error) => {
        if (error.code === 'ENOTFOUND') {
          reject(new Error('Image URL not found or unreachable'));
        } else if (error.code === 'ETIMEDOUT') {
          reject(new Error('Image download timeout (max 30s)'));
        } else {
          reject(new Error(`Failed to download image: ${error.message}`));
        }
      });

      req.end();
    } catch (error) {
      reject(new Error(`Invalid URL: ${error.message}`));
    }
  });
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
