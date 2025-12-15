'use client';

import { useState } from 'react';
import styles from './Gallery.module.css';
import MediaCard from '@/components/MediaCard';
import MediaModal from '@/components/MediaModal';
import { shouldHideMedia } from '@/lib/mediaService';

export default function Gallery({ mediaFiles, votes, onVoteUpdate }) {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Filter out media with 2+ vetos
  // mediaFiles can be either strings (filenames) or objects with {filename, url}
  const visibleMedia = mediaFiles.filter((item) => {
    const filename = typeof item === 'string' ? item : item.filename;
    const mediaVotes = votes[filename];
    return !mediaVotes || !shouldHideMedia(mediaVotes.vetos);
  });

  const handleCardClick = (item) => {
    setSelectedMedia(item);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const handleVoteUpdate = (filename, newVotes) => {
    onVoteUpdate(filename, newVotes);
  };

  const getFilename = (item) => typeof item === 'string' ? item : item.filename;
  const getUrl = (item) => typeof item === 'string' ? null : item.url;

  if (visibleMedia.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📷</div>
        <h2>No media available</h2>
        <p>All media items have been vetoed or there are no files in the gallery. Upload some media to get started!</p>
      </div>
    );
  }

  const selectedFilename = selectedMedia ? getFilename(selectedMedia) : null;
  const selectedUrl = selectedMedia ? getUrl(selectedMedia) : null;

  return (
    <>
      <div className={styles.gallery}>
        {visibleMedia.map((item) => {
          const filename = getFilename(item);
          const url = getUrl(item);
          return (
            <MediaCard
              key={filename}
              filename={filename}
              url={url}
              votes={votes[filename]}
              onClick={() => handleCardClick(item)}
            />
          );
        })}
      </div>

      {selectedMedia && (
        <MediaModal
          filename={selectedFilename}
          url={selectedUrl}
          votes={votes[selectedFilename] || { upvotes: 0, downvotes: 0, vetos: 0 }}
          onClose={handleCloseModal}
          onVoteUpdate={handleVoteUpdate}
        />
      )}
    </>
  );
}
