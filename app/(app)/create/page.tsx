'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { uploadMedia, uploadThumbnail } from '@/lib/storage';
import { createMessage, getContacts } from '@/lib/db';
import type { Contact } from '@/types';

type MessageType = 'video' | 'audio' | 'letter';
type RecipientMode = 'individual' | 'global';
type Step = 1 | 2 | 3;

const inputClass = 'w-full px-4 py-3 rounded-xl border border-[#1F2933]/10 bg-white text-[#1F2933] placeholder-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#3E5C86] transition text-sm';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [messageType, setMessageType] = useState<MessageType | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [senderName, setSenderName] = useState('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoTranscript, setVideoTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [contentText, setContentText] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      getContacts(user.id).then((data) => setContacts(data.filter((c) => c.linked_user_id))).catch(console.error);
    }
  }, [user]);

  // Auto-fill sender name from user email
  useEffect(() => {
    if (user && !senderName) {
      setSenderName(user.email?.split('@')[0] || 'Me');
    }
  }, [user, senderName]);

  const handleSelectType = (type: MessageType) => {
    setMessageType(type);
    setStep(2);
    setError('');
  };

  const handleStep2Next = () => {
    if (!recipientMode) { setError('Please select who this message is for.'); return; }
    if (recipientMode === 'individual' && !selectedContact) { setError('Please select a contact.'); return; }
    if (recipientMode === 'individual' && selectedContact && !selectedContact.linked_user_id) { setError("This contact hasn't accepted your friend request yet."); return; }
    if (!senderName.trim()) { setError('Please enter your name.'); return; }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageType || !recipientMode) return;
    setError('');
    setUploading(true);

    try {
      const timestamp = Date.now();
      const uid = user.id;
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (messageType === 'video') {
        if (!videoFile) { setError('Please select a video file.'); setUploading(false); return; }
        if (!thumbnailFile) { setError('A thumbnail image is required for video messages.'); setUploading(false); return; }
        setUploadProgress('Uploading video...');
        mediaUrl = await uploadMedia(videoFile, `videos/${uid}/${timestamp}_${videoFile.name}`);
        setUploadProgress('Uploading thumbnail...');
        thumbnailUrl = await uploadThumbnail(thumbnailFile, `thumbnails/${uid}/${timestamp}_${thumbnailFile.name}`);
      } else if (messageType === 'audio') {
        if (!audioFile) { setError('Please select an audio file.'); setUploading(false); return; }
        if (!transcript.trim()) { setError('A transcript is required for audio messages.'); setUploading(false); return; }
        setUploadProgress('Uploading audio...');
        mediaUrl = await uploadMedia(audioFile, `audio/${uid}/${timestamp}_${audioFile.name}`);
      } else if (messageType === 'letter') {
        if (!contentText.trim()) { setError('Letter content cannot be empty.'); setUploading(false); return; }
      }

      setUploadProgress('Saving message...');

      // Determine sender_type based on contact relationship or global
      const senderType = selectedContact
        ? (selectedContact.relationship_type === 'family' ? 'family' : 'global')
        : 'global';

      await createMessage({
        user_id: recipientMode === 'individual' ? (selectedContact!.linked_user_id!) : uid,
        sender_name: senderName.trim(),
        sender_type: senderType,
        type: messageType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        transcript: messageType === 'audio' ? transcript.trim() : messageType === 'video' ? videoTranscript.trim() || undefined : undefined,
        content_text: messageType === 'letter' ? contentText.trim() : undefined,
        recipient_type: recipientMode,
        creator_user_id: uid,
      });

      router.push('/created');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const stepLabels = ['Select type', 'Choose recipient', 'Add content'];

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="pt-12 pb-6">
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">New</p>
        <h1 className="text-2xl font-bold text-white">Create Message</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-[#E6E6E6] text-[#3E5C86]' : step > s ? 'bg-[#8FA87A] text-white' : 'bg-[#3E5C86]/40 text-white/40'
            }`}>
              {step > s ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : s}
            </div>
            {s < 3 && <div className={`w-6 h-0.5 ${step > s ? 'bg-[#8FA87A]' : 'bg-[#3E5C86]/30'}`} />}
          </div>
        ))}
        <span className="text-xs text-white/50 ml-2">{stepLabels[step - 1]}</span>
      </div>

      {/* STEP 1 — Select Type */}
      {step === 1 && (
        <div className="space-y-3">
          {[
            { type: 'video' as MessageType, label: 'Video Message', desc: 'Upload a video with thumbnail', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
            { type: 'audio' as MessageType, label: 'Audio Message', desc: 'Upload an audio file with transcript', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
            { type: 'letter' as MessageType, label: 'Written Letter', desc: 'Write a personal message', icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
          ].map(({ type, label, desc, icon }) => (
            <button key={type} onClick={() => handleSelectType(type)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#E6E6E6] hover:bg-white shadow-sm hover:shadow-md transition-all text-left">
              <div className="flex-shrink-0 text-[#3E5C86]">{icon}</div>
              <div>
                <p className="font-semibold text-[#1F2933] text-sm">{label}</p>
                <p className="text-xs text-[#1F2933]/50 mt-0.5">{desc}</p>
              </div>
              <svg className="w-5 h-5 text-[#1F2933]/30 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — Recipient */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Sender name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Your Name (appears as sender)</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your name" className={inputClass} />
          </div>

          {/* Recipient mode */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Who is this message for?</label>
            <div className="space-y-3">
              {/* Individual */}
              <button type="button" onClick={() => setRecipientMode('individual')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${recipientMode === 'individual' ? 'border-[#E6E6E6] bg-[#E6E6E6]' : 'border-[#3E5C86]/40 bg-[#3E5C86]/20 hover:border-[#E6E6E6]/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${recipientMode === 'individual' ? 'bg-[#3E5C86]' : 'bg-[#3E5C86]/50'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${recipientMode === 'individual' ? 'text-[#1F2933]' : 'text-white'}`}>Send to a Contact</p>
                    <p className={`text-xs mt-0.5 ${recipientMode === 'individual' ? 'text-[#1F2933]/60' : 'text-white/50'}`}>Choose someone from your contacts</p>
                  </div>
                </div>
              </button>

              {/* Global */}
              <button type="button" onClick={() => { setRecipientMode('global'); setSelectedContact(null); }}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${recipientMode === 'global' ? 'border-[#8FA87A] bg-[#E6E6E6]' : 'border-[#3E5C86]/40 bg-[#3E5C86]/20 hover:border-[#8FA87A]/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${recipientMode === 'global' ? 'bg-[#8FA87A]' : 'bg-[#8FA87A]/40'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${recipientMode === 'global' ? 'text-[#1F2933]' : 'text-white'}`}>Broadcast Globally</p>
                    <p className={`text-xs mt-0.5 ${recipientMode === 'global' ? 'text-[#1F2933]/60' : 'text-white/50'}`}>Visible to all users on the platform</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Contact list (shown when individual selected) */}
          {recipientMode === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Select Contact</label>
              {contacts.length === 0 ? (
                <div className="bg-[#E6E6E6] rounded-2xl p-4 text-center">
                  <p className="text-[#1F2933]/60 text-sm">No contacts yet.</p>
                  <button type="button" onClick={() => router.push('/contacts')} className="text-[#3E5C86] text-sm font-semibold mt-1 hover:underline">
                    Add contacts first →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button key={contact.id} type="button" onClick={() => setSelectedContact(contact)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedContact?.id === contact.id ? 'bg-[#E6E6E6] border-2 border-[#3E5C86]' : 'bg-[#3E5C86]/30 border-2 border-transparent hover:bg-[#3E5C86]/50'}`}>
                      <div className="w-8 h-8 bg-[#3E5C86] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${selectedContact?.id === contact.id ? 'text-[#1F2933]' : 'text-white'}`}>{contact.name}</p>
                        <p className={`text-xs capitalize ${selectedContact?.id === contact.id ? 'text-[#1F2933]/50' : 'text-white/50'}`}>{contact.relationship_type}</p>
                      </div>
                      {selectedContact?.id === contact.id && (
                        <svg className="w-5 h-5 text-[#3E5C86] ml-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setStep(1); setError(''); }} className="flex-1 py-3 rounded-xl border-2 border-[#3E5C86]/50 text-white/70 font-semibold text-sm hover:border-[#E6E6E6]/30 transition">Back</button>
            <button type="button" onClick={handleStep2Next} className="flex-1 py-3 rounded-xl bg-[#3E5C86] text-white font-semibold text-sm hover:bg-[#324d73] transition shadow-sm">Continue</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Content */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary card */}
          <div className="bg-[#E6E6E6] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3E5C86] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold capitalize">{messageType?.[0]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2933]">{senderName}</p>
              <p className="text-xs text-[#1F2933]/50 capitalize">
                {messageType} · {recipientMode === 'global' ? 'Global Broadcast' : selectedContact?.name}
              </p>
            </div>
          </div>

          {messageType === 'video' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Video File <span className="text-red-300">*</span></label>
                <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                {videoFile && <p className="text-xs text-[#8FA87A] mt-1">✓ {videoFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Thumbnail Image <span className="text-red-300">*</span></label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                <p className="text-xs text-white/40 mt-1">Required — shown as video preview before playback.</p>
                {thumbnailFile && <p className="text-xs text-[#8FA87A] mt-1">✓ {thumbnailFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Transcript <span className="text-white/40 font-normal">(optional)</span></label>
                <textarea value={videoTranscript} onChange={(e) => setVideoTranscript(e.target.value)} placeholder="Transcript of the video..." rows={3} className={inputClass + ' resize-none'} />
              </div>
            </>
          )}

          {messageType === 'audio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Audio File <span className="text-red-300">*</span></label>
                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} className={inputClass} required />
                {audioFile && <p className="text-xs text-[#8FA87A] mt-1">✓ {audioFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Transcript <span className="text-red-300">*</span></label>
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Type the transcript of the audio here..." rows={5} className={inputClass + ' resize-none'} required />
              </div>
            </>
          )}

          {messageType === 'letter' && (
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Letter Content <span className="text-red-300">*</span></label>
              <textarea value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Write your message here..." rows={10} className={inputClass + ' resize-none leading-relaxed'} required autoFocus />
              <p className="text-xs text-white/40 mt-1">{contentText.length} characters</p>
            </div>
          )}

          {error && <div className="bg-red-900/30 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl">{error}</div>}

          {uploading && uploadProgress && (
            <div className="bg-[#3E5C86]/40 border border-[#E6E6E6]/20 text-white text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              {uploadProgress}
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-4">
            <button type="button" onClick={() => { setStep(2); setError(''); }} disabled={uploading} className="flex-1 py-3 rounded-xl border-2 border-[#3E5C86]/50 text-white/70 font-semibold text-sm hover:border-[#E6E6E6]/30 transition disabled:opacity-50">Back</button>
            <button type="submit" disabled={uploading} className="flex-1 py-3 rounded-xl bg-[#3E5C86] text-white font-semibold text-sm hover:bg-[#324d73] transition shadow-sm disabled:opacity-60">
              {uploading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
