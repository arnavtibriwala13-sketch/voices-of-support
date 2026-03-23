'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { uploadMedia, uploadThumbnail } from '@/lib/storage';
import { createMessage } from '@/lib/db';

type MessageType = 'video' | 'audio' | 'letter';
type SenderType = 'family' | 'global';
type Step = 1 | 2 | 3;

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F7] text-[#1F2933] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6D9A] focus:border-transparent transition text-sm';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [messageType, setMessageType] = useState<MessageType | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderType, setSenderType] = useState<SenderType>('family');

  // Video fields
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoTranscript, setVideoTranscript] = useState('');

  // Audio fields
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');

  // Letter fields
  const [contentText, setContentText] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const handleSelectType = (type: MessageType) => {
    setMessageType(type);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!senderName.trim()) {
      setError('Please enter a sender name.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageType) return;
    setError('');
    setUploading(true);

    try {
      const timestamp = Date.now();
      const uid = user.id;
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (messageType === 'video') {
        if (!videoFile) { setError('Please select a video file.'); setUploading(false); return; }
        if (!thumbnailFile) { setError('Please select a thumbnail image (required).'); setUploading(false); return; }

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
      await createMessage({
        user_id: uid,
        sender_name: senderName.trim(),
        sender_type: senderType,
        type: messageType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        transcript: messageType === 'audio' ? transcript.trim() : messageType === 'video' ? videoTranscript.trim() || undefined : undefined,
        content_text: messageType === 'letter' ? contentText.trim() : undefined,
      });

      // Navigate to home and show the new message
      router.push('/home');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="pt-12 pb-6">
        <p className="text-xs text-[#1F2933]/50 font-medium uppercase tracking-wider">New</p>
        <h1 className="text-2xl font-bold text-[#1F2933]">Create Message</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-[#4F6D9A] text-white'
                  : step > s
                  ? 'bg-[#8FA87A] text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step > s ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? 'bg-[#8FA87A]' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <span className="text-xs text-[#1F2933]/40 ml-2">
          {step === 1 ? 'Select type' : step === 2 ? 'Add details' : 'Upload content'}
        </span>
      </div>

      {/* STEP 1 — Select Type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-[#1F2933]/60 mb-4">What kind of message would you like to create?</p>
          {(
            [
              {
                type: 'video' as MessageType,
                label: 'Video Message',
                desc: 'Upload a video with thumbnail',
                color: 'bg-blue-50 border-blue-200',
                iconColor: 'text-blue-500',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                type: 'audio' as MessageType,
                label: 'Audio Message',
                desc: 'Upload an audio file with transcript',
                color: 'bg-purple-50 border-purple-200',
                iconColor: 'text-purple-500',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                ),
              },
              {
                type: 'letter' as MessageType,
                label: 'Written Letter',
                desc: 'Write a personal message',
                color: 'bg-[#8FA87A]/10 border-[#8FA87A]/30',
                iconColor: 'text-[#5a7a46]',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ]
          ).map(({ type, label, desc, color, iconColor, icon }) => (
            <button
              key={type}
              onClick={() => handleSelectType(type)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white hover:shadow-md transition-all text-left ${color}`}
            >
              <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
              <div>
                <p className="font-semibold text-[#1F2933] text-sm">{label}</p>
                <p className="text-xs text-[#1F2933]/50 mt-0.5">{desc}</p>
              </div>
              <svg className="w-5 h-5 text-[#1F2933]/30 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — Details */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
              Sender Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Mom, Dad, A Friend from Texas"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2933] mb-2">
              Message Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSenderType('family')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  senderType === 'family'
                    ? 'border-[#4F6D9A] bg-[#4F6D9A]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${senderType === 'family' ? 'bg-[#4F6D9A]' : 'bg-gray-100'}`}>
                  <svg className={`w-4 h-4 ${senderType === 'family' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold ${senderType === 'family' ? 'text-[#4F6D9A]' : 'text-[#1F2933]'}`}>Family &amp;</p>
                <p className={`text-sm font-semibold ${senderType === 'family' ? 'text-[#4F6D9A]' : 'text-[#1F2933]'}`}>Close Circle</p>
              </button>
              <button
                type="button"
                onClick={() => setSenderType('global')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  senderType === 'global'
                    ? 'border-[#8FA87A] bg-[#8FA87A]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${senderType === 'global' ? 'bg-[#8FA87A]' : 'bg-gray-100'}`}>
                  <svg className={`w-4 h-4 ${senderType === 'global' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold ${senderType === 'global' ? 'text-[#5a7a46]' : 'text-[#1F2933]'}`}>From Around</p>
                <p className={`text-sm font-semibold ${senderType === 'global' ? 'text-[#5a7a46]' : 'text-[#1F2933]'}`}>the World</p>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-[#1F2933]/60 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="flex-1 py-3 px-4 rounded-xl bg-[#4F6D9A] text-white font-semibold text-sm hover:bg-[#3E5C86] transition shadow-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Content Upload */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4F6D9A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              {messageType === 'video' && (
                <svg className="w-5 h-5 text-[#4F6D9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {messageType === 'audio' && (
                <svg className="w-5 h-5 text-[#4F6D9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
              {messageType === 'letter' && (
                <svg className="w-5 h-5 text-[#4F6D9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2933]">{senderName}</p>
              <p className="text-xs text-[#1F2933]/50 capitalize">
                {messageType} · {senderType === 'family' ? 'Family & Close Circle' : 'Around the World'}
              </p>
            </div>
          </div>

          {/* Video fields */}
          {messageType === 'video' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Video File <span className="text-red-400">*</span>
                </label>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className={inputClass}
                  required
                />
                {videoFile && (
                  <p className="text-xs text-[#8FA87A] mt-1">✓ {videoFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Thumbnail Image <span className="text-red-400">*</span>
                </label>
                <input
                  ref={thumbRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className={inputClass}
                  required
                />
                <p className="text-xs text-[#1F2933]/40 mt-1">
                  Required — displayed as the video preview before playback.
                </p>
                {thumbnailFile && (
                  <p className="text-xs text-[#8FA87A] mt-1">✓ {thumbnailFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Transcript <span className="text-[#1F2933]/40 font-normal">(optional)</span>
                </label>
                <textarea
                  value={videoTranscript}
                  onChange={(e) => setVideoTranscript(e.target.value)}
                  placeholder="Transcript of the video..."
                  rows={3}
                  className={inputClass + ' resize-none'}
                />
              </div>
            </>
          )}

          {/* Audio fields */}
          {messageType === 'audio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Audio File <span className="text-red-400">*</span>
                </label>
                <input
                  ref={audioRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className={inputClass}
                  required
                />
                {audioFile && (
                  <p className="text-xs text-[#8FA87A] mt-1">✓ {audioFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                  Transcript <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type the transcript of the audio here..."
                  rows={5}
                  className={inputClass + ' resize-none'}
                  required
                />
              </div>
            </>
          )}

          {/* Letter fields */}
          {messageType === 'letter' && (
            <div>
              <label className="block text-sm font-medium text-[#1F2933] mb-1.5">
                Letter Content <span className="text-red-400">*</span>
              </label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="Write your message here..."
                rows={10}
                className={inputClass + ' resize-none leading-relaxed'}
                required
                autoFocus
              />
              <p className="text-xs text-[#1F2933]/40 mt-1">{contentText.length} characters</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {uploading && uploadProgress && (
            <div className="bg-[#4F6D9A]/5 border border-[#4F6D9A]/20 text-[#4F6D9A] text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#4F6D9A] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              {uploadProgress}
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => { setStep(2); setError(''); }}
              disabled={uploading}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-[#1F2933]/60 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3 px-4 rounded-xl bg-[#4F6D9A] text-white font-semibold text-sm hover:bg-[#3E5C86] transition shadow-sm disabled:opacity-60"
            >
              {uploading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
