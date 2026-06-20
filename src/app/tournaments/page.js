"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Search, 
  ChevronRight, 
  ArrowUpRight,
  Filter,
  Users,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';

// Premium Modern Design Tokens (Light Theme)
const COLORS = {
  bg: 'transparent',
  card: '#ffffff',
  border: 'rgba(0,0,0,0.05)',
  primary: '#3b82f6',
  textMain: '#0f172a',
  textSecondary: '#64748b',
};

const getImageUrl = (path) => path ? (path.startsWith('http') ? path : `https://app.ligabojonegoro.id/storage/${path}`) : null;

// Spotlight Card Component (Optimized for Mobile)
const SpotlightCard = ({ children, className = "", style = {}, isFeatured = false }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      style={{
        ...style,
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        transition: 'all 0.3s ease'
      }}
      className={`tournament-card-container ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 md:block hidden"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.08), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get('/tournaments');
        if (response.data.success) {
          setTournaments(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || t.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [tournaments, searchQuery, activeFilter]);

  const getStatusBadge = (status) => {
    const configs = {
      ongoing: { label: 'LIVE', color: '#ef4444' },
      upcoming: { label: 'COMING', color: '#3b82f6' },
      completed: { label: 'ENDED', color: '#64748b' }
    };
    const config = configs[status] || { label: status.toUpperCase(), color: '#64748b' };
    
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 6, 
        padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.9)',
        border: `1px solid ${config.color}40`, backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {status === 'ongoing' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} className="animate-pulse" />}
        <span style={{ fontSize: 10, fontWeight: 800, color: config.color, letterSpacing: '0.05em' }}>{config.label}</span>
      </div>
    );
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textMain, paddingBottom: 120 }}>
      
      {/* ── Header ── */}
      <header className="page-header" style={{ padding: '60px 24px 40px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: 20 }}>
            <Zap size={12} color={COLORS.primary} />
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, letterSpacing: '0.1em' }}>KOMPETISI RESMI 2026</span>
          </div>
          <h1 className="main-title" style={{ fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em', color: '#0f172a' }}>Jelajah Turnamen</h1>
          <p className="sub-title" style={{ maxWidth: 600, margin: '0 auto', color: COLORS.textSecondary, lineHeight: 1.6 }}>Temukan panggung kompetisi terbaik di Kabupaten Bojonegoro.</p>
        </motion.div>
      </header>

      {/* ── Search & Filter (Mobile Sticky) ── */}
      <div className="filter-sticky sticky top-0 lg:top-[72px]" style={{ zIndex: 100, background: 'rgba(242, 242, 242, 0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${COLORS.border}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
            <input 
              type="text" 
              placeholder="Cari turnamen..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', height: 44, background: '#ffffff', 
                border: `1px solid ${COLORS.border}`, borderRadius: 14,
                padding: '0 48px', color: '#0f172a', fontSize: 14, outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>
          {/* Horizontal Scrollable Filters */}
          <div className="filter-scroll hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['all', 'ongoing', 'upcoming', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                  background: activeFilter === f ? COLORS.primary : '#ffffff',
                  color: activeFilter === f ? '#fff' : COLORS.textSecondary,
                  border: `1px solid ${activeFilter === f ? COLORS.primary : COLORS.border}`,
                  transition: 'all 0.2s',
                  boxShadow: activeFilter === f ? '0 4px 12px rgba(59,130,246,0.3)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {f === 'all' ? 'Semua' : f === 'ongoing' ? 'Live' : f === 'upcoming' ? 'Mendatang' : 'Selesai'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tournament Grid ── */}
      <main style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="loader" />
          </div>
        ) : (
          <div className="tournament-grid">
            <AnimatePresence mode="popLayout">
              {filteredTournaments.map((t, idx) => {
                const isFeatured = idx === 0 && !searchQuery && activeFilter === 'all';
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className={isFeatured ? 'featured-item' : ''}
                  >
                    <Link href={`/tournaments/${t.uuid || t.id}`} style={{ textDecoration: 'none' }}>
                      <SpotlightCard className={`tournament-card ${isFeatured ? 'featured-card' : ''}`}>
                        <div className="card-image-wrapper">
                          <img 
                            src={getImageUrl(t.banner_path) || 'https://images.unsplash.com/photo-1518091044184-21f449261c6c?q=80&w=1000&auto=format&fit=crop'} 
                            alt={t.name}
                            className="card-image"
                          />
                          <div className="card-overlay" />
                          <div className="card-status-badge">{getStatusBadge(t.status)}</div>
                        </div>

                        <div className="card-content">
                          <div className="card-meta">
                            <span className="sport-tag">{t.sport?.name || 'MULTI'}</span>
                            <span className="teams-count"><Users size={12} /> {t.teams?.length || 0} Tim</span>
                          </div>
                          
                          <h3 className="card-title">{t.name}</h3>
                          
                          <div className="card-details">
                            <div className="detail-item">
                              <MapPin size={14} color={COLORS.primary} />
                              <span>{t.location || 'Bojonegoro'}</span>
                            </div>
                            <div className="detail-item">
                              <Calendar size={14} color={COLORS.primary} />
                              <span>{t.start_date ? new Date(t.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Segera'}</span>
                            </div>
                          </div>

                          <div className="card-footer">
                            <div className="organizer">
                              <img src={getImageUrl(t.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=f1f5f9&color=3b82f6&bold=true`} alt="Logo" />
                              <span>Lihat Detail</span>
                            </div>
                            <div className="arrow-icon"><ArrowUpRight size={18} /></div>
                          </div>
                        </div>
                      </SpotlightCard>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredTournaments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: `1px dashed ${COLORS.border}`, borderRadius: 24, background: '#ffffff' }}>
            <Trophy size={48} style={{ color: COLORS.textSecondary, marginBottom: 16, opacity: 0.3 }} />
            <p style={{ color: COLORS.textSecondary }}>Tidak ada turnamen ditemukan.</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        /* Global Responsive Variables */
        .main-title { font-size: clamp(2rem, 5vw, 3.5rem); }
        .sub-title { font-size: clamp(0.9rem, 2vw, 1.1rem); }

        /* Grid System */
        .tournament-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
          gap: 20px;
        }

        /* Card Styles */
        .tournament-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .card-image-wrapper {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .card-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 60%); }
        .card-status-badge { position: absolute; top: 16px; left: 16px; }
        .card-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
        .card-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .sport-tag { background: rgba(59,130,246,0.1); color: ${COLORS.primary}; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
        .teams-count { font-size: 11px; font-weight: 600; color: ${COLORS.textSecondary}; display: flex; align-items: center; gap: 4px; }
        .card-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; line-height: 1.3; }
        .card-details { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${COLORS.textSecondary}; font-weight: 500; }
        .card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid ${COLORS.border}; }
        .organizer { display: flex; align-items: center; gap: 10px; }
        .organizer img { width: 28px; height: 28px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); }
        .organizer span { font-size: 12px; font-weight: 700; color: #334155; }
        .arrow-icon { width: 36px; height: 36px; border-radius: 12px; background: #f8fafc; border: 1px solid ${COLORS.border}; display: flex; align-items: center; justify-content: center; color: ${COLORS.primary}; transition: all 0.3s; }

        /* Featured Bento Logic */
        @media (min-width: 1024px) {
          .featured-item { grid-column: span 2; }
          .featured-card { flex-direction: row !important; height: 380px !important; }
          .featured-card .card-image-wrapper { width: 50%; height: 100%; }
          .featured-card .card-overlay { background: linear-gradient(to right, rgba(255,255,255,1) 0%, transparent 60%); }
          .featured-card .card-title { font-size: 28px; }
        }

        /* Hover States */
        .tournament-card:hover .card-image { transform: scale(1.08); }
        .tournament-card:hover .arrow-icon { background: ${COLORS.primary}; color: #fff; transform: rotate(45deg); border-color: ${COLORS.primary}; }

        /* Loader & Scroll */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .loader { width: 32px; height: 32px; border: 3px solid rgba(0,0,0,0.05); border-radius: 50%; border-top-color: ${COLORS.primary}; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .page-header { padding: 40px 20px 24px !important; }
          .filter-sticky { padding: 12px 16px !important; }
          .tournament-grid { grid-template-columns: 1fr; }
          .card-content { padding: 20px; }
          .card-title { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
