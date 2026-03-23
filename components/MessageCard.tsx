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
  video: 'bg-[#4F6D9A]/20 text-[#3E5C86]',
  audio: 'bg-purple-200/50 text-purple-700',
  letter: 'bg-[#8FA87A]/20 text-[#5a7a46]',
};

const typeLabels: Record<string, string> = { video: 'Video', audio: 'Audio', letter: 'Letter' };

export function MessageCard({ message, isSaved, isRead, onToggleSave }: MessageCardProps) {
  return (
    <Link href={`/message/${message.id}`} className="block group">
      <div className="bg-[#E6E6E6] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {message.type === 'video' && message.thumbnail_url && (
          <div className="relative aspect-video bg-gray-200">
            <Image src={message.thumbnail_url} alt={`Thumbnail from ${message.sender_name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#3E5C86]/90 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            {!isRead && <div className="absolute top-2 left-2"><span className="bg-[#3E5C86] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span></div>}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeBadgeColors[message.type] ?? 'bg-gray-200 text-gray-600'}`}>
                  {typeLabels[message.type] ?? message.type}
                </span>
                {!isRead && message.type !== 'video' && (
                  <span className="bg-[#3E5C86] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
                )}
                <span className="text-[11px] text-[#1F2933]/40 capitalize">
                  {message.sender_type === 'family' ? 'Family' : 'World'}
                </span>
              </div>
              <p className="font-semibold text-[#1F2933] text-sm truncate">{message.sender_name}</p>
              {message.type === 'audio' && message.duration && (
                <p className="text-xs text-[#1F2933]/50 mt-1">{formatDuration(message.duration)}</p>
              )}
              {message.type === 'letter' && message.content_text && (
                <p className="text-xs text-[#1F2933]/60 mt-1 line-clamp-2 leading-relaxed">{message.content_text}</p>
              )}
              {message.type === 'audio' && (
                <div className="flex items-end gap-0.5 mt-2 h-5">
                  {[3,6,4,8,5,7,4,9,6,5,7,3,8,6,4,7,5,8,4,6].map((h, i) => (
                    <div key={i} className="w-1.5 bg-[#3E5C86]/40 rounded-full" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              )}
            </div>
            <SaveButton saved={isSaved} onToggle={() => onToggleSave(message.id)} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
