'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Message } from '@/types';
import { SaveButton } from './SaveButton';

interface MessageCardProps {
  message: Message;
  isSaved: boolean;
  isRead: boolean;
  onToggleSave: (messageId: string) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const typeBadgeColors: Record<string, string> = {
  video: 'bg-blue-100 text-blue-700',
  audio: 'bg-purple-100 text-purple-700',
  letter: 'bg-[#8FA87A]/20 text-[#5a7a46]',
};

const typeLabels: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  letter: 'Letter',
};

export function MessageCard({ message, isSaved, isRead, onToggleSave }: MessageCardProps) {
  return (
    <Link href={`/message/${message.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Thumbnail for video */}
        {message.type === 'video' && message.thumbnail_url && (
          <div className="relative aspect-video bg-gray-100">
            <Image
              src={message.thumbnail_url}
              alt={`Thumbnail from ${message.sender_name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-[#4F6D9A] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {!isRead && (
              <div className="absolute top-2 left-2">
                <span className="bg-[#4F6D9A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  New
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Type badge + New for non-video */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    typeBadgeColors[message.type] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {typeLabels[message.type] ?? message.type}
                </span>
                {!isRead && message.type !== 'video' && (
                  <span className="bg-[#4F6D9A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    New
                  </span>
                )}
                <span className="text-[11px] text-[#1F2933]/40 capitalize">
                  {message.sender_type === 'family' ? 'Family' : 'World'}
                </span>
              </div>

              <p className="font-semibold text-[#1F2933] text-sm truncate">{message.sender_name}</p>

              {/* Audio duration */}
              {message.type === 'audio' && message.duration && (
                <p className="text-xs text-[#1F2933]/50 mt-1">
                  {formatDuration(message.duration)}
                </p>
              )}

              {/* Letter preview */}
              {message.type === 'letter' && message.content_text && (
                <p className="text-xs text-[#1F2933]/60 mt-1 line-clamp-2 leading-relaxed">
                  {message.content_text}
                </p>
              )}

              {/* Audio: show waveform icon */}
              {message.type === 'audio' && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-3 h-3 bg-[#4F6D9A]/30 rounded-sm" />
                  <div className="w-3 h-5 bg-[#4F6D9A]/50 rounded-sm" />
                  <div className="w-3 h-4 bg-[#4F6D9A]/40 rounded-sm" />
                  <div className="w-3 h-6 bg-[#4F6D9A]/60 rounded-sm" />
                  <div className="w-3 h-3 bg-[#4F6D9A]/30 rounded-sm" />
                  <div className="w-3 h-5 bg-[#4F6D9A]/50 rounded-sm" />
                  <div className="w-3 h-2 bg-[#4F6D9A]/20 rounded-sm" />
                </div>
              )}
            </div>

            <SaveButton
              saved={isSaved}
              onToggle={() => onToggleSave(message.id)}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
