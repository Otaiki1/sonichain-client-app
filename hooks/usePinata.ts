import { useState } from 'react';
import { Alert } from 'react-native';
import {
  PINATA_CONFIG,
  getPinataUrl,
  validatePinataConfig,
} from '@/lib/pinata-config';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface PinataUploadResponse {
  id: string;
  group_id: string | null;
  name: string;
  cid: string;
  created_at: string;
  size: number;
  number_of_files: number;
  mime_type: string;
  vectorized: boolean;
  network: string;
}

interface AudioMetadata {
  storyId: string;
  username?: string;
  duration?: number;
  timestamp?: string;
  blockNumber?: number;
  walletAddress?: string;
  [key: string]: any; // Allow any additional fields
}

/**
 * Custom hook for Pinata/IPFS uploads
 * Handles audio files and metadata
 */
export function usePinata() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload audio file to IPFS via Pinata
   * @param audioUri - Local URI of the audio file
   * @param filename - Name for the file (e.g., "story-block-1.m4a")
   * @returns IPFS CID and gateway URL
   */
  async function uploadAudio(
    audioUri: string,
    filename: string = 'audio.m4a'
  ): Promise<{ cid: string; url: string; ipfsUri: string } | null> {
    if (!validatePinataConfig()) {
      setError('Pinata not configured. Please add API keys.');
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      // Debug: Log the request details
      console.log('🔧 Uploading audio to Pinata...');
      console.log('Audio URI:', audioUri);
      console.log('Filename:', filename);
      console.log('Upload URL:', `${PINATA_CONFIG.UPLOAD_URL}/v3/files`);
      console.log('JWT configured:', !!PINATA_CONFIG.JWT);

      // Create FormData for the upload
      const formData = new FormData();

      // For React Native, append file directly using the URI
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: filename,
      } as any);

      // Optional: Add metadata
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          app: 'SoniChain',
          type: 'audio',
          uploadedAt: new Date().toISOString(),
        },
      });
      formData.append('pinataMetadata', metadata);

      // Upload to Pinata
      const uploadResponse = await fetch(
        `${PINATA_CONFIG.UPLOAD_URL}/v3/files`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PINATA_CONFIG.JWT}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Pinata upload error response:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await uploadResponse.json();

      // Debug: Log the response to see what we're getting
      console.log(
        'Pinata file upload response:',
        JSON.stringify(data, null, 2)
      );
      console.log('Response keys:', Object.keys(data));
      console.log('Has IpfsHash:', 'IpfsHash' in data);
      console.log('Has hash:', 'hash' in data);
      console.log('Has cid:', 'cid' in data);

      setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
      setIsUploading(false);

      // Try multiple possible field names for the CID, including nested data structure
      const cid =
        data.IpfsHash ||
        data.ipfsHash ||
        data.cid ||
        data.hash ||
        data.ipfs_hash ||
        data.data?.IpfsHash ||
        data.data?.ipfsHash ||
        data.data?.cid ||
        data.data?.hash ||
        data.data?.ipfs_hash;

      if (!cid) {
        console.error('Available response fields:', Object.keys(data));
        if (data.data) {
          console.error('Available data fields:', Object.keys(data.data));
        }
        throw new Error(
          `No CID returned from Pinata file upload. Response: ${JSON.stringify(
            data
          )}`
        );
      }

      return {
        cid: cid,
        url: getPinataUrl(cid),
        ipfsUri: `ipfs://${cid}`,
      };
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setError(err.message || 'Failed to upload audio');
      setIsUploading(false);
      Alert.alert('Upload Failed', 'Could not upload audio to IPFS');
      return null;
    }
  }

  /**
   * Upload metadata (JSON) to IPFS via Pinata
   * @param metadata - Object containing metadata
   * @param filename - Name for the metadata file
   * @returns IPFS CID and gateway URL
   */
  async function uploadMetadata(
    metadata: AudioMetadata,
    filename: string = 'metadata.json'
  ): Promise<{ cid: string; url: string; ipfsUri: string } | null> {
    if (!validatePinataConfig()) {
      setError('Pinata not configured. Please add API keys.');
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Debug: Log the request details
      console.log('🔧 Uploading metadata to Pinata...');
      console.log('API URL:', `${PINATA_CONFIG.API_URL}/pinning/pinJSONToIPFS`);
      console.log('JWT configured:', !!PINATA_CONFIG.JWT);
      console.log('Metadata:', JSON.stringify(metadata, null, 2));

      // For React Native, we'll use the JSON API instead of file upload
      const uploadResponse = await fetch(
        `${PINATA_CONFIG.API_URL}/pinning/pinJSONToIPFS`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_CONFIG.JWT}`,
          },
          body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
              name: filename,
              keyvalues: {
                app: 'SoniChain',
                type: 'metadata',
                uploadedAt: new Date().toISOString(),
              },
            },
            pinataOptions: {
              cidVersion: 0,
            },
          }),
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await uploadResponse.json();

      // Debug: Log the response to see what we're getting
      console.log('Pinata JSON API response:', JSON.stringify(data, null, 2));
      console.log('Response keys:', Object.keys(data));
      console.log('Has IpfsHash:', 'IpfsHash' in data);
      console.log('Has hash:', 'hash' in data);
      console.log('Has cid:', 'cid' in data);

      setIsUploading(false);

      // The JSON API returns a different structure than file upload API, including nested data structure
      const cid =
        data.IpfsHash ||
        data.ipfsHash ||
        data.cid ||
        data.hash ||
        data.ipfs_hash ||
        data.data?.IpfsHash ||
        data.data?.ipfsHash ||
        data.data?.cid ||
        data.data?.hash ||
        data.data?.ipfs_hash;

      if (!cid) {
        console.error('Available response fields:', Object.keys(data));
        if (data.data) {
          console.error('Available data fields:', Object.keys(data.data));
        }
        throw new Error(
          `No CID returned from Pinata JSON API. Response: ${JSON.stringify(
            data
          )}`
        );
      }

      return {
        cid: cid,
        url: getPinataUrl(cid),
        ipfsUri: `ipfs://${cid}`,
      };
    } catch (err: any) {
      console.error('Metadata upload error:', err);
      setError(err.message || 'Failed to upload metadata');
      setIsUploading(false);
      Alert.alert('Upload Failed', 'Could not upload metadata to IPFS');
      return null;
    }
  }

  /**
   * Upload both audio and metadata together
   * Returns both CIDs
   */
  async function uploadAudioWithMetadata(
    audioUri: string,
    metadata: AudioMetadata,
    audioFilename?: string,
    metadataFilename?: string
  ): Promise<{
    audioCid: string;
    audioUrl: string;
    metadataCid: string;
    metadataUrl: string;
  } | null> {
    try {
      // Upload audio first
      const audioResult = await uploadAudio(audioUri, audioFilename);
      if (!audioResult) {
        return null;
      }

      // Add audio CID to metadata
      const enrichedMetadata = {
        ...metadata,
        audioCid: audioResult.cid,
        audioUrl: audioResult.url,
      };

      // Upload metadata
      const metadataResult = await uploadMetadata(
        enrichedMetadata,
        metadataFilename
      );
      if (!metadataResult) {
        return null;
      }

      return {
        audioCid: audioResult.cid,
        audioUrl: audioResult.url,
        metadataCid: metadataResult.cid,
        metadataUrl: metadataResult.url,
      };
    } catch (err: any) {
      console.error('Combined upload error:', err);
      setError(err.message || 'Failed to upload');
      return null;
    }
  }

  /**
   * Retrieve content from IPFS via Pinata Gateway
   * @param cid - IPFS Content Identifier
   * @returns Content data
   */
  async function getFromIPFS(cid: string): Promise<any | null> {
    try {
      const url = getPinataUrl(cid);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch from IPFS');
      }

      // Try to parse as JSON first
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      // Otherwise return as blob/text
      return await response.blob();
    } catch (err: any) {
      console.error('IPFS fetch error:', err);
      setError(err.message || 'Failed to fetch from IPFS');
      return null;
    }
  }

  /**
   * Pin existing IPFS content by CID
   * @param cid - IPFS CID to pin
   * @param name - Optional name for the pin
   */
  async function pinByCid(cid: string, name?: string): Promise<boolean> {
    if (!validatePinataConfig()) {
      return false;
    }

    try {
      const response = await fetch(
        `${PINATA_CONFIG.API_URL}/pinning/pinByHash`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_CONFIG.JWT}`,
          },
          body: JSON.stringify({
            hashToPin: cid,
            pinataMetadata: name ? { name } : undefined,
          }),
        }
      );

      return response.ok;
    } catch (err: any) {
      console.error('Pin by CID error:', err);
      return false;
    }
  }

  /**
   * Reset error state
   */
  function clearError() {
    setError(null);
  }

  return {
    // State
    isUploading,
    uploadProgress,
    error,

    // Methods
    uploadAudio,
    uploadMetadata,
    uploadAudioWithMetadata,
    getFromIPFS,
    pinByCid,
    clearError,

    // Utilities
    getPinataUrl,
  };
}

export type { AudioMetadata, UploadProgress, PinataUploadResponse };
