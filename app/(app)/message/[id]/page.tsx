'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { LetterView } from '@/components/LetterView';
import { SaveButton } from '@/components/SaveButton';
import type { Message } from '@/types';

export default function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { messages, savedIds, loading, markRead, toggleSave } = useMessages(user?.uid ?? null);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      const found = messages.find((m) => m.id === id);
      setMessage(found ?? null);
    }
  }, [messages, id, loading]);

  // Mark as read when opened
  useEffect(() => {
    if (message && user) {
      markRead(message.id);
    }
  }, [message, user, markRead]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6E6E6]">
        <div className="w-8 h-8 border-4 border-[#4F6D9A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#4F6D9A] text-sm font-medium mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center py-16">
          <p className="text-[#1F2933]/60">Message not found.</p>
        </div>
      </div>
    );
  }

  const isSaved = savedIds.has(message.id);

  const typeBadgeColors: Record<string, string> = {
    video: 'bg-blue-100 text-blue-700',
    audio: 'bg-purple-100 text-purple-700',
    letter: 'bg-[#8FA87A]/20 text-[#5a7a46]',
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#4F6D9A] text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <SaveButton
          saved={isSaved}
          onToggle={() => toggleSave(message.id)}
        />
      </div>

      {/* Sender info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${typeBadgeColors[message.type] ?? 'bg-gray-100 text-gray-600'}`}>
            {message.type}
          </span>
          <span className="text-[11px] text-[#1F2933]/40 capitalize">
            {message.sender_type === 'family' ? 'Family & Close Circle' : 'Support from Around the World'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#1F2933]">{message.sender_name}</h1>
      </div>

      {/* Content */}
      <div className="pb-8">
        {message.type === 'video' && message.media_url && (
          <VideoPlayer src={message.media_url} thumbnailUrl={message.thumbnail_url} />
        )}

        {message.type === 'audio' && message.media_url && (
          <AudioPlayer
            src={message.media_url}
            transcript={message.transcript}
            senderName={message.sender_name}
          />
        )}

        {message.type === 'letter' && message.content_text && (
          <LetterView
            content={message.content_text}
            senderName={message.sender_name}
            senderType={message.sender_type}
          />
        )}
      </div>
    </div>
  );
}
