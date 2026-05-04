"use client";

import Link from 'next/link';
import { Search, Settings } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="hidden lg:block" style={{
      background: 'rgba(2,6,23,0.95)',
      borderBottom: 'none',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto', padding: '0 16px',
        height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 24, letterSpacing: '0.04em' }}>
            <span style={{ color: '#3b82f6' }}>LIGA</span>
            <span style={{ color: '#fbbf24' }}>BOJONEGORO</span>
          </Link>

          {/* Compact Search Bar */}
          <div className="hidden sm:flex" style={{ 
            alignItems: 'center', 
            background: 'rgba(255,255,255,0.07)', 
            borderRadius: 9999, padding: '8px 16px', gap: 10,
            width: 240, marginLeft: 32
          }}>
            <Search size={16} color="#f8fafc" style={{ strokeWidth: 2.5 }} />
            <input 
              type="text" 
              placeholder="Cari" 
              style={{ 
                background: 'transparent', border: 'none', color: '#f8fafc', fontSize: 14, 
                outline: 'none', width: '100%', fontWeight: 500,
              }} 
            />
          </div>
        </div>

        {/* Settings Button */}
        <div>
          <button style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
            color: '#8b92a5', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8b92a5'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
