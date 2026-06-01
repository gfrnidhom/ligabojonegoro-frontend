"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="hidden lg:block" style={{
      background: 'var(--bg-card-solid)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '0 16px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 20, letterSpacing: '0.02em', gap: 1 }}>
            <span style={{ color: 'var(--primary)' }}>LIGA</span>
            <span style={{ color: '#fbbf24' }}>BOJONEGORO</span>
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
            background: 'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(13,17,23,0.8))', 
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 9999, padding: '7px 16px', gap: 8,
            width: 280,
            boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.1)'
          }}
        >
          <Search size={14} color="#f59e0b" />
          <input 
            name="search"
            type="text" 
            placeholder="Cari tim, pemain, turnamen..." 
            style={{ 
              background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: 13, 
              outline: 'none', width: '100%', fontWeight: 500,
            }} 
          />
        </form>

        {/* Right: nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 16 }}>
          {[
            { label: 'Pertandingan', href: '/' },
            { label: 'Turnamen', href: '/tournaments' },
            { label: 'Klasemen', href: '/standings' },
            { label: 'Statistik', href: '/stats' },
          ].map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              style={{ 
                padding: '6px 12px', fontSize: 13, fontWeight: 600, 
                color: 'var(--text-secondary)', borderRadius: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
