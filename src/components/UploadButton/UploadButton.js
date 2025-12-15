'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './UploadButton.module.css';

// Valid media types for upload
function isValidMediaType(file) {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  // Also check by extension for HEIC files which may not have correct mime type
  const ext = file.name.toLowerCase().split('.').pop();
  const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'mp4', 'webm', 'mov'];
  return validTypes.includes(file.type) || validExts.includes(ext);
}

// Upload a single file to SharePoint via our API
async function uploadToSharePoint(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/sharepoint/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Upload failed');
  }
  
  const data = await response.json();
  return {
    ...data.file,
    originalName: file.name,
  };
}

// Upload multiple files
async function uploadMultipleToSharePoint(files, onProgress, onFileComplete) {
  const results = [];
  const totalFiles = files.length;
  let completedFiles = 0;

  for (const file of files) {
    try {
      const result = await uploadToSharePoint(file, (fileProgress) => {
        const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100;
        if (onProgress) onProgress(overallProgress);
      });
      
      results.push(result);
      completedFiles++;
      
      if (onProgress) onProgress((completedFiles / totalFiles) * 100);
      if (onFileComplete) onFileComplete(result, completedFiles, totalFiles);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return results;
}

export default function UploadButton({ onUploadComplete, disabled = true }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter(isValidMediaType);
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files (JPEG, PNG, GIF, WebP, HEIC, MP4, WebM, MOV)');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadResults([]);
    setShowModal(true);

    try {
      const results = await uploadMultipleToSharePoint(
        validFiles,
        (overallProgress) => {
          setProgress(Math.round(overallProgress));
        },
        (result, completed, total) => {
          setUploadResults((prev) => [...prev, result]);
        }
      );

      if (onUploadComplete) {
        onUploadComplete(results);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Some files failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const closeModal = () => {
    if (!isUploading) {
      setShowModal(false);
      setUploadResults([]);
      setProgress(0);
    }
  };

  return (
    <>
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className={styles.hiddenInput}
          disabled={disabled}
        />
        
        <div className={styles.uploadContent}>
          <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className={styles.uploadText}>
            {disabled ? 'Upload temporarily unavailable' : isDragging ? 'Drop files here' : 'Click or drag files to upload'}
          </span>
          <span className={styles.uploadHint}>
            {disabled ? 'SharePoint connection pending admin approval' : 'Supports images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM)'}
          </span>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{isUploading ? 'Uploading...' : 'Upload Complete'}</h3>
              {!isUploading && (
                <button className={styles.closeButton} onClick={closeModal}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className={styles.modalContent}>
              {isUploading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{progress}%</span>
                </div>
              )}
              
              <div className={styles.resultsList}>
                {uploadResults.map((result, index) => (
                  <div key={index} className={styles.resultItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className={styles.fileName}>{result.originalName}</span>
                  </div>
                ))}
              </div>
            </div>

            {!isUploading && uploadResults.length > 0 && (
              <div className={styles.modalFooter}>
                <button className={styles.doneButton} onClick={closeModal}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
