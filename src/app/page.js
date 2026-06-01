"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Calendar, Star, Zap, CircleDot, Volleyball, Footprints, BadgeCheck, X, Home as HomeIcon, Flame, CheckCircle, Award, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MatchDetailPanel from '../components/MatchDetailPanel';
import api, { getImageUrl } from '../api';

// SVG Icons for sports
const FootballSvg = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 12l3.5-2m-3.5 2l-3.5-2m3.5 2v4m-5.5-2l-2 3.5m15-3.5l2 3.5"/>
  </svg>
);
const VolleyballSvg = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12a14.5 14.5 0 0 0 20 0"/>
  </svg>
);
const BasketballSvg = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2v20"/><path d="M4.93 4.93c3.9 3.9 3.9 10.24 0 14.14"/><path d="M19.07 19.07c-3.9-3.9-3.9-10.24 0-14.14"/>
  </svg>
);
const TennisSvg = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.9 3.9 10.24 3.9 14.14 0"/><path d="M19.07 19.07c-3.9-3.9-10.24-3.9-14.14 0"/>
  </svg>
);

// Icon mapping for sports
const SPORT_ICONS = {
  football: <FootballSvg size={16} />,
  volleyball: <VolleyballSvg size={16} />,
  futsal: <FootballSvg size={16} />,
  badminton: <TennisSvg size={16} />,
  basketball: <BasketballSvg size={16} />,
  tennis: <TennisSvg size={16} />,
  baseball: <FootballSvg size={16} />,
  hockey: <FootballSvg size={16} />,
  'table-tennis': <TennisSvg size={16} />,
  cricket: <FootballSvg size={16} />,
};

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

const formatGameMinute = (minute) => {
  if (minute === null || minute === undefined) return '';
  if (typeof minute === 'number') return Math.floor(minute);
  const parsed = parseFloat(minute);
  if (!isNaN(parsed) && String(minute).includes('.')) {
    return Math.floor(parsed);
  }
  return minute;
};

function getDateRange() {
  const dates = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'live', label: 'Langsung', live: true },
  { id: 'scheduled', label: 'Mendatang' },
  { id: 'finished', label: 'Selesai' },
];

function Home() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [activeTournament, setActiveTournament] = useState(null);
  const [activeSport, setActiveSport] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [playerStats, setPlayerStats] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [mobileTab, setMobileTab] = useState('matches');
  const [mobileSportsOpen, setMobileSportsOpen] = useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (filterParam) {
      if (STATUS_FILTERS.find(f => f.id === filterParam)) {
        setStatusFilter(filterParam);
        setMobileTab('matches');
      } else if (filterParam === 'leagues') {
        setMobileTab('leagues');
      }
    }
  }, [filterParam]);

  const handleMatchClick = (matchId) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      router.push(`/matches/${matchId}`);
    } else {
      setSelectedMatchId(prev => prev === matchId ? null : matchId);
    }
  };

  useEffect(() => {
    const handleOpenStats = (e) => {
      if (e.detail?.id) {
        setSelectedPlayerId(e.detail.id);
      }
    };
    window.addEventListener('open-player-stats', handleOpenStats);
    return () => window.removeEventListener('open-player-stats', handleOpenStats);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const dateRange = useMemo(() => getDateRange(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, tRes, sRes] = await Promise.all([
          api.get('/matches', { params: { per_page: 100 } }),
          api.get('/tournaments'),
          api.get('/sports'),
        ]);
        const mData = mRes.data.success ? (mRes.data.data || []) : [];
        setMatches(mData);
        if (tRes.data.success) setTournaments(tRes.data.data || []);
        if (sRes.data.success) setSports(sRes.data.data || []);

        // Fetch banners (graceful fallback)
        try {
          const bRes = await api.get('/banners');
          if (bRes.data.success && bRes.data.data?.length > 0) setBanners(bRes.data.data);
        } catch (e) {
          // API might not exist yet — use fallback banners
          setBanners([
            { id: 1, title: 'Liga Bojonegoro 2026', subtitle: 'Musim baru telah dimulai! Saksikan pertandingan seru setiap minggu.', color: '#3b82f6' },
            { id: 2, title: 'Daftar Tim Sekarang', subtitle: 'Pendaftaran tim untuk turnamen baru telah dibuka.', color: '#059669' },
            { id: 3, title: 'Unduh Aplikasi', subtitle: 'Dapatkan notifikasi pertandingan langsung di ponselmu.', color: '#7c3aed' },
          ]);
        }

        // Auto-select is now handled by a separate useEffect based on filteredMatches
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, []);

  // Auto-slide banner
  useEffect(() => {
    if (banners.length <= 1) return;
    const iv = setInterval(() => setBannerIdx(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(iv);
  }, [banners.length]);

  // Filter tournaments by selected sport
  const filteredTournaments = useMemo(() => {
    if (!activeSport) return tournaments;
    return tournaments.filter(t => t.sport_id === activeSport);
  }, [tournaments, activeSport]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];
    // Filter by sport (via tournament)
    if (activeSport) {
      const sportTournamentIds = filteredTournaments.map(t => t.id);
      list = list.filter(m => sportTournamentIds.includes(m.tournament_id));
    }
    if (activeTournament) list = list.filter(m => m.tournament_id === activeTournament);
    if (selectedDate) {
      const targetDateStr = selectedDate.toLocaleDateString('en-CA');
      list = list.filter(m => {
        if (!m.scheduled_at) return false;
        const matchDateLocal = new Date(m.scheduled_at).toLocaleDateString('en-CA');
        return matchDateLocal === targetDateStr;
      });
    }
    if (statusFilter === 'live') list = list.filter(m => ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status));
    else if (statusFilter === 'scheduled') list = list.filter(m => m.status === 'scheduled');
    else if (statusFilter === 'finished') list = list.filter(m => m.status === 'finished');

    list.sort((a, b) => {
      const isALive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(a.status);
      const isBLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(b.status);
      if (isALive && !isBLive) return -1;
      if (!isALive && isBLive) return 1;
      return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    });
    return list;
  }, [matches, selectedDate, statusFilter, activeTournament, activeSport, filteredTournaments]);

  // Auto-select match from current filtered list
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
    if (filteredMatches.length === 0) return;
    
    // If the currently selected match is still visible in the current view, keep it selected.
    if (selectedMatchId && filteredMatches.some(m => (m.uuid || m.id) === selectedMatchId)) {
      return;
    }

    const now = new Date();
    
    // 1. Live Match
    const live = filteredMatches.find(m => ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status));
    if (live) {
      setSelectedMatchId(live.uuid || live.id);
      return;
    }
    
    // 2. Upcoming closest to now
    const upcoming = filteredMatches
      .filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    if (upcoming.length > 0) {
      setSelectedMatchId(upcoming[0].uuid || upcoming[0].id);
      return;
    }
    
    // 3. Finished closest to now (most recently finished)
    const finished = filteredMatches
      .filter(m => m.status === 'finished')
      .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    if (finished.length > 0) {
      setSelectedMatchId(finished[0].uuid || finished[0].id);
      return;
    }

    // 4. Fallback
    setSelectedMatchId(filteredMatches[0].uuid || filteredMatches[0].id);
  }, [filteredMatches, selectedMatchId]);

  // Fetch top scorers / player stats
  useEffect(() => {
    const fetchPlayerStats = async () => {
      const tId = activeTournament || tournaments[0]?.id;
      if (!tId) return;

      try {
        const res = await api.get('/player-stats', { params: { tournament_id: tId, limit: 5 } });
        if (res.data.success) {
          setPlayerStats(res.data.data.top_scorers || []);
        }
      } catch (err) {
        console.error('Error fetching player stats:', err);
      }
    };

    fetchPlayerStats();
  }, [activeTournament, tournaments]);

  // Fetch single player detail
  useEffect(() => {
    if (!selectedPlayerId) {
      setPlayerDetail(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const tId = activeTournament || tournaments[0]?.id;
        const res = await api.get(`/player-stats/${selectedPlayerId}`, { params: { tournament_id: tId } });
        if (res.data.success) {
          setPlayerDetail(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching player detail:', err);
      }
    };

    fetchDetail();
  }, [selectedPlayerId, activeTournament, tournaments]);

  const groupedMatches = useMemo(() => {
    const g = {};
    filteredMatches.forEach(m => {
      const key = m.tournament?.name || 'Lainnya';
      if (!g[key]) g[key] = { tournament: m.tournament, matches: [] };
      g[key].matches.push(m);
    });
    return g;
  }, [filteredMatches]);

  const liveCount = matches.filter(m => ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status)).length;

  const isToday = d => {
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };
  const isSame = (a, b) => a && b && a.toDateString() === b.toDateString();

  const avatar = (name, bg = '3b82f6') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=48&background=${bg}&color=fff&bold=true&font-size=0.38`;

  const liveMatches = matches.filter(m => ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status));
  const featuredLive = liveMatches[0] || null;

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* ═══ Mobile Header ═══ */}
      {isMounted && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'var(--bg-card-solid)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 60
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.02em' }}>
              <span style={{ color: 'var(--primary)' }}>LIGA</span>
              <span style={{ color: '#fbbf24' }}>BJN</span>
            </span>
            <button
              onClick={() => setMobileSportsOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                padding: '5px 10px', borderRadius: 6,
                color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {(() => {
                const currentSportObj = sports.find(s => s.id === activeSport);
                const label = currentSportObj ? (SPORT_LABELS[currentSportObj.slug] || currentSportObj.name) : 'Semua Olahraga';
                const icon = currentSportObj ? (SPORT_ICONS[currentSportObj.slug] || <Trophy size={14} />) : <Trophy size={14} />;
                return (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                    <span>{label}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>▾</span>
                  </>
                );
              })()}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {liveCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--accent-soft)', border: '1px solid rgba(239,68,68,0.2)',
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseDot 1.2s infinite' }}></span>
                {liveCount} Live
              </div>
            )}
            <button 
              onClick={() => router.push('/search')}
              style={{
                width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Sports Dropdown Drawer ── */}
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
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000
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
                background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: '24px 16px 40px',
                maxHeight: '60vh', overflowY: 'auto',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.4)'
              }}
            >
              {/* Top notch */}
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>Pilih Olahraga</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => { setActiveSport(null); setActiveTournament(null); setMobileSportsOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
                    background: !activeSport ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid', borderColor: !activeSport ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                    color: !activeSport ? '#3b82f6' : '#e2e8f0', cursor: 'pointer'
                  }}
                >
                  <Trophy size={20} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Semua Olahraga</span>
                </button>
                {sports.map(sport => {
                  const isActive = activeSport === sport.id;
                  const label = SPORT_LABELS[sport.slug] || sport.name;
                  return (
                    <button
                      key={sport.id}
                      onClick={() => { setActiveSport(isActive ? null : sport.id); setActiveTournament(null); setMobileSportsOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
                        background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid', borderColor: isActive ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#3b82f6' : '#e2e8f0', cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                        {SPORT_ICONS[sport.slug] ? (
                          <div style={{ transform: 'scale(1.25)' }}>{SPORT_ICONS[sport.slug]}</div>
                        ) : (
                          <Trophy size={20} />
                        )}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Calendar Dropdown Drawer ── */}
      <AnimatePresence>
        {mobileCalendarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCalendarOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000
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
                background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: '24px 16px 40px',
                maxHeight: '60vh', overflowY: 'auto',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.4)'
              }}
            >
              {/* Top notch */}
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginBottom: 16, textAlign: 'center' }}>Pilih Tanggal</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  style={{ color: '#8b92a5', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                  ◀
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                  {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  style={{ color: '#8b92a5', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                  ▶
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, textAlign: 'center' }}>
                {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                  <span key={d} style={{ fontSize: 11, fontWeight: 700, color: '#555d75' }}>{d}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {Array(getFirstDayOfMonth(calendarMonth.getFullYear(), calendarMonth.getMonth())).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array(getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth())).fill(null).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                  const isSelected = isSame(dateObj, selectedDate);
                  const isTdy = isSame(dateObj, new Date());
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(dateObj);
                        setMobileCalendarOpen(false);
                      }}
                      style={{
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: isSelected || isTdy ? 700 : 500, borderRadius: 10,
                        color: isSelected ? '#fff' : isTdy ? '#3b82f6' : '#e8eaed',
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : isTdy ? 'rgba(59,130,246,0.15)' : 'transparent',
                        boxShadow: isSelected ? '0 2px 10px rgba(59,130,246,0.4)' : 'none',
                        border: '1px solid',
                        borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Hero removed — Sofascore-style: straight to content */}

      {/* ═══ MAIN LAYOUT ═══ */}
      <div style={{ display: 'flex', gap: 0, padding: '0' }}>

      {/* ═══ CONTENT AREA (center wrapper) ═══ */}
      <div 
        style={{
          width: '100%', display: 'flex', gap: 0, maxWidth: 1400, margin: '0 auto', minWidth: 0,
          ...(isMounted && typeof window !== 'undefined' && window.innerWidth >= 1024 ? {
            padding: '0 0 16px 0'
          } : {
            padding: '0px 0px 76px 0px'
          })
        }} 
        className="flex-col lg:flex-row lg:pb-4"
      >

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className={`${mobileTab === 'leagues' ? 'block' : 'hidden'} lg:block w-full lg:w-[200px] flex-shrink-0`} style={{ borderRight: '1px solid var(--border)' }}>
        <div style={{ position: 'sticky', top: 56 }}>
          <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Turnamen
            </span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }} className="sidebar-scroll">
            <div
              onClick={() => setActiveTournament(null)}
              className={`league-item ${!activeTournament ? 'active' : ''}`}
            >
              <Zap size={14} color={!activeTournament ? '#60a5fa' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Semua Pertandingan</span>
            </div>

            {filteredTournaments.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTournament(activeTournament === t.id ? null : t.id)}
                className={`league-item ${activeTournament === t.id ? 'active' : ''}`}
              >
                <img src={getImageUrl(t.logo_path || t.logo) || avatar(t.name, '3b82f6')} className="league-logo" alt={t.name} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══ CENTER ═══ */}
      <main className={`${mobileTab === 'matches' ? 'block' : 'hidden'} lg:block flex-1 min-w-0`} style={{ flex: 1, minWidth: 0 }}>

         {/* ── Sports Horizontal Bar (Glass) ── */}
        <div className="hidden lg:flex" style={{
          gap: 4, padding: '10px 16px',
          margin: '12px 14px 0', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(13,17,23,0.8) 100%)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(245,158,11,0.04)',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => { setActiveSport(null); setActiveTournament(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              background: !activeSport ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))' : 'transparent',
              color: !activeSport ? '#f59e0b' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: !activeSport ? '0 2px 8px rgba(245,158,11,0.12)' : 'none',
              transition: 'all 0.15s ease', cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}><Trophy size={13} /></span> Semua
          </button>
          {sports.map(sport => {
            const isActive = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => { setActiveSport(isActive ? null : sport.id); setActiveTournament(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                  borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  background: isActive ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))' : 'transparent',
                  color: isActive ? '#f59e0b' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: isActive ? '0 2px 8px rgba(245,158,11,0.12)' : 'none',
                  transition: 'all 0.15s ease', cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{SPORT_ICONS[sport.slug] || <Trophy size={13} />}</span>
                {SPORT_LABELS[sport.slug] || sport.name}
              </button>
            );
          })}
        </div>

        {/* ── Date Bar + Filters (Glass Card) ── */}
        <div style={{
          overflow: 'visible', zIndex: 50, position: 'relative',
          margin: '8px 14px 12px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(13,17,23,0.8) 100%)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(245,158,11,0.04)',
        }}>
          {/* Date strip */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ position: 'relative' }} ref={datePickerRef}>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileCalendarOpen(true);
                  } else {
                    setShowDatePicker(!showDatePicker);
                  }
                }}
                style={{
                  padding: '0 12px', height: '100%',
                  display: 'flex', alignItems: 'center',
                  color: showDatePicker ? 'var(--primary)' : 'var(--text-muted)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                  transition: 'color 0.15s ease',
                  cursor: 'pointer'
                }} title="Pilih Tanggal">
                <Calendar size={15} />
              </button>
              
              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                  background: 'var(--bg-card-solid)', border: '1px solid var(--border-glass)', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  padding: 14, width: 250
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      style={{ color: 'var(--text-secondary)', padding: 4, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>
                      ◀
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      style={{ color: 'var(--text-secondary)', padding: 4, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>
                      ▶
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6, textAlign: 'center' }}>
                    {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                      <span key={d} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                    {Array(getFirstDayOfMonth(calendarMonth.getFullYear(), calendarMonth.getMonth())).fill(null).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array(getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth())).fill(null).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const isSelected = isSame(dateObj, selectedDate);
                      const isTdy = isSame(dateObj, new Date());
                      return (
                        <button
                          key={day}
                          onClick={() => { setSelectedDate(dateObj); setShowDatePicker(false); }}
                          style={{
                            aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: isSelected || isTdy ? 700 : 500, borderRadius: 6,
                            color: isSelected ? '#fff' : isTdy ? 'var(--primary)' : 'var(--text-primary)',
                            background: isSelected ? 'var(--primary)' : isTdy ? 'var(--primary-light)' : 'transparent',
                            transition: 'all 0.15s ease', cursor: 'pointer',
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', overflowX: 'auto' }} className="hide-scrollbar">
              {dateRange.map((date, i) => {
                const today = isToday(date);
                const active = isSame(date, selectedDate);
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(active ? null : date)}
                    className={`date-tab ${active ? 'active' : ''} ${today && !active ? 'today' : ''}`}
                  >
                    <span className="day-label">{today ? 'Hari Ini' : DAY_NAMES[date.getDay()]}</span>
                    <span className="date-num">{date.getDate()}/{(date.getMonth()+1).toString().padStart(2,'0')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline Filters + View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 4, overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)' }} className="hide-scrollbar">
            {STATUS_FILTERS.map(f => {
              const isActive = statusFilter === f.id;
              let cls = 'filter-pill ';
              if (!isActive) cls += 'inactive';
              else if (f.live) cls += 'active-accent';
              else cls += 'active-primary';
              return (
                <button key={f.id} onClick={() => setStatusFilter(f.id)} className={cls}>
                  {f.live && <span className="live-dot"></span>}
                  {f.label}
                  {f.live && liveCount > 0 && <span className="count-badge">{liveCount}</span>}
                </button>
              );
            })}

            {/* View Mode Toggle — single button, switches icon */}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={viewMode === 'list' ? 'Tampilan Grid' : 'Tampilan List'}
              style={{
                marginLeft: 'auto', flexShrink: 0,
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              {viewMode === 'list' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <div className="loader"></div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>Memuat pertandingan...</span>
          </div>
        ) : Object.keys(groupedMatches).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...(isMounted && typeof window !== 'undefined' && window.innerWidth < 1024 ? { padding: '0 12px' } : {}) }}>
            {Object.entries(groupedMatches).map(([name, group]) => (
              <div key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                <div 
                  onClick={() => (group.tournament?.uuid || group.tournament?.id) && router.push(`/tournaments/${group.tournament.uuid || group.tournament.id}`)}
                  style={{ 
                    cursor: (group.tournament?.uuid || group.tournament?.id) ? 'pointer' : 'default', 
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <img
                    src={getImageUrl(group.tournament?.logo_path || group.tournament?.logo) || avatar(name, '3b82f6')}
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }}
                    alt=""
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{name}</span>
                  {group.tournament?.sport && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {SPORT_LABELS[group.tournament.sport?.slug] || ''}
                    </span>
                  )}
                </div>

                <div>
                  {viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: '14px' }}>
                      {group.matches.map(match => {
                        const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(match.status);
                        const isFinished = match.status === 'finished';
                        const hasScore = isLive || isFinished;
                        const time = match.scheduled_at
                          ? new Date(match.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-';
                        const isSelected = selectedMatchId === (match.uuid || match.id);
                        
                        return (
                          <div
                            key={match.id}
                            onClick={() => handleMatchClick(match.uuid || match.id)}
                            style={{
                              background: isSelected 
                                ? 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,23,42,0.9) 60%, rgba(10,10,15,0.95) 100%)',
                              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                              border: 'none',
                              borderRadius: 16,
                              padding: '18px 16px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isSelected 
                                ? '0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(245,158,11,0.15)' 
                                : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                              overflow: 'hidden',
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(15,23,42,0.92) 60%, rgba(10,10,15,0.95) 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,23,42,0.9) 60%, rgba(10,10,15,0.95) 100%)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            {/* Top row: spacer - status - expand */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, width: '100%' }}>
                              <div style={{ width: 28 }} /> 
                              {isLive ? (
                                <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.05em', animation: 'pulseGlow 2s infinite' }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }}></span>
                                  LIVE
                                </div>
                              ) : isFinished ? (
                                <div style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                  SELESAI
                                </div>
                              ) : (
                                <div style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                  {time}
                                </div>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/matches/${match.uuid || match.id}`); }}
                                style={{
                                  width: 28, height: 28, borderRadius: 8,
                                  background: 'rgba(255,255,255,0.06)', color: '#8b92a5',
                                  border: 'none',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.2s', flexShrink: 0
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; e.currentTarget.style.color = '#f59e0b'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b92a5'; }}
                              >
                                <Maximize2 size={13} />
                              </button>
                            </div>

                            {/* Teams & Score */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                <div style={{ width: 50, height: 50, marginBottom: 10 }}>
                                  <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} alt="" />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team?.name}</span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ 
                                  background: 'rgba(0,0,0,0.4)', 
                                  borderRadius: 12, 
                                  padding: '6px 14px', 
                                  display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                  {hasScore ? (
                                    <>
                                      <span style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{match.home_score}</span>
                                      <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>-</span>
                                      <span style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{match.away_score}</span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>VS</span>
                                  )}
                                </div>
                                {isLive && match.minute && (
                                  <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 800, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulseGlow 1s infinite' }}></span>
                                    {formatGameMinute(match.minute)}&apos;
                                  </div>
                                )}
                              </div>

                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                <div style={{ width: 50, height: 50, marginBottom: 10 }}>
                                  <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} alt="" />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.away_team?.name}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {group.matches.map(match => {
                        const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(match.status);
                        const isFinished = match.status === 'finished';
                        const hasScore = isLive || isFinished;
                        const time = match.scheduled_at
                          ? new Date(match.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-';
                        const isSelected = selectedMatchId === (match.uuid || match.id);
                        const homeWin = hasScore && match.home_score > match.away_score;
                        const awayWin = hasScore && match.away_score > match.home_score;

                        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
                        if (isDesktop) {
                          return (
                            <div
                              key={match.id}
                              onClick={() => handleMatchClick(match.uuid || match.id)}
                              className={`match-row ${isSelected ? 'active' : ''}`}
                            >
                              {/* Time */}
                              <div className={`time-col ${isLive ? 'live' : ''}`}>
                                {isLive ? (
                                  <div className="live-badge">
                                    <span className="live-badge-dot"></span>
                                    <span>LIVE</span>
                                  </div>
                                ) : isFinished ? (
                                  <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>FT</span>
                                ) : (
                                  <span>{time}</span>
                                )}
                              </div>

                              {/* Teams & Score — HORIZONTAL */}
                              <div className="teams-col">
                                <div className="team-home">
                                  <span className={`team-name ${homeWin ? 'winner' : ''}`}>
                                    {match.home_team?.name || 'Tim Rumah'}
                                  </span>
                                  <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name)} className="team-logo" alt="" />
                                </div>

                                <div className={`score-box ${isLive ? 'live-score' : ''}`}>
                                  <span className="score">{hasScore ? match.home_score : '-'}</span>
                                  <span className="score-sep">:</span>
                                  <span className="score">{hasScore ? match.away_score : '-'}</span>
                                </div>

                                <div className="team-away">
                                  <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name)} className="team-logo" alt="" />
                                  <span className={`team-name ${awayWin ? 'winner' : ''}`}>
                                    {match.away_team?.name || 'Tim Tamu'}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button className="fav-btn" onClick={e => e.stopPropagation()}>
                                  <Star size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); router.push(`/matches/${match.uuid || match.id}`); }}
                                  style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', flexShrink: 0
                                  }}
                                  title="Detail Pertandingan"
                                >
                                  <Maximize2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={match.id}
                            onClick={() => handleMatchClick(match.uuid || match.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '14px 16px', marginBottom: 12,
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isSelected ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                              borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 0 1px #3b82f6, 0 4px 16px rgba(0,0,0,0.3)' : 'none'
                            }}
                          >
                            {/* Time / Status (Column 1) */}
                            <div style={{
                              width: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, color: isLive ? '#f43f5e' : '#8b92a5'
                            }}>
                              {isLive ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: '#f43f5e' }}>{formatGameMinute(match.minute)}&apos;</span>
                                </div>
                              ) : isFinished ? (
                                <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>FT</span>
                              ) : (
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{time}</span>
                              )}
                            </div>

                            {/* Teams Row List (Column 2) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 12 }}>
                              {/* Home Team Row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name)} style={{ width: 22, height: 22, objectFit: 'contain' }} alt="" />
                                <span style={{ fontSize: 13, fontWeight: homeWin ? 800 : 600, color: homeWin ? '#fff' : '#e2e8f0' }}>
                                  {match.home_team?.name || 'Tim Rumah'}
                                </span>
                              </div>
                              {/* Away Team Row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name)} style={{ width: 22, height: 22, objectFit: 'contain' }} alt="" />
                                <span style={{ fontSize: 13, fontWeight: awayWin ? 800 : 600, color: awayWin ? '#fff' : '#e2e8f0' }}>
                                  {match.away_team?.name || 'Tim Tamu'}
                                </span>
                              </div>
                            </div>

                            {/* Score & Star (Column 3) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 34, height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: '#0b0c10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12
                              }}>
                                <span style={{ fontSize: 16, fontWeight: 900, color: '#f5b025' }}>{hasScore ? match.home_score : '-'}</span>
                                <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>{hasScore ? match.away_score : '-'}</span>
                              </div>

                              <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                                <Star size={14} style={{ color: '#4b5563' }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>
              <Calendar style={{ width: 20, height: 20, color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Tidak ada pertandingan.</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Coba ubah filter atau pilih tanggal lain.</p>
          </div>
        )}
      </main>

      <aside style={{ width: 440, flexShrink: 0, borderLeft: '1px solid var(--border)' }} className="hidden lg:block">
        <div style={{ position: 'sticky', top: 56, maxHeight: 'calc(100vh - 56px)', overflowY: 'auto', paddingBottom: 24 }} className="sidebar-scroll">
          
          {/* Match Detail Panel */}
          {selectedMatchId ? (
            <div className="animate-slide-right">
              <MatchDetailPanel matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
              }}>
                <Trophy style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Detail Pertandingan</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, maxWidth: 200, margin: '6px auto 0' }}>
                Pilih pertandingan dari daftar untuk melihat detail.
              </p>
            </div>
          )}

          {/* Top Scorers Widget */}
          {playerStats.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="var(--warning)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Skor</span>
                </div>
                <button 
                  onClick={() => router.push('/stats')}
                  style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                >Lihat Semua</button>
              </div>
              <div>
                {playerStats.slice(0, 5).map((ps, idx) => {
                  const pName = ps.player_name || ps.player?.name || ps.name || '?';
                  const tName = ps.team_name || ps.player?.team || ps.team || '';
                  const goals = ps.goals ?? ps.total_goals ?? ps.value ?? 0;
                  const pId = ps.player_id || ps.id;
                  return (
                  <div 
                    key={pId || idx}
                    onClick={() => setSelectedPlayerId(pId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                      cursor: 'pointer', transition: 'background 0.15s ease',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ 
                      width: 20, fontSize: 12, fontWeight: 800, textAlign: 'center', flexShrink: 0,
                      color: idx < 3 ? 'var(--warning)' : 'var(--text-muted)' 
                    }}>{idx + 1}</span>
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&size=32&background=1c2128&color=fff&bold=true&font-size=0.4`}
                      style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} alt="" 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pName}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tName}</div>
                    </div>
                    <div style={{ 
                      fontSize: 15, fontWeight: 800, color: 'var(--text-primary)',
                      background: 'rgba(59,130,246,0.08)', padding: '4px 10px', borderRadius: 6,
                      minWidth: 30, textAlign: 'center'
                    }}>
                      {goals}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </aside>
      </div>{/* close content wrapper */}
      </div>{/* close MAIN LAYOUT */}

      {/* ═══ Bottom Edge Player Detail Modal ═══ */}
      <AnimatePresence>
        {playerDetail && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 16,
              width: 'calc(100% - 32px)',
              maxWidth: 440,
              height: 560,
              zIndex: 10001,
              background: 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, rgba(20,15,10,0.98) 30%, rgba(12,10,8,0.99) 100%)',
              backdropFilter: 'blur(25px)',
              border: 'none',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              boxShadow: '0 -8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(245,158,11,0.1)',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              color: '#fff',
            }}
          >
            {/* Minimal actions bar - without header text or divider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '18px 24px 0', flexShrink: 0 }}>
              <button
                onClick={() => setSelectedPlayerId(null)}
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36, height: 36,
                  cursor: 'pointer',
                  color: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 0 12px rgba(245,158,11,0.15)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.25)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable container for Infographic content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 32px' }} className="hide-scrollbar">
              {/* Profile Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
                {/* Profile Image & Rating Circle */}
                <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 12 }}>
                  <img 
                    src={getImageUrl(playerDetail.player?.photo_path || playerDetail.player?.photo) || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerDetail.player?.name || '?')}&size=120&background=1e293b&color=fff&bold=true`}
                    alt="" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid rgba(245,158,11,0.3)', objectFit: 'cover' }} 
                  />
                  <div style={{
                    position: 'absolute', top: -2, left: -2,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#090d16',
                    fontSize: 12, fontWeight: 900,
                    width: 34, height: 26, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #0f172a',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }}>
                    {playerDetail.statistics?.rating || '6.5'}
                  </div>
                </div>

                {/* Player Name */}
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {playerDetail.player?.name}
                </h3>

                {/* Player Metadata (Position, Team, Jersey) */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,12,8,0.5))', borderRadius: 12, border: 'none', marginTop: 12, boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.06)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.position || 'Pemain'}</span>
                    <span style={{ fontSize: 10, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posisi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.team || 'Tim'}</span>
                    <span style={{ fontSize: 10, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Klub</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.jersey_number || '-'}</span>
                    <span style={{ fontSize: 10, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No Baju</span>
                  </div>
                </div>
              </div>

              {/* Detailed Infographics stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Pertandingan Dimainkan', value: playerDetail.statistics?.matches_played || 0, max: 38, color: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' },
                  { label: 'Gol', value: playerDetail.statistics?.goals || 0, max: 20, color: 'linear-gradient(90deg, #10b981, #047857)' },
                  { label: 'Asis', value: playerDetail.statistics?.assists || 0, max: 20, color: 'linear-gradient(90deg, #a855f7, #6b21a8)' },
                  { label: 'Kartu Kuning', value: playerDetail.statistics?.yellow_cards || 0, max: 10, color: 'linear-gradient(90deg, #f59e0b, #b45309)' },
                  { label: 'Kartu Merah', value: playerDetail.statistics?.red_cards || 0, max: 5, color: 'linear-gradient(90deg, #ef4444, #991b1b)' },
                  { label: 'Pelanggaran', value: playerDetail.statistics?.fouls || 0, max: 50, color: 'linear-gradient(90deg, #ec4899, #9d174d)' },
                ].map((stat, sIdx) => {
                  const percent = Math.min(100, Math.max(5, (stat.value / stat.max) * 100));
                  return (
                    <motion.div
                      key={sIdx}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{stat.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{stat.value}</span>
                      </div>
                      <div style={{ width: '100%', height: 7, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{ height: '100%', background: stat.color, borderRadius: 4 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="loader"></div>}>
      <Home />
    </Suspense>
  );
}
