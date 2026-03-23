'use client';

import { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  transcript?: string;
  senderName?: string;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ src, transcript, senderName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Player card */}
      <div className="bg-[#E6E6E6] rounded-2xl p-5">
        {senderName && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#4F6D9A]/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#4F6D9A]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#1F2933]/50">Audio message from</p>
              <p className="font-semibold text-[#1F2933]">{senderName}</p>
            </div>
          </div>
        )}

        {/* Waveform visualization */}
        <div className="flex items-end justify-center gap-0.5 h-12 mb-4 px-2">
          {Array.from({ length: 40 }).map((_, i) => {
            const heights = [30, 60, 45, 80, 55, 70, 40, 90, 65, 50, 75, 35, 85, 60, 45, 70, 55, 80, 40, 65, 75, 50, 90, 35, 60, 80, 45, 70, 55, 40, 85, 60, 75, 50, 65, 80, 35, 70, 55, 45];
            const pct = (i / 40) * 100;
            const isPlayed = pct <= progress;
            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-colors ${
                  isPlayed ? 'bg-[#4F6D9A]' : 'bg-[#4F6D9A]/20'
                }`}
                style={{ height: `${heights[i] % 100}%` }}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-11 h-11 bg-[#4F6D9A] hover:bg-[#3E5C86] text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors shadow-sm"
          >
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            <div className="relative h-1.5 bg-[#1F2933]/15 rounded-full mb-1">
              <div
                className="absolute left-0 top-0 h-full bg-[#4F6D9A] rounded-full"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#1F2933]/50">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-[#E6E6E6] rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-[#1F2933]/50 uppercase tracking-wider mb-3">
            Transcript
          </h3>
          <p className="text-[#1F2933] text-sm leading-relaxed whitespace-pre-line">{transcript}</p>
        </div>
      )}
    </div>
  );
}
