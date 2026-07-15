"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Trophy, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const SPORT_ICONS = {
  football: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 12l3.5-2m-3.5 2l-3.5-2m3.5 2v4m-5.5-2l-2 3.5m15-3.5l2 3.5"/></svg>,
  volleyball: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12a14.5 14.5 0 0 0 20 0"/></svg>,
  basketball: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2v20"/><path d="M4.93 4.93c3.9 3.9 3.9 10.24 0 14.14"/><path d="M19.07 19.07c-3.9-3.9-3.9-10.24 0-14.14"/></svg>,
  tennis: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.9 3.9 10.24 3.9 14.14 0"/><path d="M19.07 19.07c-3.9-3.9-10.24-3.9-14.14 0"/></svg>,
};
SPORT_ICONS.futsal = SPORT_ICONS.football;
SPORT_ICONS.badminton = SPORT_ICONS.tennis;
SPORT_ICONS.baseball = SPORT_ICONS.football;
SPORT_ICONS.hockey = SPORT_ICONS.football;
SPORT_ICONS['table-tennis'] = SPORT_ICONS.tennis;
SPORT_ICONS.cricket = SPORT_ICONS.football;

const SPORT_LABELS = {
  football: 'Sepak Bola',
  volleyball: 'Bola Voli',
  futsal: 'Futsal',
  badminton: 'Bulutangkis',
  basketball: 'Bola Basket',
  tennis: 'Tenis',
  baseball: 'Bisbol',
  hockey: 'Hoki',
  'table-tennis': 'Tenis Meja',
};

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sports, setSports] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [mobileSportsOpen, setMobileSportsOpen] = useState(false);
  
  const activeSportId = searchParams.get('sport') ? parseInt(searchParams.get('sport')) : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, mRes] = await Promise.all([
          api.get('/sports'),
          api.get('/matches', { params: { per_page: 100 } })
        ]);
        if (sRes.data?.success) setSports(sRes.data.data || []);
        if (mRes.data?.success) {
          const count = (mRes.data.data || []).filter(m => 
            ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status)
          ).length;
          setLiveCount(count);
        }
      } catch (e) {
        console.error('Error fetching Navbar data:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSportSelect = (sportId) => {
    setMobileSportsOpen(false);
    if (sportId) {
      router.push(`/?sport=${sportId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <>
    {/* Desktop Navbar */}
    <nav className="hidden lg:block" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      position: 'sticky', top: 0, zIndex: 50,
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: 1340, margin: '0 auto', padding: '0 24px',
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/Logo%20Horizontal.png" alt="Liga Bojonegoro" style={{ height: 46, width: 'auto' }} />
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
    
    {/* Mobile Navbar */}
    <div className="flex justify-between items-center lg:hidden" style={{
      padding: '14px 16px', 
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
      position: 'sticky', top: 0, zIndex: 60
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/Logo%20Vertical.png" alt="Liga Bojonegoro" style={{ height: 46, width: 'auto' }} />
        </Link>
        <button
          onClick={() => setMobileSportsOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0, 0, 0, 0.04)', 
            padding: '6px 12px', borderRadius: 20,
            color: 'var(--text-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {(() => {
            const currentSportObj = sports.find(s => s.id === activeSportId);
            const label = currentSportObj ? (SPORT_LABELS[currentSportObj.slug] || currentSportObj.name) : 'Semua Olahraga';
            const icon = currentSportObj ? (SPORT_ICONS[currentSportObj.slug] || <Trophy size={13} />) : <Trophy size={13} />;
            return (
              <>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)' }}>{icon}</span>
                <span>{label}</span>
                <ChevronDown size={12} style={{ opacity: 0.7, marginLeft: 2 }} />
              </>
            );
          })()}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {liveCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.15)',
            padding: '5px 10px', borderRadius: 20, fontSize: 9, fontWeight: 800, color: '#ef4444',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulseDot 1.2s infinite' }}></span>
            {liveCount} Live
          </div>
        )}
        <button 
          onClick={() => router.push('/search')}
          style={{
            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.04)', color: 'var(--text-primary)',
            transition: 'background 0.2s ease',
            cursor: 'pointer'
          }}>
          <Search size={16} />
        </button>
      </div>
    </div>

    {/* Mobile Sports Dropdown Drawer */}
    <AnimatePresence>
      {mobileSportsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSportsOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1000
            }}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
              background: '#ffffff', borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: '24px 16px 40px',
              maxHeight: '60vh', overflowY: 'auto',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Top notch */}
            <div style={{ width: 40, height: 4, background: 'rgba(0, 0, 0, 0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Pilih Olahraga</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => handleSportSelect(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
                  background: !activeSportId ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                  border: '1px solid', borderColor: !activeSportId ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.03)',
                  color: !activeSportId ? '#3b82f6' : '#334155', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Trophy size={20} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Semua Olahraga</span>
              </button>
              {sports.map(sport => {
                const isActive = activeSportId === sport.id;
                const label = SPORT_LABELS[sport.slug] || sport.name;
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSportSelect(sport.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
                      background: isActive ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                      border: '1px solid', borderColor: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.03)',
                      color: isActive ? '#3b82f6' : '#334155', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                      {SPORT_ICONS[sport.slug] ? (
                        <div style={{ transform: 'scale(1.25)' }}>{SPORT_ICONS[sport.slug]}</div>
                      ) : (
                        <Trophy size={20} />
                      )}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
