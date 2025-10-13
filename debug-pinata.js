// Debug script to test Pinata configuration
const {
  PINATA_CONFIG,
  validatePinataConfig,
} = require('./lib/pinata-config.ts');

console.log('=== Pinata Configuration Debug ===');
console.log('JWT configured:', !!PINATA_CONFIG.JWT);
console.log('Gateway configured:', !!PINATA_CONFIG.GATEWAY);
console.log('JWT length:', PINATA_CONFIG.JWT?.length || 0);
console.log('Gateway:', PINATA_CONFIG.GATEWAY);
console.log('Config valid:', validatePinataConfig());

// Test environment variables directly
console.log('\n=== Environment Variables ===');
console.log(
  'EXPO_PUBLIC_PINATA_JWT:',
  process.env.EXPO_PUBLIC_PINATA_JWT ? 'SET' : 'NOT SET'
);
console.log(
  'EXPO_PUBLIC_PINATA_GATEWAY:',
  process.env.EXPO_PUBLIC_PINATA_GATEWAY || 'NOT SET'
);
