import type { Message } from '@/types';

async function getDb() {
  const { db } = await import('./firebase');
  return db;
}

export async function getUserMessages(userId: string): Promise<Message[]> {
  const db = await getDb();
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'messages'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
}

export async function saveMessage(userId: string, messageId: string): Promise<void> {
  const db = await getDb();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const docId = `${userId}_${messageId}`;
  await setDoc(doc(db, 'saved_messages', docId), {
    user_id: userId,
    message_id: messageId,
    saved_at: serverTimestamp(),
  });
}

export async function unsaveMessage(userId: string, messageId: string): Promise<void> {
  const db = await getDb();
  const { doc, deleteDoc } = await import('firebase/firestore');
  const docId = `${userId}_${messageId}`;
  await deleteDoc(doc(db, 'saved_messages', docId));
}

export async function getSavedMessages(userId: string): Promise<string[]> {
  const db = await getDb();
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'saved_messages'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().message_id as string);
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const db = await getDb();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const docId = `${userId}_${messageId}`;
  await setDoc(doc(db, 'read_status', docId), {
    user_id: userId,
    message_id: messageId,
    is_read: true,
    read_at: serverTimestamp(),
  });
}

export async function getReadStatus(userId: string): Promise<string[]> {
  const db = await getDb();
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'read_status'), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().message_id as string);
}

export async function createMessage(data: Omit<Message, 'id'>): Promise<string> {
  const db = await getDb();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  const ref = await addDoc(collection(db, 'messages'), {
    ...data,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function createUserDocument(userId: string, email: string): Promise<void> {
  const db = await getDb();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', userId), {
    email,
    created_at: serverTimestamp(),
  });
}
