'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageCard } from '@/components/MessageCard';

export default function AudioPage() {
  const { user } = useAuth();
  const { messages, savedIds, readIds, loading, error, toggleSave } = useMessages(user?.id ?? null);
  const audioMessages = messages.filter((m) => m.type === 'audio');

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Messages</p>
        <h1 className="text-2xl font-bold text-white">Audio</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>}

      {!loading && !error && audioMessages.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">No audio messages yet.</p>
          <p className="text-white/40 text-xs mt-1">Voice messages will appear here.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {audioMessages.map((msg) => (
          <MessageCard key={msg.id} message={msg} isSaved={savedIds.has(msg.id)} isRead={readIds.has(msg.id)} onToggleSave={toggleSave} />
        ))}
      </div>
    </div>
  );
}
