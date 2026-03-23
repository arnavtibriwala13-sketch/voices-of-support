'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { uploadMedia, uploadThumbnail } from '@/lib/storage';
import { createMessage } from '@/lib/db';

type MessageType = 'video' | 'audio' | 'letter';
type SenderType = 'family' | 'global';

export default function AdminUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [senderName, setSenderName] = useState('');
  const [senderType, setSenderType] = useState<SenderType>('family');
  const [messageType, setMessageType] = useState<MessageType>('video');
  const [targetUserId, setTargetUserId] = useState('');

  // Video
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState('');

  // Letter
  const [contentText, setContentText] = useState('');

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6E6E6]">
        <div className="w-8 h-8 border-4 border-[#4F6D9A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senderName.trim()) { setError('Sender name is required.'); return; }
    if (!targetUserId.trim()) { setError('Target user ID is required.'); return; }

    setUploading(true);

    try {
      const timestamp = Date.now();
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (messageType === 'video') {
        if (!videoFile) { setError('Please select a video file.'); setUploading(false); return; }
        if (!thumbnailFile) { setError('Please select a thumbnail image.'); setUploading(false); return; }
        mediaUrl = await uploadMedia(videoFile, `videos/${targetUserId}/${timestamp}_${videoFile.name}`);
        thumbnailUrl = await uploadThumbnail(thumbnailFile, `thumbnails/${targetUserId}/${timestamp}_${thumbnailFile.name}`);
      } else if (messageType === 'audio') {
        if (!audioFile) { setError('Please select an audio file.'); setUploading(false); return; }
        mediaUrl = await uploadMedia(audioFile, `audio/${targetUserId}/${timestamp}_${audioFile.name}`);
      } else if (messageType === 'letter') {
        if (!contentText.trim()) { setError('Letter content is required.'); setUploading(false); return; }
      }

      const messageId = await createMessage({
        user_id: targetUserId.trim(),
        sender_name: senderName.trim(),
        sender_type: senderType,
        type: messageType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        transcript: messageType === 'audio' ? transcript.trim() || undefined : undefined,
        content_text: messageType === 'letter' ? contentText.trim() : undefined,
        duration: messageType === 'audio' && duration ? Number(duration) : undefined,
      });

      setSuccess(`Message uploaded successfully! ID: ${messageId}`);
      setSenderName('');
      setTargetUserId('');
      setVideoFile(null);
      setThumbnailFile(null);
      setAudioFile(null);
      setTranscript('');
      setDuration('');
      setContentText('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed. Check your Supabase configuration.');
    } finally {
      setUploading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F7F7F7] text-[#1F2933] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6D9A] focus:border-transparent transition text-sm';
  const labelClass = 'block text-sm font-medium text-[#1F2933] mb-1.5';
  const selectClass = inputClass + ' cursor-pointer';

  return (
    <div className="min-h-screen bg-[#E6E6E6] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[#1F2933]/50 font-medium uppercase tracking-wider">Admin</p>
            <h1 className="text-2xl font-bold text-[#1F2933]">Upload Message</h1>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-[#4F6D9A] font-medium"
          >
            Go to app
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Mom, Staff Sgt. Johnson"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Sender Type</label>
              <select
                value={senderType}
                onChange={(e) => setSenderType(e.target.value as SenderType)}
                className={selectClass}
              >
                <option value="family">Family &amp; Close Circle</option>
                <option value="global">Support from Around the World</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Message Type</label>
              <div className="flex gap-2">
                {(['video', 'audio', 'letter'] as MessageType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMessageType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                      messageType === type
                        ? 'bg-[#4F6D9A] text-white shadow-sm'
                        : 'bg-[#F7F7F7] text-[#1F2933]/60 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Target Soldier User ID</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Supabase auth UUID of the soldier"
                className={inputClass}
                required
              />
              <p className="text-xs text-[#1F2933]/40 mt-1">
                The Supabase user UUID of the soldier who will receive this message.
              </p>
            </div>

            {messageType === 'video' && (
              <>
                <div>
                  <label className={labelClass}>Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Thumbnail Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                    className={inputClass}
                    required
                  />
                  <p className="text-xs text-[#1F2933]/40 mt-1">
                    Required — used as the video poster/preview image.
                  </p>
                </div>
              </>
            )}

            {messageType === 'audio' && (
              <>
                <div>
                  <label className={labelClass}>Audio File</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Duration (seconds, optional)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 120"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Transcript (optional)</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Transcription of the audio message..."
                    rows={4}
                    className={inputClass + ' resize-none'}
                  />
                </div>
              </>
            )}

            {messageType === 'letter' && (
              <div>
                <label className={labelClass}>Letter Content</label>
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Write the letter content here..."
                  rows={8}
                  className={inputClass + ' resize-none'}
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-[#4F6D9A] hover:bg-[#3E5C86] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-sm"
            >
              {uploading ? 'Uploading...' : 'Upload Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
