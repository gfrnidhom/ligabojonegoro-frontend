"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="hidden lg:block" style={{
      background: 'var(--bg-card)',
      borderBottom: 'none',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1340, margin: '0 auto', padding: '0 24px',
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 24, letterSpacing: '-0.02em', gap: 4 }}>
            <span style={{ color: 'var(--text-primary)' }}>FOTMOB</span>
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
            background: 'var(--bg-app)', 
            border: '1px solid var(--border)',
            borderRadius: 20, padding: '8px 16px', gap: 12,
            width: 320,
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input 
            name="search"
            type="text" 
            placeholder="Search" 
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 14, 
              outline: 'none', width: '100%', fontWeight: 500,
            }} 
          />
        </form>

        {/* Right: nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16 }}>
          {[
            { label: 'News', href: '/news' },
            { label: 'Transfers', href: '/transfers' },
            { label: 'About', href: '/about' },
            { label: 'TV schedules', href: '/tv' },
          ].map(link => (
            <Link 
              key={link.href} 
              href={link.href}
              style={{ 
                padding: '8px 16px', fontSize: 14, fontWeight: 700, 
                color: 'var(--text-primary)', borderRadius: 20,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
