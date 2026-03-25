'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageCard } from '@/components/MessageCard';

export default function VideoPage() {
  const { user } = useAuth();
  const { messages, savedIds, readIds, loading, error, toggleSave } = useMessages(user?.id ?? null);
  const videoMessages = messages.filter((m) => m.type === 'video');

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Messages</p>
        <h1 className="text-2xl font-bold text-white">Video</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>}

      {!loading && !error && videoMessages.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">No video messages yet.</p>
          <p className="text-white/40 text-xs mt-1">Video messages will appear here.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {videoMessages.map((msg) => (
          <MessageCard key={msg.id} message={msg} isSaved={savedIds.has(msg.id)} isRead={readIds.has(msg.id)} onToggleSave={toggleSave} />
        ))}
      </div>
    </div>
  );
}
