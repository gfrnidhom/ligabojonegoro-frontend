"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="hidden lg:block" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      position: 'sticky', top: 0, zIndex: 50,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: 1340, margin: '0 auto', padding: '0 24px',
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 19, letterSpacing: '-0.03em', gap: 6, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1 }}>LB</span>
            </div>
            <span style={{ color: '#111827' }}>Liga Bojonegoro</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form 
          className="hidden sm:flex" 
          onSubmit={(e) => {
            e.preventDefault();
            const q = e.target.search.value.trim();
            if(q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }}
          style={{ 
            alignItems: 'center', 
            background: '#f1f5f9', 
            border: '1px solid transparent',
            borderRadius: 24, padding: '10px 18px', gap: 12,
            width: 360, transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.border = '1px solid #e2e8f0';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(241, 245, 249, 1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.border = '1px solid transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Search size={18} color="#94a3b8" />
          <input 
            name="search"
            type="text" 
            placeholder="Cari tim, pemain, atau turnamen..." 
            style={{ 
              background: 'transparent', border: 'none', color: '#0f172a', fontSize: 12, 
              outline: 'none', width: '100%', fontWeight: 500,
            }} 
          />
        </form>

        {/* Right: nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16 }}>
          {[
            { label: 'Berita', href: '/news' },
            { label: 'Turnamen', href: '/tournaments' },
            { label: 'Tentang', href: '/about' },
          ].map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              style={{ 
                padding: '10px 16px', fontSize: 12, fontWeight: 600, 
                color: '#475569', borderRadius: 20,
                transition: 'all 0.2s ease', textDecoration: 'none'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = '#f1f5f9'; 
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = 'transparent'; 
                e.currentTarget.style.color = '#475569';
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
