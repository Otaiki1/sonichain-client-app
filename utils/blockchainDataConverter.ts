/**
 * Blockchain Data Converter Utilities
 *
 * Converts raw blockchain submission data to app-friendly VoiceBlock format
 * with full Supabase URLs for audio playback
 */

import { VoiceBlock } from '@/types';
import * as ContractUtils from '@/lib/contract-utils';

/**
 * Shorten a Stacks principal address for display
 */
function shortenPrincipal(principal: string): string {
  if (!principal || typeof principal !== 'string') return 'Unknown';
  if (principal.length <= 12) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}

/**
 * Convert Supabase storage path to full public URL
 * @param path - Storage path like "uploads/xxx.m4a"
 * @param supabaseUrl - Your Supabase project URL
 * @param bucketName - Storage bucket name (default: 'audio-files')
 * @returns Full public URL
 */
export function getSupabasePublicUrl(
  path: string,
  supabaseUrl?: string,
  bucketName: string = 'audio-files'
): string {
  // Use environment variable if not provided
  const baseUrl = supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';

  if (!baseUrl) {
    console.warn('⚠️ Supabase URL not configured');
    return path; // Return path as-is if no URL configured
  }

  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
}

/**
 * Fetch username for a Stacks address
 * @param address - Stacks principal address
 * @returns Username if registered, otherwise shortened address
 */
async function fetchUsername(address: string): Promise<string> {
  try {
    console.log('👤 Fetching username for address:', address);
    const userData = await ContractUtils.getUser(address);

    if (userData && userData.value) {
      const username =
        userData.value.username?.value || userData.value.username;
      if (username && typeof username === 'string') {
        console.log('✅ Found username:', username);
        return username;
      }
    }

    console.log('⚠️ No username found, using shortened address');
    return shortenPrincipal(address);
  } catch (error) {
    console.warn('⚠️ Error fetching username:', error);
    return shortenPrincipal(address);
  }
}

/**
 * Convert raw blockchain submission to VoiceBlock format
 *
 * @param submission - Raw submission from blockchain with nested structure
 * @param fetchUsernames - Whether to fetch actual usernames from blockchain (default: true)
 * @returns VoiceBlock with flat structure and full audio URL
 *
 * @example
 * // Input (raw blockchain data):
 * {
 *   "id": "2",
 *   "uri": { "type": "(string-ascii 55)", "value": "uploads/xxx.m4a" },
 *   "contributor": { "type": "principal", "value": "ST322M..." },
 *   "vote-count": { "type": "uint", "value": "0" }
 * }
 *
 * // Output (VoiceBlock):
 * {
 *   id: "2",
 *   username: "john_doe",  // ✅ Actual username fetched from blockchain!
 *   audioUri: "https://xyz.supabase.co/storage/v1/object/public/audio-files/uploads/xxx.m4a",
 *   duration: 30,
 *   votes: 0
 * }
 */
export async function convertBlockchainSubmissionToVoiceBlock(
  submission: any,
  fetchUsernames: boolean = true
): Promise<VoiceBlock> {
  console.log('🔄 Converting blockchain submission:', submission);

  // Extract URI (handle nested structure)
  const blockchainUri =
    submission.uri?.value || // Nested: { type: "...", value: "..." }
    submission.uri || // Direct: "uploads/..."
    submission.audioUri || // Already converted
    '';

  console.log('🔍 Extracted URI:', blockchainUri);

  // Convert Supabase storage path to full URL
  let audioUri = blockchainUri;
  if (blockchainUri && typeof blockchainUri === 'string') {
    if (blockchainUri.startsWith('uploads/')) {
      // It's a Supabase storage path - convert to full URL
      audioUri = getSupabasePublicUrl(blockchainUri);
      console.log('✅ Converted to Supabase URL:', audioUri);
    } else if (blockchainUri.startsWith('http')) {
      // Already a full URL - use as is
      audioUri = blockchainUri;
    } else if (
      blockchainUri.startsWith('Qm') ||
      blockchainUri.startsWith('baf')
    ) {
      // IPFS hash - keep as is (will be handled by IPFS enrichment)
      audioUri = blockchainUri;
    }
  }

  // Extract contributor (handle nested structure)
  const contributor =
    submission.contributor?.value || submission.contributor || '';

  // Extract vote count (handle nested structure)
  const voteCount =
    submission['vote-count']?.value ||
    submission['vote-count'] ||
    submission.votes ||
    0;

  // Extract submission ID (handle nested structure)
  const submissionId =
    submission.id ||
    submission['submission-id']?.value ||
    submission['submission-id'] ||
    '0';

  // Fetch actual username if enabled
  let displayName = shortenPrincipal(contributor);
  if (fetchUsernames && contributor) {
    displayName = await fetchUsername(contributor);
  }

  const voiceBlock: VoiceBlock = {
    id: submissionId.toString(),
    username: displayName,
    audioUri: audioUri,
    audioCid:
      blockchainUri.startsWith('Qm') || blockchainUri.startsWith('baf')
        ? blockchainUri
        : undefined,
    duration: submission.duration || 30, // Default to 30 seconds, will be updated when audio loads
    timestamp: new Date().toISOString(),
    votes: Number(voteCount),
  };

  console.log('✅ Converted to VoiceBlock:', voiceBlock);

  return voiceBlock;
}

/**
 * Convert array of blockchain submissions to VoiceBlocks
 *
 * @param submissions - Array of raw blockchain submissions
 * @param fetchUsernames - Whether to fetch actual usernames from blockchain (default: true)
 * @returns Array of VoiceBlocks ready for display
 */
export async function convertBlockchainSubmissions(
  submissions: any[],
  fetchUsernames: boolean = true
): Promise<VoiceBlock[]> {
  if (!Array.isArray(submissions)) {
    console.warn('⚠️ Invalid submissions array:', submissions);
    return [];
  }

  console.log(`🔄 Converting ${submissions.length} blockchain submissions...`);
  console.log(`👤 Fetching usernames: ${fetchUsernames ? 'YES' : 'NO'}`);

  // Convert all submissions in parallel for better performance
  const voiceBlocks = await Promise.all(
    submissions.map(async (submission, index) => {
      console.log(
        `\n🔄 Processing submission ${index + 1}/${submissions.length}`
      );
      return await convertBlockchainSubmissionToVoiceBlock(
        submission,
        fetchUsernames
      );
    })
  );

  console.log(`✅ Converted ${voiceBlocks.length} submissions to VoiceBlocks`);

  return voiceBlocks;
}
