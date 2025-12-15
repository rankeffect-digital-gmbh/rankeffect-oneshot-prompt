'use client';

import { useState } from 'react';
import styles from './Gallery.module.css';
import MediaCard from '@/components/MediaCard';
import MediaModal from '@/components/MediaModal';
import { shouldHideMedia } from '@/lib/mediaService';

export default function Gallery({ mediaFiles, votes, onVoteUpdate }) {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Filter out media with 2+ vetos
  const visibleMedia = mediaFiles.filter((filename) => {
    const mediaVotes = votes[filename];
    return !mediaVotes || !shouldHideMedia(mediaVotes.vetos);
  });

  const handleCardClick = (filename) => {
    setSelectedMedia(filename);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const handleVoteUpdate = (filename, newVotes) => {
    onVoteUpdate(filename, newVotes);
  };

  if (visibleMedia.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📷</div>
        <h2>No media available</h2>
        <p>All media items have been vetoed or there are no files in the gallery.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.gallery}>
        {visibleMedia.map((filename) => (
          <MediaCard
            key={filename}
            filename={filename}
            votes={votes[filename]}
            onClick={() => handleCardClick(filename)}
          />
        ))}
      </div>

      {selectedMedia && (
        <MediaModal
          filename={selectedMedia}
          votes={votes[selectedMedia] || { upvotes: 0, downvotes: 0, vetos: 0 }}
          onClose={handleCloseModal}
          onVoteUpdate={handleVoteUpdate}
        />
      )}
    </>
  );
}
