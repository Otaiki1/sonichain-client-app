/**
 * Quick test to verify Pinata configuration
 * Run this to check if your API keys are working
 */

import {
  PINATA_CONFIG,
  validatePinataConfig,
  getPinataUrl,
} from './lib/pinata-config';

console.log('🔍 Testing Pinata Configuration...\n');

// Check if config is valid
const isValid = validatePinataConfig();

if (isValid) {
  console.log('✅ Pinata configuration is valid!\n');

  console.log('📋 Configuration Details:');
  console.log('   JWT:', PINATA_CONFIG.JWT ? '✅ Set' : '❌ Missing');
  console.log('   JWT Length:', PINATA_CONFIG.JWT.length, 'characters');
  console.log('   Gateway:', PINATA_CONFIG.GATEWAY || '❌ Missing');
  console.log('   API URL:', PINATA_CONFIG.API_URL);
  console.log('   Upload URL:', PINATA_CONFIG.UPLOAD_URL);

  console.log('\n🔗 Test Gateway URL:');
  const testCid = 'bafkreidvbhs33ighmljlvr7zbv2ywwzcmp5adtf4kqvlly67cy56bdtmve';
  const testUrl = getPinataUrl(testCid);
  console.log('   ', testUrl);

  console.log('\n✅ Ready to upload to IPFS!');
  console.log('   Use: import { usePinata } from "@/hooks/usePinata"');
} else {
  console.log('❌ Pinata configuration is incomplete!');
  console.log('\nPlease check:');
  console.log('1. .env file exists in project root');
  console.log('2. EXPO_PUBLIC_PINATA_JWT is set');
  console.log('3. EXPO_PUBLIC_PINATA_GATEWAY is set');
  console.log('4. Dev server was restarted after updating .env');
}

console.log('\n💡 Next Steps:');
console.log('1. Restart dev server: npx expo start --clear');
console.log('2. Check console for any errors');
console.log('3. Try uploading: See PINATA_INTEGRATION_EXAMPLE.tsx');
console.log('4. Documentation: See PINATA_SETUP.md');
