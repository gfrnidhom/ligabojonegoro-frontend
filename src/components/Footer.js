"use client";
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api';

export default function Footer() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const res = await api.get('/sponsors');
        if (res.data && (res.data.success || res.data.status === 'success')) {
          setSponsors(res.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
      }
    };
    fetchSponsors();
  }, []);

  return (
    <footer style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 24px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ flex: '1 1 260px', minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <img src="/Logo%20Horizontal.png" alt="Liga Bojonegoro" style={{ height: 40, width: 'auto' }} />
            </div>
            <p style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.6, maxWidth: 280 }}>
              Platform resmi skor langsung, jadwal pertandingan, klasemen, dan statistik pemain Liga Bojonegoro.
            </p>
          </div>
          {[
            { title: 'Menu', items: [{ href: '/', l: 'Beranda' }, { href: '/tournaments', l: 'Turnamen' }, { href: '/live', l: 'Pertandingan' }, { href: '/teams', l: 'Klub & Tim' }] },
            { title: 'Informasi', items: [{ l: 'Tentang Kami' }, { l: 'Kebijakan Privasi' }, { l: 'Syarat & Ketentuan' }, { l: 'Hubungi Kami' }] },
            { title: 'Ikuti Kami', items: [{ l: 'Instagram' }, { l: 'Facebook' }, { l: 'YouTube' }, { l: 'Twitter / X' }] },
          ].map((col, i) => (
            <div key={i} style={{ flex: '0 1 auto', minWidth: 120 }}>
              <h4 style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{col.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.items.map((item, j) => item.href ? (
                  <Link key={j} href={item.href} style={{ fontSize: 11, color: '#334155', fontWeight: 500, textDecoration: 'none' }}>{item.l}</Link>
                ) : (
                  <span key={j} style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>{item.l}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Supported By ── */}
        <div style={{ padding: '24px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Supported by
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 24 }}>
            {sponsors.length > 0 ? sponsors.map(sponsor => (
              sponsor.url ? (
                <a key={sponsor.id} href={sponsor.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    style={{
                      maxWidth: '100%', height: 'auto', maxHeight: 48,
                      objectFit: 'contain', opacity: 0.85,
                    }}
                  />
                </a>
              ) : (
                <img
                  key={sponsor.id}
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  style={{
                    maxWidth: '100%', height: 'auto', maxHeight: 48,
                    objectFit: 'contain', opacity: 0.85,
                  }}
                />
              )
            )) : (
              <img
                src="/sponsors.png"
                alt="Supported by"
                style={{
                  maxWidth: '100%', height: 'auto', maxHeight: 48,
                  objectFit: 'contain', opacity: 0.85,
                }}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, gap: 8 }}>
          <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>© {new Date().getFullYear()} Liga Bojonegoro. Hak cipta dilindungi.</span>
          <span style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 500 }}>Powered by Liga Bojonegoro Platform</span>
        </div>
      </div>
    </footer>
  );
}

