import { supabase } from './supabase';
import type { Message } from '@/types';

export async function getUserMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
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

export async function createUserRecord(userId: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, email }, { onConflict: 'id' });

  if (error) throw new Error(error.message);
}
