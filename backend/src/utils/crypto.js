import APIKeyModel from '../models/apikey.model.js';

/**
 * Generate and log API key on first startup
 * Accepts pre-configured API key via API_KEY environment variable
 */
export function ensureDefaultAPIKey() {
  // Check if any API keys exist
  if (APIKeyModel.hasKeys()) {
    console.log('🔑 API key(s) already exist');
    return;
  }

  console.log('');
  
  // Check if API_KEY is provided via environment variable
  const preConfiguredKey = process.env.API_KEY || process.env.VITE_API_KEY;
  
  if (preConfiguredKey) {
    console.log('🔑 Using pre-configured API key from environment...');
    
    // Create API key with the pre-configured value
    APIKeyModel.createWithKey(preConfiguredKey, 'default', ['read', 'write']);
    
    console.log('');
    console.log('━'.repeat(80));
    console.log('✅ API KEY CONFIGURED');
    console.log('━'.repeat(80));
    console.log('');
    console.log(`   ${preConfiguredKey}`);
    console.log('');
    console.log('━'.repeat(80));
    console.log('');
  } else {
    console.log('🔑 Generating default API key...');
    
    // Create default API key
    const apiKey = APIKeyModel.create('default', ['read', 'write']);

    console.log('');
    console.log('━'.repeat(80));
    console.log('🔐 API KEY GENERATED (SAVE THIS - IT WILL NOT BE SHOWN AGAIN)');
    console.log('━'.repeat(80));
    console.log('');
    console.log(`   ${apiKey.key}`);
    console.log('');
    console.log('━'.repeat(80));
    console.log('');
    console.log('💡 Use this key in the X-API-Key header for all API requests');
    console.log('💡 Store it safely - it cannot be retrieved later');
    console.log('');
  }
}

export default { ensureDefaultAPIKey };
