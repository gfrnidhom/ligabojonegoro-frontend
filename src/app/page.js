"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Calendar, Star, Zap, CircleDot, Volleyball, Footprints, BadgeCheck, X, Home as HomeIcon, Flame, CheckCircle, Award, Maximize2, ChevronLeft, ChevronRight, ChevronDown, Sliders, Menu, Globe } from 'lucide-react';
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

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffInHours < 1) {
    const diffInMins = Math.floor((now - date) / (1000 * 60));
    return `${diffInMins} min ago`;
  }
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  return `${Math.floor(diffInHours / 24)} d ago`;
};

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'live', label: 'Langsung', live: true },
  { id: 'scheduled', label: 'Mendatang' },
  { id: 'finished', label: 'Selesai' },
];

const getSkillValue = (player, skillKey) => {
  if (player?.statistics?.[skillKey] !== undefined) return player.statistics[skillKey];
  if (player?.[skillKey] !== undefined) return player[skillKey];
  if (player?.metadata?.[skillKey] !== undefined) return player.metadata[skillKey];
  if (player?.aggregated_stats?.[skillKey] !== undefined) return player.aggregated_stats[skillKey];

  const str = `${player?.id || 0}-${skillKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 70 + (Math.abs(hash) % 26); // 70 to 95
};

const getSportSkills = (sportId) => {
  if (sportId === 2) { // Volleyball
    return [
      { key: 'passing', label: 'Passing', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
      { key: 'service', label: 'Service', color: 'linear-gradient(90deg, #10b981, #34d399)' },
      { key: 'block', label: 'Block', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
      { key: 'smash', label: 'Smash', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
    ];
  }
  if (sportId === 4) { // Badminton
    return [
      { key: 'footwalk', label: 'Footwalk', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
      { key: 'posisi', label: 'Penempatan Posisi', color: 'linear-gradient(90deg, #10b981, #34d399)' },
      { key: 'service', label: 'Service', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
      { key: 'loop', label: 'Loop', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
      { key: 'stamina', label: 'Stamina', color: 'linear-gradient(90deg, #eab308, #fbbf24)' },
    ];
  }
  // Default: Sepak Bola / Futsal (sportId === 1 or 3)
  return [
    { key: 'passing', label: 'Passing', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { key: 'kontrol', label: 'Kontrol', color: 'linear-gradient(90deg, #10b981, #34d399)' },
    { key: 'dribling', label: 'Dribling', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
    { key: 'finishing', label: 'Finishing', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
    { key: 'stamina', label: 'Stamina', color: 'linear-gradient(90deg, #eab308, #fbbf24)' },
    { key: 'koordinasi', label: 'Koordinasi Antar Pemain', color: 'linear-gradient(90deg, #ec4899, #f472b6)' },
  ];
};

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
  const [latestNews, setLatestNews] = useState([]);
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
    router.push(`/matches/${matchId}`);
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
        const [mRes, tRes, sRes, nRes] = await Promise.all([
          api.get('/matches', { params: { per_page: 100 } }),
          api.get('/tournaments'),
          api.get('/sports'),
          api.get('/news', { params: { limit: 3 } })
        ]);
        const mData = mRes.data.success ? (mRes.data.data || []) : [];
        setMatches(mData);
        if (tRes.data.success) setTournaments(tRes.data.data || []);
        if (sRes.data.success) setSports(sRes.data.data || []);
        if (nRes?.data?.success) setLatestNews(nRes.data.data || []);

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
          padding: '14px 16px', 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
          position: 'sticky', top: 0, zIndex: 60
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/Logo%20Vertical.png" alt="Liga Bojonegoro" style={{ height: 46, width: 'auto' }} />
            </span>
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
                const currentSportObj = sports.find(s => s.id === activeSport);
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
                  onClick={() => { setActiveSport(null); setActiveTournament(null); setMobileSportsOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16,
                    background: !activeSport ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                    border: '1px solid', borderColor: !activeSport ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.03)',
                    color: !activeSport ? '#3b82f6' : '#334155', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Trophy size={20} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Semua Olahraga</span>
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, textAlign: 'center' }}>Pilih Tanggal</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  style={{ color: '#475569', padding: '8px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                  ◀
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                  {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  style={{ color: '#475569', padding: '8px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                  ▶
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, textAlign: 'center' }}>
                {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                  <span key={d} style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{d}</span>
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
                        fontSize: 11, fontWeight: isSelected || isTdy ? 700 : 500, borderRadius: 10,
                        color: isSelected ? '#fff' : isTdy ? '#3b82f6' : '#334155',
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : isTdy ? 'rgba(59,130,246,0.08)' : 'transparent',
                        boxShadow: isSelected ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
                        border: '1px solid',
                        borderColor: isSelected ? 'transparent' : 'rgba(0,0,0,0.02)',
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
          width: '100%', display: 'flex', gap: 24, maxWidth: 1340, margin: '0 auto', minWidth: 0,
          ...(isMounted && typeof window !== 'undefined' && window.innerWidth >= 1024 ? {
            padding: '80px 24px 40px 24px'
          } : {
            padding: '24px 0px 76px 0px'
          })
        }} 
        className="flex-col lg:flex-row lg:pb-4"
      >

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className={`${mobileTab === 'leagues' ? 'block' : 'hidden'} lg:block w-full lg:w-[260px] flex-shrink-0`}>
        <div style={{ position: 'sticky', top: 76, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', paddingBottom: 8 }}>
          <div style={{ padding: '16px 16px 8px', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
            Top leagues
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

         {/* ── Date Bar + Filters (Card) ── */}
        <div style={{
          zIndex: 50, position: 'relative',
          margin: (isMounted && typeof window !== 'undefined' && window.innerWidth < 1024) ? '0 12px 16px 12px' : '0 0 16px 0',
          borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '12px 16px'
        }}>
          {/* Top Row: Date Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
             <button 
               onClick={() => {
                 const newDate = new Date(selectedDate || new Date());
                 newDate.setDate(newDate.getDate() - 1);
                 setSelectedDate(newDate);
                 setCalendarMonth(newDate);
               }}
               style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             >
                <ChevronLeft size={16} />
             </button>
             
             <div 
               style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-primary)' }}
               onClick={() => setShowDatePicker(!showDatePicker)}
             >
                {isToday(selectedDate || new Date()) ? 'Hari Ini' : (selectedDate || new Date()).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} 
                <ChevronDown size={14} />
             </div>
             
             <button 
               onClick={() => {
                 const newDate = new Date(selectedDate || new Date());
                 newDate.setDate(newDate.getDate() + 1);
                 setSelectedDate(newDate);
                 setCalendarMonth(newDate);
               }}
               style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             >
                <ChevronRight size={16} />
             </button>

              {showDatePicker && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 12, zIndex: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)',
                  padding: 16, width: 280
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      style={{ color: 'var(--text-secondary)', padding: 4, borderRadius: 4, background: 'var(--bg-app)', border: 'none', cursor: 'pointer' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      style={{ color: 'var(--text-secondary)', padding: 4, borderRadius: 4, background: 'var(--bg-app)', border: 'none', cursor: 'pointer' }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 8, textAlign: 'center' }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <span key={i} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
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
                            fontSize: 10, fontWeight: isSelected || isTdy ? 800 : 500, borderRadius: 8,
                            color: isSelected ? '#fff' : isTdy ? 'var(--primary)' : 'var(--text-primary)',
                            background: isSelected ? 'var(--primary)' : isTdy ? 'rgba(59,130,246,0.1)' : 'transparent',
                            border: 'none', transition: 'all 0.15s ease', cursor: 'pointer',
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

          {/* Bottom Row: Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }} className="hide-scrollbar">
            <button 
              onClick={() => setStatusFilter('live')} 
              style={{ borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)', background: statusFilter === 'live' ? 'var(--text-primary)' : 'transparent', color: statusFilter === 'live' ? 'var(--bg-card)' : 'var(--text-primary)' }}
            >
              Berlangsung
            </button>
            <button 
              onClick={() => setStatusFilter('scheduled')}
              style={{ borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)', background: statusFilter === 'scheduled' ? 'var(--text-primary)' : 'transparent', color: statusFilter === 'scheduled' ? 'var(--bg-card)' : 'var(--text-primary)' }}
            >
              Mendatang
            </button>
            <button 
              onClick={() => setStatusFilter('finished')} 
              style={{ borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)', background: statusFilter === 'finished' ? 'var(--text-primary)' : 'transparent', color: statusFilter === 'finished' ? 'var(--bg-card)' : 'var(--text-primary)' }}
            >
              Selesai
            </button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
               <div onClick={() => setStatusFilter('all')} style={{ display: 'flex', alignItems: 'center', background: statusFilter === 'all' ? 'var(--text-primary)' : 'transparent', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 16px', color: statusFilter === 'all' ? 'var(--bg-card)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  <Menu size={14} style={{ marginRight: 6 }} /> Semua
               </div>
               <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }} title="Toggle List/Grid">
                 <Sliders size={14} />
               </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <div className="loader"></div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 14 }}>Memuat pertandingan...</span>
          </div>
        ) : Object.keys(groupedMatches).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...(isMounted && typeof window !== 'undefined' && window.innerWidth < 1024 ? { padding: '0 12px' } : {}) }}>
            {Object.entries(groupedMatches).map(([name, group]) => (
              <div key={name} style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div 
                  onClick={() => (group.tournament?.uuid || group.tournament?.id) && router.push(`/tournaments/${group.tournament.uuid || group.tournament.id}`)}
                  style={{ 
                    cursor: (group.tournament?.uuid || group.tournament?.id) ? 'pointer' : 'default', 
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 16px', 
                    background: 'linear-gradient(90deg, #fdf2f2 0%, #eef2ff 100%)',
                    borderBottom: '1px solid var(--border)',
                    borderTopLeftRadius: 8, borderTopRightRadius: 8
                  }}
                >
                  <img
                    src={getImageUrl(group.tournament?.logo_path || group.tournament?.logo) || avatar(name, '3b82f6')}
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }}
                    alt=""
                  />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{name}</span>
                  {group.tournament?.sport && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {SPORT_LABELS[group.tournament.sport?.slug] || ''}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ 
                    display: viewMode === 'grid' ? 'grid' : 'flex', 
                    flexDirection: 'column',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'none',
                    gap: viewMode === 'grid' ? 12 : 0,
                    padding: viewMode === 'grid' ? 16 : 0,
                  }}>
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

                      return (
                        <div
                          key={match.id}
                          onClick={() => handleMatchClick(match.uuid || match.id)}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: viewMode === 'grid' ? '16px 20px' : '12px 16px',
                            background: viewMode === 'grid' ? '#f8fafc' : (isSelected ? 'var(--bg-hover)' : 'var(--bg-card)'),
                            borderBottom: viewMode === 'grid' ? 'none' : '1px solid var(--border-light)',
                            border: viewMode === 'grid' ? '1px solid #e2e8f0' : 'none',
                            borderRadius: viewMode === 'grid' ? 16 : 0,
                            cursor: 'pointer', transition: 'background 0.2s ease',
                          }}
                        >
                          {viewMode === 'grid' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                               <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                                 {isLive ? (
                                   <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>{formatGameMinute(match.minute)}'</span>
                                 ) : isFinished ? (
                                   <div style={{ background: '#f1f5f9', borderRadius: 16, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#64748b' }}>FT</div>
                                 ) : (
                                   <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{time}</span>
                                 )}
                               </div>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                    <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name)} style={{ width: 32, height: 32, objectFit: 'contain' }} alt="" />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.home_team?.name}</span>
                                  </div>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', padding: '0 16px' }}>{hasScore ? `${match.home_score} - ${match.away_score}` : '-'}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{match.away_team?.name}</span>
                                    <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name)} style={{ width: 32, height: 32, objectFit: 'contain' }} alt="" />
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
                              {/* Time / Status */}
                              <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                {isLive ? (
                                  <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>{formatGameMinute(match.minute)}'</span>
                                ) : isFinished ? (
                                  <div style={{ background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>FT</div>
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{time}</span>
                                )}
                              </div>

                              {/* Teams & Score Container */}
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                                
                                {/* Home Team */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0 }}>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {match.home_team?.name || 'Home'}
                                  </span>
                                  <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                                </div>

                                {/* Score */}
                                <div style={{ width: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                  {hasScore ? (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: isLive ? '#ef4444' : '#1e293b', whiteSpace: 'nowrap', letterSpacing: '1px' }}>
                                      {match.home_score} - {match.away_score}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>-</span>
                                  )}
                                </div>

                                {/* Away Team */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, minWidth: 0 }}>
                                  <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {match.away_team?.name || 'Away'}
                                  </span>
                                </div>

                              </div>
                            </div>
                          )}
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>
              <Calendar style={{ width: 20, height: 20, color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Tidak ada pertandingan.</p>
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Coba ubah filter atau pilih tanggal lain.</p>
          </div>
        )}
      </main>

      <aside style={{ width: 320, flexShrink: 0 }} className="hidden lg:block">
        <div style={{ position: 'sticky', top: 76, maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', paddingBottom: 24 }} className="sidebar-scroll">
          
          {/* Top Scorers Widget */}
          {playerStats.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} color="var(--primary)" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Top Skor</span>
                </div>
                <button 
                  onClick={() => router.push('/stats')}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-app)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                   <ChevronRight size={14} color="var(--text-primary)" />
                </button>
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
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      cursor: 'pointer', transition: 'background 0.15s ease',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ 
                      width: 20, fontSize: 11, fontWeight: 800, textAlign: 'center', flexShrink: 0,
                      color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)' 
                    }}>{idx + 1}</span>
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&size=32&background=1c2128&color=fff&bold=true&font-size=0.4`}
                      style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} alt="" 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pName}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tName}</div>
                    </div>
                    <div style={{ 
                      fontSize: 14, fontWeight: 800, color: 'var(--text-primary)',
                      textAlign: 'right'
                    }}>
                      {goals}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Latest News Widget */}
          {/* Latest News Widget */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>News</span>
            </div>
            {latestNews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {latestNews.slice(0, 3).map((item, index) => {
                  const isFirst = index === 0;
                  const source = item.source || 'FotMob';
                  
                  if (isFirst) {
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => router.push(`/news/${item.slug}`)}
                        style={{ padding: '0 20px 24px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      >
                        <img 
                          src={getImageUrl(item.image_path)} 
                          alt={item.title} 
                          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 16, marginBottom: 12 }}
                        />
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.35, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                          {item.title}
                        </h2>
                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                          {source} · {formatTimeAgo(item.published_at || item.created_at)}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(`/news/${item.slug}`)}
                      style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: 16 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <img 
                        src={getImageUrl(item.image_path)} 
                        alt={item.title} 
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.35, margin: '0 0 6px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{source} · {formatTimeAgo(item.published_at || item.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>Belum ada berita</p>
              </div>
            )}
          </div>

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
                    fontSize: 10, fontWeight: 900,
                    width: 34, height: 26, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #0f172a',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }}>
                    {playerDetail.statistics?.rating || '6.5'}
                  </div>
                </div>

                {/* Player Name */}
                <h3 style={{ fontSize: 19, fontWeight: 900, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {playerDetail.player?.name}
                </h3>

                {/* Player Metadata (Position, Team, Jersey) */}
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(15,12,8,0.5))', borderRadius: 12, border: 'none', marginTop: 12, boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.06)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.position || 'Pemain'}</span>
                    <span style={{ fontSize: 9, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posisi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.team || 'Tim'}</span>
                    <span style={{ fontSize: 9, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Klub</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{playerDetail.player?.jersey_number || '-'}</span>
                    <span style={{ fontSize: 9, color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No Baju</span>
                  </div>
                </div>
              </div>

              {/* Detailed Infographics stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Season Summary Grid */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(245,158,11,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>Ringkasan Musim</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Main', value: playerDetail.statistics?.matches_played || 0 },
                      { label: 'Gol', value: playerDetail.statistics?.goals || 0 },
                      { label: 'Assist', value: playerDetail.statistics?.assists || 0 },
                      { label: 'K. Kuning', value: playerDetail.statistics?.yellow_cards || 0, color: '#fbbf24' },
                      { label: 'K. Merah', value: playerDetail.statistics?.red_cards || 0, color: '#ef4444' },
                      { label: 'Pelanggaran', value: playerDetail.statistics?.fouls || 0 }
                    ].map((sumItem, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 900, color: sumItem.color || '#f1f5f9' }}>{sumItem.value}</span>
                        <span style={{ display: 'block', fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{sumItem.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Ratings (Sport Specific) */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(245,158,11,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Statistik Keahlian</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {getSportSkills(playerDetail.player?.position?.sport_id).map((skill, idx) => {
                      const val = getSkillValue(playerDetail.player, skill.key);
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{skill.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#f1f5f9' }}>{val}</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.01)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                              style={{ height: '100%', background: skill.color, borderRadius: 3 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
