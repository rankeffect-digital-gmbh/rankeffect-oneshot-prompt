'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Gallery from '@/components/Gallery';
import { getAllMediaVotes } from '@/lib/mediaService';
import styles from './page.module.css';

// List of media files in the public/media folder
const MEDIA_FILES = [
  'WhatsApp Image 2025-12-05 at 11.01.42.jpeg',
  'WhatsApp Image 2025-12-05 at 11.01.45.jpeg',
  'WhatsApp Image 2025-12-05 at 11.01.50 (1).jpeg',
  'WhatsApp Image 2025-12-05 at 11.01.50 (2).jpeg',
  'WhatsApp Image 2025-12-05 at 11.01.50.jpeg',
  'WhatsApp Image 2025-12-05 at 11.24.59 (1).jpeg',
  'WhatsApp Image 2025-12-05 at 11.24.59 (2).jpeg',
  'WhatsApp Image 2025-12-05 at 11.24.59.jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.00 (1).jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.00 (2).jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.00.jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.01 (1).jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.01 (2).jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.01 (3).jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.01.jpeg',
  'WhatsApp Image 2025-12-05 at 11.25.02.jpeg',
  'WhatsApp Image 2025-12-05 at 11.33.52.jpeg',
  'WhatsApp Image 2025-12-05 at 11.33.53 (1).jpeg',
  'WhatsApp Image 2025-12-05 at 11.33.53 (2).jpeg',
  'WhatsApp Image 2025-12-05 at 11.33.53.jpeg',
  'WhatsApp Image 2025-12-05 at 11.33.54.jpeg',
  'WhatsApp Video 2025-12-05 at 11.01.44.mp4',
  'WhatsApp Video 2025-12-05 at 11.01.48.mp4',
  'WhatsApp Video 2025-12-05 at 11.01.54.mp4',
  'WhatsApp Video 2025-12-05 at 11.33.51.mp4',
  'WhatsApp Video 2025-12-05 at 11.33.52.mp4',
  'WhatsApp Video 2025-12-05 at 11.33.54.mp4',
  'WhatsApp Video 2025-12-05 at 11.33.56 (1).mp4',
  'WhatsApp Video 2025-12-05 at 11.33.56.mp4',
  'WhatsApp Video 2025-12-05 at 11.39.30.mp4',
  'WhatsApp Video 2025-12-05 at 11.39.34.mp4',
  'WhatsApp Video 2025-12-05 at 11.39.37.mp4',
  'WhatsApp Video 2025-12-05 at 11.39.38.mp4',
  'WhatsApp Video 2025-12-05 at 11.39.40.mp4',
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState({});
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadVotes();
    }
  }, [isAuthenticated]);

  const loadVotes = async () => {
    setIsLoadingVotes(true);
    const allVotes = await getAllMediaVotes();
    setVotes(allVotes);
    setIsLoadingVotes(false);
  };

  const handleVoteUpdate = (filename, newVotes) => {
    setVotes((prev) => ({
      ...prev,
      [filename]: newVotes,
    }));
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {isLoadingVotes ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading gallery...</p>
          </div>
        ) : (
          <Gallery
            mediaFiles={MEDIA_FILES}
            votes={votes}
            onVoteUpdate={handleVoteUpdate}
          />
        )}
      </main>
    </div>
  );
}
