'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/home', label: 'Home',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/letters', label: 'Letters',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    href: '/video', label: 'Video',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  },
  {
    href: '/audio', label: 'Audio',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  },
  {
    href: '/vault', label: 'Vault',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  },
  {
    href: '/create', label: 'Create',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  },
  {
    href: '/contacts', label: 'Contacts',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/created', label: 'Sent',
    icon: (a: boolean) => <svg className={`w-5 h-5 ${a ? 'text-[#E6E6E6]' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#3E5C86] border-t border-white/10 shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
      <div className="max-w-lg mx-auto overflow-x-auto">
        <div className="flex items-center px-2 py-2" style={{ minWidth: 'max-content', margin: '0 auto', justifyContent: 'center' }}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href + '/'));
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                {item.icon(active)}
                <span className={`text-[9px] font-medium leading-none ${active ? 'text-[#E6E6E6]' : 'text-white/40'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
