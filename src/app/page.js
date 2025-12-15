'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Gallery from '@/components/Gallery';
import UploadButton from '@/components/UploadButton';
import { getAllMediaVotes } from '@/lib/mediaService';
import styles from './page.module.css';

// List of media files in the public/media folder (legacy local files)
const LOCAL_MEDIA_FILES = [
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

// Fetch SharePoint files from our API
async function fetchSharePointFiles() {
  try {
    const response = await fetch('/api/sharepoint/files');
    if (!response.ok) {
      console.error('Failed to fetch SharePoint files:', response.status);
      return [];
    }
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching SharePoint files:', error);
    return [];
  }
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState({});
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadData = useCallback(async () => {
    setIsLoadingMedia(true);
    setLoadError(null);
    
    try {
      // Load votes and SharePoint media in parallel
      const [allVotes, sharepointMedia] = await Promise.all([
        getAllMediaVotes(),
        fetchSharePointFiles(),
      ]);
      
      setVotes(allVotes);
      
      // Combine SharePoint files and local files
      // SharePoint files have {id, filename, url}, local files are just strings
      const allMedia = [
        ...sharepointMedia, // SharePoint files first
        ...LOCAL_MEDIA_FILES, // Then local files
      ];
      
      setMediaFiles(allMedia);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadError(error.message);
      // Fall back to local files only
      setMediaFiles(LOCAL_MEDIA_FILES);
    }
    
    setIsLoadingMedia(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleVoteUpdate = (filename, newVotes) => {
    setVotes((prev) => ({
      ...prev,
      [filename]: newVotes,
    }));
  };

  const handleUploadComplete = (uploadedFiles) => {
    // Add newly uploaded files to the beginning of the list
    const newMediaItems = uploadedFiles.map((file) => ({
      id: file.id,
      filename: file.filename,
      url: file.url,
    }));
    
    setMediaFiles((prev) => [...newMediaItems, ...prev]);
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
        <UploadButton onUploadComplete={handleUploadComplete} />
        {loadError && (
          <div className={styles.errorBanner}>
            ⚠️ Could not load SharePoint files: {loadError}. Showing local files only.
          </div>
        )}
        {isLoadingMedia ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading gallery...</p>
          </div>
        ) : (
          <Gallery
            mediaFiles={mediaFiles}
            votes={votes}
            onVoteUpdate={handleVoteUpdate}
          />
        )}
      </main>
    </div>
  );
}
