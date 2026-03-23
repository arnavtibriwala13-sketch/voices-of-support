'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageCard } from '@/components/MessageCard';
import type { Message } from '@/types';

type FilterTab = 'all' | 'video' | 'audio' | 'letter';
const tabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' }, { id: 'letter', label: 'Letters' },
];

export default function VaultPage() {
  const { user } = useAuth();
  const { messages, savedIds, readIds, loading, error, toggleSave } = useMessages(user?.id ?? null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const savedMessages = messages.filter((m: Message) => savedIds.has(m.id));
  const filtered = activeTab === 'all' ? savedMessages : savedMessages.filter((m: Message) => m.type === activeTab);

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Saved</p>
        <h1 className="text-2xl font-bold text-white">Vault</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-[#E6E6E6] text-[#3E5C86] shadow-sm' : 'bg-[#3E5C86]/40 text-white/70 hover:bg-[#3E5C86]/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" /></div>}
      {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-white/70 text-sm">{savedMessages.length === 0 ? 'No saved messages yet.' : `No ${activeTab} messages saved.`}</p>
          <p className="text-white/40 text-xs mt-1">Tap the heart icon on any message to save it here.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {filtered.map((msg: Message) => (
          <MessageCard key={msg.id} message={msg} isSaved={savedIds.has(msg.id)} isRead={readIds.has(msg.id)} onToggleSave={toggleSave} />
        ))}
      </div>
    </div>
  );
}
