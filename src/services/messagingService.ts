// src/services/messagingService.ts
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  arrayUnion, increment, writeBatch, limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Conversation, Message } from '@/types';

const convsCol = collection(db, 'conversations');

// ── Trouver ou créer une conversation ──────────────────────
export async function getOrCreateConversation(
  buyerId: string,
  sellerId: string,
  product: { id: string; title: string; price: number; image: string; neighborhood: string },
  buyerName: string,
  sellerName: string,
  buyerPhoto?: string,
  sellerPhoto?: string,
): Promise<string> {
  // Chercher conversation existante pour ce produit entre ces deux users
  const q = query(
    convsCol,
    where('productId', '==', product.id),
    where('participants', 'array-contains', buyerId),
    limit(1),
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    // Conversation existante → retourner son ID
    return snap.docs[0].id;
  }

  // Créer nouvelle conversation
  const newConv: Omit<Conversation, 'id'> = {
    participants: [buyerId, sellerId],
    participantNames: { [buyerId]: buyerName, [sellerId]: sellerName },
    participantPhotos: { [buyerId]: buyerPhoto || '', [sellerId]: sellerPhoto || '' },
    productId: product.id,
    productTitle: product.title,
    productImage: product.image,
    productPrice: product.price,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastSenderId: '',
    unreadCount: { [buyerId]: 0, [sellerId]: 0 },
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(convsCol, newConv);

  // Message système d'ouverture
  await addDoc(collection(db, 'conversations', ref.id, 'messages'), {
    conversationId: ref.id,
    senderId: 'system',
    senderName: 'Brumerie',
    text: `Conversation ouverte pour "${product.title}" — Restez courtois et méfiez-vous des arnaques 🛡️`,
    type: 'system',
    readBy: [buyerId, sellerId],
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

// ── Envoyer un message texte ───────────────────────────────
export async function sendMessage(
  convId: string,
  senderId: string,
  senderName: string,
  text: string,
  senderPhoto?: string,
): Promise<void> {
  const batch = writeBatch(db);
  const convRef = doc(db, 'conversations', convId);
  const msgRef = doc(collection(db, 'conversations', convId, 'messages'));

  // Récupérer les participants pour incrémenter unread de l'autre
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) return;
  const conv = convSnap.data() as Conversation;
  const otherId = conv.participants.find(p => p !== senderId) || '';

  // Ajouter le message
  batch.set(msgRef, {
    conversationId: convId,
    senderId,
    senderName,
    senderPhoto: senderPhoto || '',
    text: text.trim(),
    type: 'text',
    readBy: [senderId],
    createdAt: serverTimestamp(),
  });

  // Mettre à jour la conversation
  batch.update(convRef, {
    lastMessage: text.trim(),
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCount.${otherId}`]: increment(1),
    [`unreadCount.${senderId}`]: 0,
  });

  await batch.commit();
}

// ── Envoyer une fiche produit ──────────────────────────────
export async function sendProductCard(
  convId: string,
  senderId: string,
  senderName: string,
  product: { id: string; title: string; price: number; image: string; neighborhood: string },
  senderPhoto?: string,
): Promise<void> {
  const batch = writeBatch(db);
  const convRef = doc(db, 'conversations', convId);
  const msgRef = doc(collection(db, 'conversations', convId, 'messages'));

  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) return;
  const conv = convSnap.data() as Conversation;
  const otherId = conv.participants.find(p => p !== senderId) || '';

  batch.set(msgRef, {
    conversationId: convId,
    senderId,
    senderName,
    senderPhoto: senderPhoto || '',
    text: `📦 Fiche produit : ${product.title}`,
    type: 'product_card',
    productRef: product,
    readBy: [senderId],
    createdAt: serverTimestamp(),
  });

  batch.update(convRef, {
    lastMessage: `📦 ${product.title}`,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCount.${otherId}`]: increment(1),
    [`unreadCount.${senderId}`]: 0,
  });

  await batch.commit();
}

// ── Marquer messages comme lus ─────────────────────────────
export async function markConversationAsRead(convId: string, userId: string): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, { [`unreadCount.${userId}`]: 0 });

    // Marquer les messages non lus
    const msgsSnap = await getDocs(
      query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'))
    );
    const batch = writeBatch(db);
    msgsSnap.docs.forEach(d => {
      const data = d.data();
      if (!data.readBy?.includes(userId)) {
        batch.update(d.ref, { readBy: arrayUnion(userId) });
      }
    });
    await batch.commit();
  } catch (e) { console.error('[Messaging] markAsRead:', e); }
}

// ── Signaler un message ────────────────────────────────────
export async function reportMessage(convId: string, messageId: string): Promise<void> {
  const ref = doc(db, 'conversations', convId, 'messages', messageId);
  await updateDoc(ref, { reported: true });
}

// ── Listener temps réel — messages ────────────────────────
export function subscribeToMessages(
  convId: string,
  callback: (messages: Message[]) => void,
): () => void {
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    callback(msgs);
  });
}

// ── Listener temps réel — liste conversations ──────────────
export function subscribeToConversations(
  userId: string,
  callback: (convs: Conversation[]) => void,
): () => void {
  const q = query(
    convsCol,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
  );
  return onSnapshot(q, snap => {
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
    callback(convs);
  });
}

// ── Total non-lus pour badge BottomNav ─────────────────────
export function subscribeTotalUnread(
  userId: string,
  callback: (total: number) => void,
): () => void {
  const q = query(convsCol, where('participants', 'array-contains', userId));
  return onSnapshot(q, snap => {
    let total = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      total += data.unreadCount?.[userId] || 0;
    });
    callback(total);
  });
}
