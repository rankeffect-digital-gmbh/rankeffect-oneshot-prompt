import { storage } from './firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
} from 'firebase/storage';

const STORAGE_FOLDER = 'media';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<{filename: string, url: string}>}
 */
export async function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${filename}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            filename,
            url,
            originalName: file.name,
            type: file.type,
            size: file.size,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload multiple files to Firebase Storage
 * @param {FileList|File[]} files - Files to upload
 * @param {function} onProgress - Callback for overall progress
 * @param {function} onFileComplete - Callback when a file completes
 * @returns {Promise<Array<{filename: string, url: string}>>}
 */
export async function uploadMultipleMedia(files, onProgress, onFileComplete) {
  const results = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  for (const file of files) {
    try {
      const result = await uploadMedia(file, (fileProgress) => {
        // Calculate overall progress
        const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100;
        if (onProgress) {
          onProgress(overallProgress);
        }
      });
      
      results.push(result);
      completedFiles++;
      
      if (onFileComplete) {
        onFileComplete(result, completedFiles, totalFiles);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }

  return results;
}

/**
 * Get all media files from Firebase Storage
 * @returns {Promise<Array<{filename: string, url: string}>>}
 */
export async function getAllStorageMedia() {
  try {
    const listRef = ref(storage, STORAGE_FOLDER);
    const result = await listAll(listRef);
    
    const mediaFiles = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          filename: itemRef.name,
          url,
          isFromStorage: true,
        };
      })
    );
    
    return mediaFiles;
  } catch (error) {
    console.error('Error fetching storage media:', error);
    return [];
  }
}

/**
 * Delete a media file from Firebase Storage
 * @param {string} filename - The filename to delete
 */
export async function deleteMediaFromStorage(filename) {
  try {
    const fileRef = ref(storage, `${STORAGE_FOLDER}/${filename}`);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

/**
 * Check if a file is a valid media type (image or video)
 * @param {File} file
 * @returns {boolean}
 */
export function isValidMediaType(file) {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  return validTypes.includes(file.type);
}

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is a video based on filename
 * @param {string} filename
 * @returns {boolean}
 */
export function isVideoFile(filename) {
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi'];
  return videoExtensions.includes(getFileExtension(filename));
}
