'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getUserMessages,
  getSavedMessages,
  getReadStatus,
  saveMessage,
  unsaveMessage,
  markAsRead,
} from '@/lib/firestore';
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
