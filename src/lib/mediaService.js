import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

const COLLECTION_NAME = 'mediaVotes';

/**
 * Get vote data for a specific media file
 */
export async function getMediaVotes(filename) {
  try {
    const docRef = doc(db, COLLECTION_NAME, filename);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Return default values if document doesn't exist
    return {
      filename,
      upvotes: 0,
      downvotes: 0,
      vetos: 0,
    };
  } catch (error) {
    console.error('Error getting media votes:', error);
    return {
      filename,
      upvotes: 0,
      downvotes: 0,
      vetos: 0,
    };
  }
}

/**
 * Get all media votes from Firestore
 */
export async function getAllMediaVotes() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const votes = {};
    
    querySnapshot.forEach((doc) => {
      votes[doc.id] = doc.data();
    });
    
    return votes;
  } catch (error) {
    console.error('Error getting all media votes:', error);
    return {};
  }
}

/**
 * Initialize vote document for a media file if it doesn't exist
 */
async function ensureDocumentExists(filename) {
  const docRef = doc(db, COLLECTION_NAME, filename);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      filename,
      upvotes: 0,
      downvotes: 0,
      vetos: 0,
    });
  }
  
  return docRef;
}

/**
 * Add an upvote to a media file
 */
export async function upvoteMedia(filename) {
  try {
    const docRef = await ensureDocumentExists(filename);
    await updateDoc(docRef, {
      upvotes: increment(1),
    });
    return await getMediaVotes(filename);
  } catch (error) {
    console.error('Error upvoting media:', error);
    throw error;
  }
}

/**
 * Add a downvote to a media file
 */
export async function downvoteMedia(filename) {
  try {
    const docRef = await ensureDocumentExists(filename);
    await updateDoc(docRef, {
      downvotes: increment(1),
    });
    return await getMediaVotes(filename);
  } catch (error) {
    console.error('Error downvoting media:', error);
    throw error;
  }
}

/**
 * Add a veto to a media file
 */
export async function vetoMedia(filename) {
  try {
    const docRef = await ensureDocumentExists(filename);
    await updateDoc(docRef, {
      vetos: increment(1),
    });
    return await getMediaVotes(filename);
  } catch (error) {
    console.error('Error vetoing media:', error);
    throw error;
  }
}

/**
 * Calculate vote quota (upvotes / total votes)
 */
export function calculateQuota(upvotes, downvotes) {
  const total = upvotes + downvotes;
  if (total === 0) return null;
  return upvotes / total;
}

/**
 * Check if media should be hidden (2+ vetos)
 */
export function shouldHideMedia(vetos) {
  return vetos >= 2;
}
