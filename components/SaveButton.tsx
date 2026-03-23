'use client';

interface SaveButtonProps {
  saved: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export function SaveButton({ saved, onToggle, size = 'md' }: SaveButtonProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      className={`${btnSize} flex items-center justify-center rounded-xl transition-all flex-shrink-0 ${saved ? 'bg-[#8FA87A]/20' : 'bg-[#1F2933]/5 hover:bg-[#1F2933]/10'}`}
      aria-label={saved ? 'Unsave message' : 'Save message'}
    >
      <svg className={`${iconSize} transition-colors ${saved ? 'text-[#8FA87A]' : 'text-[#1F2933]/30'}`}
        fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
