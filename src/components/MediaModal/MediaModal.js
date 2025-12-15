'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import styles from './MediaModal.module.css';
import { calculateQuota, upvoteMedia, downvoteMedia, vetoMedia } from '@/lib/mediaService';
import { isVideoFile } from '@/lib/storageService';

export default function MediaModal({ filename, url, votes, onClose, onVoteUpdate }) {
  const [isVoting, setIsVoting] = useState(false);
  const [currentVotes, setCurrentVotes] = useState(votes);
  const [isPortrait, setIsPortrait] = useState(false);
  const imgRef = useRef(null);
  
  const isVideo = isVideoFile(filename);
  // Use provided URL (from Firebase Storage) or fallback to local path
  const mediaPath = url || `/media/${filename}`;
  
  const quota = currentVotes ? calculateQuota(currentVotes.upvotes, currentVotes.downvotes) : null;
  const totalVotes = currentVotes ? currentVotes.upvotes + currentVotes.downvotes : 0;

  const formatQuota = (q) => {
    if (q === null) return 'No votes yet';
    return `${Math.round(q * 100)}% positive`;
  };

  // Detect if image is portrait or landscape
  const handleImageLoad = (e) => {
    const img = e.target;
    if (img.naturalHeight > img.naturalWidth) {
      setIsPortrait(true);
    } else {
      setIsPortrait(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setCurrentVotes(votes);
  }, [votes]);

  const handleUpvote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const updatedVotes = await upvoteMedia(filename);
      setCurrentVotes(updatedVotes);
      onVoteUpdate(filename, updatedVotes);
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
    setIsVoting(false);
  };

  const handleDownvote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const updatedVotes = await downvoteMedia(filename);
      setCurrentVotes(updatedVotes);
      onVoteUpdate(filename, updatedVotes);
    } catch (error) {
      console.error('Failed to downvote:', error);
    }
    setIsVoting(false);
  };

  const handleVeto = async () => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const updatedVotes = await vetoMedia(filename);
      setCurrentVotes(updatedVotes);
      onVoteUpdate(filename, updatedVotes);
      
      // Close modal if this causes the item to be hidden
      if (updatedVotes.vetos >= 2) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to veto:', error);
    }
    setIsVoting(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={`${styles.modal} ${isPortrait ? styles.portrait : styles.landscape}`}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.mediaContainer}>
          {isVideo ? (
            <video
              src={mediaPath}
              className={styles.media}
              controls
              autoPlay
              playsInline
            />
          ) : (
            // Use img tag for external URLs (Firebase Storage)
            url ? (
              <img
                src={mediaPath}
                alt={filename}
                className={styles.media}
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                onLoad={handleImageLoad}
              />
            ) : (
              <img
                src={mediaPath}
                alt={filename}
                className={styles.media}
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                onLoad={handleImageLoad}
              />
            )
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.voteInfo}>
            <div className={styles.quotaDisplay} data-quota={quota !== null ? (quota >= 0.5 ? 'positive' : 'negative') : 'neutral'}>
              {formatQuota(quota)}
            </div>
            <div className={styles.voteDetails}>
              {totalVotes > 0 ? (
                <>
                  <span className={styles.upvoteCount}>{currentVotes.upvotes} upvotes</span>
                  <span className={styles.divider}>•</span>
                  <span className={styles.downvoteCount}>{currentVotes.downvotes} downvotes</span>
                </>
              ) : (
                <span>Be the first to vote!</span>
              )}
            </div>
            {currentVotes && currentVotes.vetos > 0 && (
              <div className={styles.vetoInfo}>
                ⚠️ {currentVotes.vetos} veto{currentVotes.vetos > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.voteButton} ${styles.upvoteButton}`}
              onClick={handleUpvote}
              disabled={isVoting}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              Upvote
            </button>

            <button
              className={`${styles.voteButton} ${styles.downvoteButton}`}
              onClick={handleDownvote}
              disabled={isVoting}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              Downvote
            </button>

            <button
              className={`${styles.voteButton} ${styles.vetoButton}`}
              onClick={handleVeto}
              disabled={isVoting}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93l14.14 14.14" />
              </svg>
              Veto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
