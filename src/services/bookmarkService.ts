// src/services/bookmarkService.ts
// Favoris stockés dans Firestore par userId — privés et persistants
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/config/firebase';

const getBookmarkDoc = (userId: string) => doc(db, 'bookmarks', userId);

export async function getBookmarks(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const snap = await getDoc(getBookmarkDoc(userId));
    if (!snap.exists()) return [];
    return snap.data()?.productIds || [];
  } catch (err) {
    console.error('[Bookmarks] getBookmarks error:', err);
    return [];
  }
}

export async function addBookmark(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;
  try {
    const ref = getBookmarkDoc(userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { productIds: [productId], updatedAt: new Date() });
    } else {
      await updateDoc(ref, { productIds: arrayUnion(productId), updatedAt: new Date() });
    }
    return true;
  } catch (err) {
    console.error('[Bookmarks] addBookmark error:', err);
    return false;
  }
}

export async function removeBookmark(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;
  try {
    const ref = getBookmarkDoc(userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { productIds: arrayRemove(productId), updatedAt: new Date() });
    }
    return true;
  } catch (err) {
    console.error('[Bookmarks] removeBookmark error:', err);
    return false;
  }
}

export async function isBookmarked(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;
  const ids = await getBookmarks(userId);
  return ids.includes(productId);
}
