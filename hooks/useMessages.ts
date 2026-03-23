'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getUserMessages,
  getSavedMessages,
  getReadStatus,
  saveMessage,
  unsaveMessage,
  markAsRead,
} from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';

export function useMessages(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [msgs, saved, read] = await Promise.all([
        getUserMessages(userId),
        getSavedMessages(userId),
        getReadStatus(userId),
      ]);
      setMessages(msgs);
      setSavedIds(new Set(saved));
      setReadIds(new Set(read));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription: new messages addressed to this user or global
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if not created by the current user
          if (newMsg.creator_user_id !== userId) {
            setMessages((prev) => [newMsg, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_type=eq.global`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Don't show global messages you created
          if (newMsg.creator_user_id !== userId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [newMsg, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const toggleSave = useCallback(
    async (messageId: string) => {
      if (!userId) return;
      const isSaved = savedIds.has(messageId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });
      try {
        if (isSaved) {
          await unsaveMessage(userId, messageId);
        } else {
          await saveMessage(userId, messageId);
        }
      } catch (err) {
        console.error('Error toggling save:', err);
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) {
            next.add(messageId);
          } else {
            next.delete(messageId);
          }
          return next;
        });
      }
    },
    [userId, savedIds]
  );

  const markRead = useCallback(
    async (messageId: string) => {
      if (!userId || readIds.has(messageId)) return;
      setReadIds((prev) => new Set([...prev, messageId]));
      try {
        await markAsRead(userId, messageId);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    },
    [userId, readIds]
  );

  return {
    messages,
    savedIds,
    readIds,
    loading,
    error,
    toggleSave,
    markRead,
    refetch: fetchData,
  };
}
