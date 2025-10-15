import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Storage Hook for Audio Uploads
 *
 * Uploads audio files to Supabase Storage and returns public URLs
 * to be stored on the blockchain.
 */

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UploadResult {
  url: string; // Public URL to access the file
  path: string; // Storage path in Supabase
  filename: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const useSupabase = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 100,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate Supabase configuration
   */
  const validateConfig = (): boolean => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError(
        'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env'
      );
      return false;
    }
    return true;
  };

  /**
   * Upload audio file to Supabase Storage
   * @param audioUri - Local file URI (e.g., file:///path/to/audio.m4a)
   * @param filename - Desired filename for storage
   * @param bucketName - Supabase storage bucket name (default: 'audio-files')
   * @returns Upload result with public URL
   */
  const uploadAudio = async (
    audioUri: string,
    filename: string,
    bucketName: string = 'audio-files'
  ): Promise<UploadResult | null> => {
    if (!validateConfig()) {
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      console.log('📤 Uploading audio to Supabase Storage...');
      console.log('  - Audio URI:', audioUri);
      console.log('  - Filename:', filename);
      console.log('  - Bucket:', bucketName);

      // Convert file URI to ArrayBuffer (recommended by Supabase)
      const arrayBuffer = await fetch(audioUri).then((res) =>
        res.arrayBuffer()
      );

      // Generate unique path with timestamp
      const timestamp = Date.now();
      const storagePath = `uploads/${timestamp}-${filename}`;

      console.log('  - Storage path:', storagePath);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, arrayBuffer, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        setError(uploadError.message);
        return null;
      }

      console.log('✅ Upload successful:', data);

      // Construct public URL (for public buckets)
      // Alternative method: const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`;
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      const publicUrl = publicUrlData.publicUrl;

      console.log('✅ Public URL:', publicUrl);

      setUploadProgress({ loaded: 100, total: 100, percentage: 100 });

      return {
        url: publicUrl,
        path: storagePath,
        filename: filename,
      };
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Failed to upload to Supabase');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Delete audio file from Supabase Storage
   * @param path - Storage path to delete
   * @param bucketName - Supabase storage bucket name
   */
  const deleteAudio = async (
    path: string,
    bucketName: string = 'audio-files'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucketName).remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      console.log('✅ File deleted:', path);
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  };

  /**
   * Get public URL for a file
   * @param path - Storage path
   * @param bucketName - Supabase storage bucket name
   */
  const getPublicUrl = (
    path: string,
    bucketName: string = 'audio-files'
  ): string => {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    isUploading,
    uploadProgress,
    error,

    // Methods
    uploadAudio,
    deleteAudio,
    getPublicUrl,
    clearError,
  };
};
