'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageCard } from '@/components/MessageCard';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { messages, savedIds, readIds, loading, error, toggleSave } = useMessages(user?.id ?? null);

  const familyMessages = messages.filter((m) => m.sender_type === 'family');
  const globalMessages = messages.filter((m) => m.sender_type === 'global');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Welcome</p>
          <h1 className="text-2xl font-bold text-white">Messages of Support</h1>
        </div>
        <button onClick={handleSignOut} className="p-2 rounded-xl bg-[#3E5C86] shadow-sm hover:bg-[#324d73] transition-colors" aria-label="Sign out">
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>
      )}

      {!loading && !error && messages.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">No messages yet.</p>
          <p className="text-white/40 text-xs mt-1">Messages from your support network will appear here.</p>
        </div>
      )}

      {!loading && familyMessages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#E6E6E6] rounded-full" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Family &amp; Close Circle</h2>
            <span className="bg-[#3E5C86] text-white text-xs font-semibold px-2 py-0.5 rounded-full">{familyMessages.length}</span>
          </div>
          <div className="space-y-3">
            {familyMessages.map((msg) => (
              <MessageCard key={msg.id} message={msg} isSaved={savedIds.has(msg.id)} isRead={readIds.has(msg.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        </section>
      )}

      {!loading && globalMessages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#8FA87A] rounded-full" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Support from Around the World</h2>
            <span className="bg-[#8FA87A]/30 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{globalMessages.length}</span>
          </div>
          <div className="space-y-3">
            {globalMessages.map((msg) => (
              <MessageCard key={msg.id} message={msg} isSaved={savedIds.has(msg.id)} isRead={readIds.has(msg.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
