'use client';

interface LetterViewProps {
  content: string;
  senderName: string;
  senderType: 'family' | 'global';
}

export function LetterView({ content, senderName, senderType }: LetterViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Letter header */}
      <div className="bg-gradient-to-r from-[#4F6D9A]/10 to-[#8FA87A]/10 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#4F6D9A]/15 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#4F6D9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#1F2933]/50">A letter from</p>
            <p className="font-bold text-[#1F2933] text-lg">{senderName}</p>
            <p className="text-xs text-[#4F6D9A] font-medium mt-0.5">
              {senderType === 'family' ? 'Family & Close Circle' : 'Support from Around the World'}
            </p>
          </div>
        </div>
      </div>

      {/* Letter body */}
      <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <p className="text-[#1F2933] text-base leading-8 whitespace-pre-line font-serif">
            {content}
          </p>
        </div>
      </div>

      {/* Letter footer */}
      <div className="px-6 py-4 border-t border-gray-50">
        <p className="text-sm text-[#1F2933]/60 italic text-right">
          — {senderName}
        </p>
      </div>
    </div>
  );
}
