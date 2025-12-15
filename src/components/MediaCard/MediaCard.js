'use client';

import Image from 'next/image';
import styles from './MediaCard.module.css';
import { calculateQuota } from '@/lib/mediaService';

export default function MediaCard({ filename, votes, onClick }) {
  const isVideo = filename.toLowerCase().endsWith('.mp4');
  const mediaPath = `/media/${filename}`;
  
  const quota = votes ? calculateQuota(votes.upvotes, votes.downvotes) : null;
  const totalVotes = votes ? votes.upvotes + votes.downvotes : 0;
  
  const formatQuota = (q) => {
    if (q === null) return 'No votes';
    return `${Math.round(q * 100)}%`;
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.mediaContainer}>
        {isVideo ? (
          <>
            <video
              src={mediaPath}
              className={styles.media}
              muted
              playsInline
              preload="metadata"
            />
            <div className={styles.playOverlay}>
              <svg
                className={styles.playIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </>
        ) : (
          <Image
            src={mediaPath}
            alt={filename}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.media}
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      
      <div className={styles.info}>
        <div className={styles.quotaBadge} data-quota={quota !== null ? (quota >= 0.5 ? 'positive' : 'negative') : 'neutral'}>
          {formatQuota(quota)}
        </div>
        {totalVotes > 0 && (
          <span className={styles.voteCount}>
            {votes.upvotes}↑ {votes.downvotes}↓
          </span>
        )}
      </div>
      
      {votes && votes.vetos > 0 && (
        <div className={styles.vetoWarning}>
          {votes.vetos} veto{votes.vetos > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
