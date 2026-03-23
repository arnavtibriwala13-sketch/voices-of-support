'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageCard } from '@/components/MessageCard';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { messages, savedIds, readIds, loading, error, toggleSave } = useMessages(
    user?.id ?? null
  );

  const familyMessages = messages.filter((m) => m.sender_type === 'family');
  const globalMessages = messages.filter((m) => m.sender_type === 'global');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="pt-12 pb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#1F2933]/50 font-medium uppercase tracking-wider">Welcome</p>
          <h1 className="text-2xl font-bold text-[#1F2933]">Messages of Support</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
          aria-label="Sign out"
        >
          <svg className="w-5 h-5 text-[#1F2933]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#4F6D9A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
      )}

      {!loading && !error && messages.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#4F6D9A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#4F6D9A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-[#1F2933]/60 text-sm">No messages yet.</p>
          <p className="text-[#1F2933]/40 text-xs mt-1">Messages from your support network will appear here.</p>
        </div>
      )}

      {/* Family section */}
      {!loading && familyMessages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#4F6D9A] rounded-full" />
            <h2 className="text-sm font-semibold text-[#1F2933] uppercase tracking-wider">
              Family &amp; Close Circle
            </h2>
            <span className="bg-[#4F6D9A]/10 text-[#4F6D9A] text-xs font-semibold px-2 py-0.5 rounded-full">
              {familyMessages.length}
            </span>
          </div>
          <div className="space-y-3">
            {familyMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                isSaved={savedIds.has(msg.id)}
                isRead={readIds.has(msg.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        </section>
      )}

      {/* Global section */}
      {!loading && globalMessages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#8FA87A] rounded-full" />
            <h2 className="text-sm font-semibold text-[#1F2933] uppercase tracking-wider">
              Support from Around the World
            </h2>
            <span className="bg-[#8FA87A]/20 text-[#5a7a46] text-xs font-semibold px-2 py-0.5 rounded-full">
              {globalMessages.length}
            </span>
          </div>
          <div className="space-y-3">
            {globalMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                isSaved={savedIds.has(msg.id)}
                isRead={readIds.has(msg.id)}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
