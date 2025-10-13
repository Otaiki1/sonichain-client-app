/**
 * Pinata Configuration
 *
 * Setup:
 * 1. Go to https://app.pinata.cloud/developers/api-keys
 * 2. Create a new API key with Admin privileges
 * 3. Copy the JWT token
 * 4. Go to Gateways tab and copy your gateway domain
 * 5. Add to your environment variables
 */

export const PINATA_CONFIG = {
  // Get from Pinata dashboard -> API Keys
  JWT: process.env.EXPO_PUBLIC_PINATA_JWT || '',

  // Get from Pinata dashboard -> Gateways
  // Format: "example-gateway.mypinata.cloud"
  GATEWAY: process.env.EXPO_PUBLIC_PINATA_GATEWAY || '',

  // API endpoints
  API_URL: 'https://api.pinata.cloud',
  UPLOAD_URL: 'https://uploads.pinata.cloud',
};

// Debug logging
console.log('🔧 Pinata Config Debug:');
console.log('JWT configured:', !!PINATA_CONFIG.JWT);
console.log('Gateway configured:', !!PINATA_CONFIG.GATEWAY);
console.log('JWT length:', PINATA_CONFIG.JWT?.length || 0);
console.log('Gateway:', PINATA_CONFIG.GATEWAY);

/**
 * Pinata Gateway URL builder
 */
export function getPinataUrl(cid: string): string {
  return `https://${PINATA_CONFIG.GATEWAY}/ipfs/${cid}`;
}

/**
 * Validate Pinata configuration
 */
export function validatePinataConfig(): boolean {
  if (!PINATA_CONFIG.JWT) {
    console.error('❌ PINATA_JWT not configured');
    return false;
  }
  if (!PINATA_CONFIG.GATEWAY) {
    console.error('❌ PINATA_GATEWAY not configured');
    return false;
  }
  return true;
}
