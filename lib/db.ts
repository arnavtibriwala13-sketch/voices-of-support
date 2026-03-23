import { supabase } from './supabase';
import type { Message, Contact } from '@/types';

export async function getUserMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`user_id.eq.${userId},recipient_type.eq.global`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Message[];
}

export async function getCreatedMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('creator_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Message[];
}

export async function getSavedMessages(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_messages')
    .select('message_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.message_id as string);
}

export async function saveMessage(userId: string, messageId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_messages')
    .insert({ user_id: userId, message_id: messageId });
  if (error) throw new Error(error.message);
}

export async function unsaveMessage(userId: string, messageId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_messages')
    .delete()
    .eq('user_id', userId)
    .eq('message_id', messageId);
  if (error) throw new Error(error.message);
}

export async function getReadStatus(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('read_status')
    .select('message_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.message_id as string);
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const { error } = await supabase
    .from('read_status')
    .upsert(
      { user_id: userId, message_id: messageId, is_read: true },
      { onConflict: 'user_id,message_id' }
    );
  if (error) throw new Error(error.message);
}

export async function createMessage(
  data: Omit<Message, 'id' | 'created_at'>
): Promise<string> {
  const { data: inserted, error } = await supabase
    .from('messages')
    .insert(data)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return inserted.id as string;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  if (error) throw new Error(error.message);
}

export async function createUserRecord(userId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

// Contacts
export async function getContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('owner_user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Contact[];
}

export async function createContact(
  userId: string,
  contact: { name: string; email?: string; relationship_type: 'family' | 'close' }
): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ owner_user_id: userId, ...contact })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function updateContact(
  contactId: string,
  updates: { name?: string; email?: string; relationship_type?: 'family' | 'close' }
): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId);
  if (error) throw new Error(error.message);
}

export async function deleteContact(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);
  if (error) throw new Error(error.message);
}
