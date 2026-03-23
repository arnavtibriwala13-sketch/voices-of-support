'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCreatedMessages, deleteMessage } from '@/lib/db';
import { useRouter } from 'next/navigation';
import type { Message } from '@/types';

function formatDate(val: unknown): string {
  if (!val) return '';
  try {
    return new Date(val as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

const typeBadge: Record<string, string> = {
  video: 'bg-blue-900/40 text-blue-200',
  audio: 'bg-purple-900/40 text-purple-200',
  letter: 'bg-[#8FA87A]/30 text-[#8FA87A]',
};

export default function CreatedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getCreatedMessages(user.id)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Outbox</p>
        <h1 className="text-2xl font-bold text-white">Created Messages</h1>
      </div>

      {loading && <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#E6E6E6] border-t-transparent rounded-full animate-spin" /></div>}
      {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>}

      {!loading && !error && messages.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#3E5C86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </div>
          <p className="text-white/70 text-sm">No messages created yet.</p>
          <p className="text-white/40 text-xs mt-1">Messages you send will appear here.</p>
        </div>
      )}

      <div className="space-y-3 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-[#E6E6E6] rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => router.push(`/message/${msg.id}`)} className="w-full p-4 text-left hover:bg-white/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#3E5C86] rounded-xl flex items-center justify-center flex-shrink-0">
                  {msg.type === 'video' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                  {msg.type === 'audio' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
                  {msg.type === 'letter' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${typeBadge[msg.type] ?? 'bg-gray-100 text-gray-600'}`}>{msg.type}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${msg.recipient_type === 'global' ? 'bg-[#8FA87A]/20 text-[#5a7a46]' : 'bg-[#3E5C86]/20 text-[#3E5C86]'}`}>
                      {msg.recipient_type === 'global' ? 'Global' : 'Individual'}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1F2933] text-sm truncate">From: {msg.sender_name}</p>
                  {msg.content_text && <p className="text-xs text-[#1F2933]/50 mt-0.5 line-clamp-1">{msg.content_text}</p>}
                  <p className="text-[10px] text-[#1F2933]/40 mt-1">{formatDate(msg.created_at)}</p>
                </div>
              </div>
            </button>
            <div className="px-4 pb-3">
              <button onClick={() => handleDelete(msg.id)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                Delete message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
