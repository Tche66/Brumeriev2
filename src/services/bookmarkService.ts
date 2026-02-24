// src/services/bookmarkService.ts
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/config/firebase';

const getBookmarkDoc = (userId: string) => doc(db, 'bookmarks', userId);

export async function getBookmarks(userId: string): Promise<string[]> {
  try {
    const snap = await getDoc(getBookmarkDoc(userId));
    if (!snap.exists()) return [];
    return snap.data().productIds || [];
  } catch { return []; }
}

export async function addBookmark(userId: string, productId: string): Promise<void> {
  const ref = getBookmarkDoc(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { productIds: [productId] });
  } else {
    await updateDoc(ref, { productIds: arrayUnion(productId) });
  }
}

export async function removeBookmark(userId: string, productId: string): Promise<void> {
  const ref = getBookmarkDoc(userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { productIds: arrayRemove(productId) });
  }
}
