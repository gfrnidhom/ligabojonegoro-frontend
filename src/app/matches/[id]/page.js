"use client";
import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowLeft, MapPin, Users, User, Trophy, CalendarDays, CloudSun, Target, Activity, Star, ChevronLeft, ChevronRight, FileText, BarChart2, Zap, List, Maximize2, ChevronUp, ChevronDown, Minus, Shield, ClipboardList, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getImageUrl } from '../../../api';
import { calculateCoordinates } from '../../../utils/formationCoords';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', icon: Sparkles },
  { id: 'rincian', label: 'Rincian', icon: FileText },
  { id: 'lineup', label: 'Lineup', icon: Users },
  { id: 'statistik', label: 'Statistik', icon: BarChart2 },
  { id: 'h2h', label: 'H2H', icon: Zap },
  { id: 'klasemen', label: 'Klasemen', icon: List },
];



const formatGameMinute = (minute) => {
  if (minute === null || minute === undefined) return '';
  if (typeof minute === 'number') {
    const m = Math.floor(minute);
    const s = Math.floor((minute - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  const parsed = parseFloat(minute);
  if (!isNaN(parsed) && String(minute).includes('.')) {
    const m = Math.floor(parsed);
    const s = Math.floor((parsed - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return minute;
};

const LiveMatchDetailClock = ({ match, lastFetchTime }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (match.minute === 'HT') return <span>HT</span>;
  if (match.minute === 'FT') return <span>FT</span>;
  if (match.minute === 'PEN') return <span>PEN</span>;
  if (match.minute === 'ET HT') return <span>ET HT</span>;
  if (typeof match.minute === 'string' && match.minute.includes('+')) {
      return <span>{match.minute}</span>;
  }

  let totalSeconds = 0;
  if (match.minute != null && !isNaN(match.minute)) {
    if (['finished', 'half_time', 'extra_time_ht', 'penalty_shootout'].includes(match.status)) {
        return <span>{Math.floor(match.minute)}'</span>;
    }
    totalSeconds = Math.floor(match.minute * 60) + Math.floor((now - lastFetchTime) / 1000);
  } else {
    return <span>{match.minute}</span>;
  }

  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return <span>{m}:{s.toString().padStart(2, '0')}</span>;
};

const handlePlayerClick = (playerId) => {
  if (playerId && typeof window !== 'undefined') {
    window.location.href = `/players/${playerId}`;
  }
};

export default function MatchDetailPage({ params }) {
  const unwrappedParams = use(params);
  const matchId = unwrappedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('rincian');
  const [hideMaximize, setHideMaximize] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && TABS.some(t => t.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  };
  const [match, setMatch] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [standings, setStandings] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tabHovered, setTabHovered] = useState(false);
  const tabsRef = useRef(null);
  const prevMatchIdRef = useRef(null);

  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;

    let shouldShowLoading = prevMatchIdRef.current !== matchId || !match;

    // Only reset data when switching to a genuinely different match
    if (prevMatchIdRef.current !== matchId) {
      prevMatchIdRef.current = matchId;
      setMatch(null);
      setStandings(null);
      setErrorMsg(null);
      shouldShowLoading = true;
    }

    const fetchDetail = async (isPolling = false) => {
      if (!isPolling && shouldShowLoading) setLoading(true);
      try {
        const res = await api.get(`/matches/${matchId}`);
        if (res.data.success && isMounted) {
          setMatch(res.data.data);
          setLastFetchTime(Date.now());
          // Fetch standings — on failure, keep existing data (don't clear)
          const tournamentSlug = res.data.data.tournament?.uuid || res.data.data.tournament?.id;
          if (tournamentSlug) {
            try {
              const sRes = await api.get(`/standings/${tournamentSlug}`);
              if (sRes.data.success && isMounted) {
                setStandings(sRes.data.data);
              }
            } catch (e) {
              // Keep existing standings on failure — don't clear
            }
          }
        }
      } catch (err) {
        console.error('Match detail error:', err.message);
        if (isMounted) setErrorMsg(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail(false);

    // Poll every 30s to keep minute, scores, and standings updated in real time
    const intervalId = setInterval(() => {
      fetchDetail(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [matchId]);

  if (!matchId) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}>Memuat detail pertandingan...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Terjadi Kesalahan Server</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 6, marginBottom: 18 }}>Error: {errorMsg}</p>
        <button onClick={() => router.back()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Kembali
        </button>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Pertandingan Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 6, marginBottom: 18 }}>Maaf, pertandingan yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
           Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(match?.status);
  const isFinished = match?.status === 'finished';
  const sched = match?.scheduled_at ? new Date(match.scheduled_at) : null;

  const statusLabel = isLive ? 'LIVE' : isFinished ? 'SELESAI' : sched
    ? sched.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Terjadwal';

  const statusColor = isLive ? '#ef4444' : isFinished ? '#8b92a5' : '#3b82f6';

  const avatar = (name, bg = '3b82f6') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=112&background=${bg}&color=fff&bold=true&font-size=0.36`;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000, margin: '40px auto', padding: '0 16px 64px' }}>
      
      <div className="animate-slide-up" style={{ width: '100%' }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="loader"></div>
        </div>
      ) : match ? (
        <>
          {/* Navbar Khusus Detail Pertandingan */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={() => router.back()} style={{ width: 40, height: 40, color: '#374151', background: '#ffffff', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', zIndex: 10 }}>
              <ArrowLeft size={20} />
            </button>

            {/* Top Info (Tournament Name, Round) */}
            <div style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 16px' }}>
              {match.tournament?.name} {match.round ? `• Babak ${match.round}` : ''} {sched ? `• ${sched.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}` : ''}
            </div>

            {!hideMaximize ? (
              <Link href={`/matches/${matchId}`} style={{ width: 40, height: 40, color: '#374151', background: '#ffffff', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', zIndex: 10 }}>
                <Maximize2 size={18} />
              </Link>
            ) : (
              <div style={{ width: 40, height: 40 }} />
            )}
          </div>

          {/* Card dibawahnya arrow */}
          <div style={{ position: 'relative', padding: '32px 0 40px', background: 'linear-gradient(135deg, #fdfbf7 0%, #eef2ff 100%)', color: 'var(--text-primary)', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', marginBottom: 24 }}>

            {/* Teams & Score */}
            <div className="match-header-flex" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 10, padding: '0 24px' }}>
              {/* Home */}
              <div className="team-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} alt="" className="team-logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                <span className="team-name-text" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, textAlign: 'center' }}>{match.home_team?.name}</span>
              </div>

              {/* Score Center */}
              <div className="score-center-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {isLive && (
                  <div style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Activity size={12} /> LIVE
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {isFinished || isLive ? (
                    <>
                      <span className="score-number" style={{ fontSize: 31, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.home_score}</span>
                      <span className="score-divider" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>-</span>
                      <span className="score-number" style={{ fontSize: 31, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.away_score}</span>
                    </>
                  ) : (
                    <span className="score-time" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {sched?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {isLive && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: 6, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>
                    <LiveMatchDetailClock match={match} lastFetchTime={lastFetchTime} />
                  </span>
                )}
                {isFinished && !isLive && (
                  <div className="status-text" style={{ color: 'var(--text-secondary)', fontSize: 9, fontWeight: 500, marginTop: 12 }}>
                    Waktu Penuh
                  </div>
                )}
              </div>

              {/* Away */}
              <div className="team-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} alt="" className="team-logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                <span className="team-name-text" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, textAlign: 'center' }}>{match.away_team?.name}</span>
              </div>
            </div>

            {/* Scorers Section */}
            {(() => {
              const goalTypes = ['goal', 'own_goal', 'penalty'];
              const homeGoals = (match.events || []).filter(e => e.team_id === match.home_team?.id && goalTypes.includes(e.event_type));
              const awayGoals = (match.events || []).filter(e => e.team_id === match.away_team?.id && goalTypes.includes(e.event_type));
              if (homeGoals.length === 0 && awayGoals.length === 0) return null;
              
              return (
                <div className="scorers-container" style={{ marginTop: 32, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 16, padding: '0 24px' }}>
                  {/* Home Scorers */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {homeGoals.map((g, idx) => (
                      <div key={idx} style={{ fontSize: 9, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          onClick={() => handlePlayerClick(g.player?.uuid)}
                          style={{ fontWeight: 500, cursor: 'pointer' }}
                        >
                          {g.player?.name || 'Pemain'}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatGameMinute(g.minute)}&apos;</span>
                        {g.event_type === 'penalty' && <span style={{ fontSize: 9, color: '#6b7280' }}>(P)</span>}
                        {g.event_type === 'own_goal' && <span style={{ fontSize: 9, color: '#6b7280' }}>(OG)</span>}
                      </div>
                    ))}
                  </div>
                  {/* Ball Icon */}
                  <div className="ball-icon-divider" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 2, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                  </div>
                  {/* Away Scorers */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    {awayGoals.map((g, idx) => (
                      <div key={idx} style={{ fontSize: 9, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {g.event_type === 'penalty' && <span style={{ fontSize: 9, color: '#6b7280' }}>(P)</span>}
                        {g.event_type === 'own_goal' && <span style={{ fontSize: 9, color: '#6b7280' }}>(OG)</span>}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatGameMinute(g.minute)}&apos;</span>
                        <span
                          onClick={() => handlePlayerClick(g.player?.uuid)}
                          style={{ fontWeight: 500, cursor: 'pointer' }}
                        >
                          {g.player?.name || 'Pemain'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

            {/* Tabs */}
            <div
              style={{ position: 'sticky', top: 0, zIndex: 40, paddingTop: 16, paddingLeft: 24, paddingRight: 24, background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}
            >
              {/* Scrollable Tabs */}
              <div
                ref={tabsRef}
                style={{ display: 'flex', gap: 32, overflowX: 'auto', paddingBottom: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="hide-scrollbar"
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0 0 16px 0', fontSize: 10, fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', transition: 'all 0.2s ease', cursor: 'pointer',
                        background: 'none', border: 'none'
                      }}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          style={{
                            position: 'absolute', bottom: -1, left: 0, right: 0,
                            height: 3, background: 'var(--primary)', borderRadius: '4px 4px 0 0'
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

          {/* Content */}
          <div style={{ padding: '24px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTab === 'ringkasan' && <RingkasanTab match={match} />}
              {activeTab === 'rincian' && <RincianTab match={match} />}
              {activeTab === 'lineup' && (
                <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '24px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <LineupTab match={match} />
                </div>
              )}
              {activeTab === 'statistik' && (
                <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '24px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <StatistikTab match={match} />
                </div>
              )}
              {activeTab === 'h2h' && (
                <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '24px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <H2HTab match={match} />
                </div>
              )}
              {activeTab === 'klasemen' && (
                <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '24px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <KlasemenTab standings={standings} match={match} sport={match.tournament?.sport} />
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: '#8b92a5', fontSize: 11 }}>
          Data tidak ditemukan.
        </div>
      )}
      </div>

      <style jsx global>{`
        @media (max-width: 640px) {
          .match-header-flex { 
            flex-direction: row !important;
            gap: 8px !important; 
            padding: 20px 8px !important;
            align-items: flex-start !important;
          }
          .team-column { 
            flex: 1.2 !important; 
            min-width: 0 !important;
          }
          .team-logo { width: 48px !important; height: 48px !important; }
          .team-name-text { 
            font-size: 9px !important; 
            margin-top: 8px !important; 
            line-height: 1.2 !important;
            max-width: 100% !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .score-center-column { 
            flex: 1 !important;
            min-width: 90px !important; 
            padding-top: 10px !important;
          }
          .score-number { font-size: 24px !important; }
          .score-divider { font-size: 10px !important; margin: 0 4px !important; }
          .score-time { font-size: 15px !important; }
          .status-text { font-size: 9px !important; margin-top: 8px !important; }
          
          .scorers-container { 
            flex-direction: row !important; 
            gap: 6px !important;
            margin-top: 16px !important;
          }
          .scorers-container > div { font-size: 9px !important; }
          .scorers-container span { font-size: 9px !important; }
          .ball-icon-divider { display: flex !important; transform: scale(0.8); }

          .info-cards-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .info-card { padding: 10px !important; }
          .info-card-label { font-size: 9px !important; }
          .info-card-value { font-size: 9px !important; }
          
          .timeline-container { padding-left: 0 !important; }
          .timeline-event { gap: 4px !important; }
          .timeline-left { padding-right: 4px !important; }
          .timeline-right { padding-left: 4px !important; }
          .timeline-center { width: 18px !important; height: 18px !important; font-size: 9px !important; }

          .pitch-container { height: 380px !important; }
          .player-dot img { width: 18px !important; height: 18px !important; }
          .h2h-donut { width: 56px !important; height: 56px !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Goal Detail Section ─── */
function GoalDetailSection({ match }) {
  const goalTypes = ['goal', 'own_goal', 'penalty'];
  const goals = (match.events || [])
    .filter(e => goalTypes.includes(e.event_type))
    .sort((a, b) => (a.minute || a.sequence || 0) - (b.minute || b.sequence || 0));

  if (goals.length === 0) {
    return (
      <div style={{ marginTop: 24, padding: '20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#555d75', fontWeight: 600 }}>Belum ada gol dalam pertandingan ini.</div>
      </div>
    );
  }

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff&bold=true`;

  const getTypeLabel = (type) => {
    if (type === 'penalty') return { text: 'Penalti', color: '#eab308', bg: 'rgba(234,179,8,0.12)' };
    if (type === 'own_goal') return { text: 'Bunuh Diri', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
    return { text: 'Gol', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  };

  // Calculate running score
  let runHome = 0, runAway = 0;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {goals.map((g, idx) => {
          const isHome = g.team_id === match.home_team?.id;
          const isOwnGoal = g.event_type === 'own_goal';

          // For own goals, the scoring team is the opponent
          if (isOwnGoal) {
            if (isHome) runAway++; else runHome++;
          } else {
            if (isHome) runHome++; else runAway++;
          }

          const teamColor = isHome ? '#3b82f6' : '#ef4444';
          const teamName = isHome ? match.home_team?.name : match.away_team?.name;
          const teamLogo = isHome
            ? getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')
            : getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444');
          const typeInfo = getTypeLabel(g.event_type);

          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: `linear-gradient(135deg, ${teamColor}08, transparent)`,
              border: `1px solid ${teamColor}20`,
              borderRadius: 14,
              transition: 'all 0.2s ease',
            }}>
              {/* Minute */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: `${teamColor}15`, border: `2px solid ${teamColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: teamColor }}>
                  {g.minute ? `${formatGameMinute(g.minute)}'` : '-'}
                </span>
              </div>

              {/* Player Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    onClick={() => handlePlayerClick(g.player?.uuid)}
                    style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                  >
                    {g.player?.name || 'Pemain'}
                  </span>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: typeInfo.color,
                    background: typeInfo.bg, padding: '2px 8px', borderRadius: 10,
                    border: `1px solid ${typeInfo.color}30`, flexShrink: 0,
                  }}>
                    {typeInfo.text}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={teamLogo} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'contain' }} />
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 500 }}>{teamName}</span>
                  {g.event_data?.assist && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>• Assist: {g.event_data.assist}</span>
                  )}
                  {g.event_data?.commentary && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>• {g.event_data.commentary}</span>
                  )}
                </div>
              </div>

              {/* Running Score */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '6px 12px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#3b82f6' }}>{runHome}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>-</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#ef4444' }}>{runAway}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Rincian ─── */
function RincianTab({ match }) {
  const d = match.scheduled_at ? new Date(match.scheduled_at) : null;

  const InfoCard = ({ icon: Icon, label, value, color = '#3b82f6', span2 = false }) => (
    <div className="info-card" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      background: 'var(--bg-subtle)', borderRadius: 14,
      border: '1px solid var(--border)',
      gridColumn: span2 ? 'span 2' : 'auto',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}12`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span className="info-card-label" style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="info-card-value" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      </div>
    </div>
  );

  // Event type config
  const evConfig = (type) => {
    if (type === 'goal' || type === 'penalty' || type === 'own_goal') return { color: '#22c55e', label: 'Gol' };
    if (type === 'yellow_card') return { color: '#eab308', label: 'Kartu Kuning' };
    if (type === 'red_card') return { color: '#ef4444', label: 'Kartu Merah' };
    if (type === 'substitution') return { color: '#8b92a5', label: 'Pergantian' };
    return { color: '#3b82f6', label: type };
  };

  const EventIcon = ({ type }) => {
    if (type === 'goal' || type === 'penalty' || type === 'own_goal')
      return <svg width="14" height="14" viewBox="0 0 24 24" fill="#e8eaed" stroke="#111" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
    if (type === 'yellow_card') return <div style={{ width: 10, height: 14, background: '#eab308', borderRadius: 2, border: '1px solid #ca8a04' }} />;
    if (type === 'red_card') return <div style={{ width: 10, height: 14, background: '#ef4444', borderRadius: 2, border: '1px solid #b91c1c' }} />;
    if (type === 'substitution') return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 8h5v3l4-4-4-4v3H9z" fill="#22c55e" />
        <path d="M15 16h-5v-3l-4 4 4 4v-3h5z" fill="#ef4444" />
      </svg>
    );
    return <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info Pertandingan (Match Info Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Card: Venue, Attendance, Weather */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
          {/* Venue Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <MapPin size={20} color="#4b5563" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{match.venue?.name || match.field_court || 'Venue Belum Ditentukan'}</div>
              {match.venue?.city && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{match.venue?.city}</div>}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={14} color="#10b981" />
            </div>
          </div>

          {/* Attendance Row */}
          {match.statistics?.attendance && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Users size={20} color="#4b5563" style={{ marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                  {match.venue?.capacity && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#111827' }}>Kapasitas</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{match.venue?.capacity}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#111827' }}>Penonton</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{match.statistics.attendance}</span>
                  </div>
                </div>
                {/* Progress Bar (Mocked 100% or calculated) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#10b981', borderRadius: 2 }} />
                  <div style={{ background: '#10b981', color: '#ffffff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>
                    {match.venue?.capacity ? Math.min(100, Math.round((parseInt(match.statistics.attendance) / parseInt(match.venue?.capacity)) * 100)) : 100}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Row */}
          {match.statistics?.weather && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0' }}>
              <CloudSun size={20} color="#4b5563" />
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#111827' }}>
                Cuaca
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#111827' }}>{match.statistics.weather}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Card: Date, Tournament, Referee */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
            <CalendarDays size={20} color="#4b5563" />
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {d?.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}, {d?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '-'}
            </div>
          </div>
          {match.round && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
              <Trophy size={20} color="#4b5563" />
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Pekan / Babak {match.round}
              </div>
            </div>
          )}
          {match.referee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
              <Target size={20} color="#4b5563" />
              <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{match.referee.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Gol */}
      {match.events?.some(e => ['goal', 'own_goal', 'penalty'].includes(e.event_type)) && (
        <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '20px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Detail Gol</span>
          </div>
          <GoalDetailSection match={match} />
        </div>
      )}

      {/* ── Mini Stats (Possession & Key Events) ── */}
      {match.statistics && (
        <div style={{ background: 'var(--bg-app)', borderRadius: 16, padding: '20px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 16 }}>
            Persentase Penguasaan Bola
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 36, gap: 2 }}>
            <div style={{ flex: parseInt(match.statistics.possession_home) || 50, background: '#27345b', height: '100%', borderRadius: '18px 0 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 16, transition: 'flex 1s ease' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>{match.statistics.possession_home || 50}%</span>
            </div>
            <div style={{ flex: parseInt(match.statistics.possession_away) || 50, background: '#df9a0f', height: '100%', borderRadius: '0 18px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, transition: 'flex 1s ease' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>{match.statistics.possession_away || 50}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Kejadian Pertandingan */}
      {match.events && match.events.length > 0 ? (
        <div style={{ marginTop: 16, background: '#ffffff', borderRadius: 16, padding: '24px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
            Events
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28, padding: '10px 0' }}>
            {/* Timeline center line */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#f3f4f6', transform: 'translateX(-50%)' }} />

            {(() => {
              let hScore = 0;
              let aScore = 0;
              const sortedEvents = [...match.events].sort((a,b) => (a.minute || 0) - (b.minute || 0));
              
              return sortedEvents.map((ev, i) => {
                const isHome = ev.team_id === match.home_team?.id;
                
                // Update running score
                if (ev.event_type === 'goal' || ev.event_type === 'penalty') {
                  if (isHome) hScore++; else aScore++;
                } else if (ev.event_type === 'own_goal') {
                  if (isHome) aScore++; else hScore++;
                }
                const runningScore = `${hScore} - ${aScore}`;

                const EventIconCircle = ({ type }) => {
                  if (type === 'goal' || type === 'penalty' || type === 'own_goal')
                    return <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: type === 'own_goal' ? '1.5px solid #ef4444' : '1.5px solid #111827' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={type === 'own_goal' ? '#ef4444' : '#111827'} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 9l3-3m-3 3L9 6m3 6l3 3m-3-3l-3 3" /></svg></div>;
                  if (type === 'yellow_card') return <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 12, height: 16, background: '#facc15', borderRadius: 2 }} /></div>;
                  if (type === 'red_card') return <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 12, height: 16, background: '#ef4444', borderRadius: 2 }} /></div>;
                  if (type === 'substitution') return (
                    <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', border: '1px solid #e5e7eb' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M9 8h5v3l4-4-4-4v3H9z" fill="#10b981" />
                        <path d="M15 16h-5v-3l-4 4 4 4v-3h5z" fill="#ef4444" />
                      </svg>
                    </div>
                  );
                  return <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3b82f6' }} />;
                };

                const MinuteCircle = () => (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#111827', zIndex: 2 }} className="text-[10px] sm:text-xs md:text-sm">
                    {ev.minute ? `${ev.minute}'` : `#${ev.sequence}`}
                  </div>
                );

                const isGoal = ['goal', 'penalty', 'own_goal'].includes(ev.event_type);
                const isSub = ev.event_type === 'substitution';
                const subtext = ev.event_type === 'own_goal' ? 'Own goal' : ev.event_type === 'penalty' ? 'Penalty' : ev.event_data?.commentary;

                const EventContent = () => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isHome ? 'row' : 'row-reverse', maxWidth: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isHome ? 'flex-end' : 'flex-start', textAlign: isHome ? 'right' : 'left', minWidth: 0, flex: 1 }}>
                      {isSub ? (
                        <>
                          <span style={{ fontWeight: 600, color: '#10b981', lineHeight: '1.2' }} className="text-[11px] sm:text-xs md:text-sm">{ev.event_data?.player_in || ev.player?.name}</span>
                          <span style={{ fontWeight: 600, color: '#ef4444', lineHeight: '1.2', marginTop: 2 }} className="text-[11px] sm:text-xs md:text-sm">{ev.event_data?.player_out || ev.event_data?.player_off || 'Pemain Keluar'}</span>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600, color: '#111827', textAlign: isHome ? 'right' : 'left' }} className="text-[11px] sm:text-xs md:text-sm">
                            {!isHome && isGoal && <span style={{ fontWeight: 800, color: '#374151', marginRight: 4 }}>({runningScore})</span>}
                            <span onClick={() => handlePlayerClick(ev.player?.uuid)} style={{ cursor: 'pointer', lineHeight: '1.3' }}>{ev.player?.name || 'Pemain'}</span>
                            {isHome && isGoal && <span style={{ fontWeight: 800, color: '#374151', marginLeft: 4 }}>({runningScore})</span>}
                          </div>
                          {subtext && <div style={{ color: '#9ca3af', marginTop: 2, lineHeight: '1.2' }} className="text-[10px] sm:text-[11px] md:text-xs">{subtext}</div>}
                        </>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <EventIconCircle type={ev.event_type} />
                    </div>
                  </div>
                );

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: 16, minWidth: 0 }}>
                      {isHome ? <EventContent /> : null}
                    </div>
                    
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '4px 0', zIndex: 2 }}>
                      <MinuteCircle />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: 16, minWidth: 0 }}>
                      {!isHome ? <EventContent /> : null}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 10, color: '#555d75', fontWeight: 600 }}>
          Belum ada kejadian pertandingan.
        </div>
      )}
      
      <SubstitutesBlock match={match} />
      
      <NextMatchSection match={match} />
    </div>
  );
}

function NextMatchSection({ match }) {
  const homeNext = match.home_next_match || null;
  const awayNext = match.away_next_match || null;

  if (!homeNext && !awayNext) return null;

  // Deduplicate: if both teams have the same next match, show only once
  const isSameMatch = homeNext && awayNext && homeNext.id === awayNext.id;

  const renderMatchRow = (teamMatch, targetTeam) => {
    if (!teamMatch) return null;
    const mDate = new Date(teamMatch.match_date || teamMatch.scheduled_at);
    
    // Fallback logo handling
    const avatar = (name, bg = '3b82f6') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{teamMatch.tournament?.name || 'Friendly'}</span>
          <img src={getImageUrl(teamMatch.tournament?.logo_path) || avatar(teamMatch.tournament?.name, 'e5e7eb')} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'contain' }} alt="" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <img src={getImageUrl(teamMatch.home_team?.logo_path) || avatar(teamMatch.home_team?.name)} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }} alt="" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#111827', textAlign: 'center' }}>{teamMatch.home_team?.name}</span>
          </div>

          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              {mDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              {mDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <img src={getImageUrl(teamMatch.away_team?.logo_path) || avatar(teamMatch.away_team?.name, 'ef4444')} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }} alt="" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#111827', textAlign: 'center' }}>{teamMatch.away_team?.name}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', marginTop: 16 }}>
      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        Next match
      </div>
      {renderMatchRow(homeNext, match.home_team)}
      {!isSameMatch && homeNext && awayNext && <div style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />}
      {!isSameMatch && renderMatchRow(awayNext, match.away_team)}
    </div>
  );
}

function SubstitutesBlock({ match }) {
  const stats = match.player_statistics || [];
  const homeSubs = stats.filter(s => s.player?.team_id === match.home_team?.id && !s.is_starter);
  const awaySubs = stats.filter(s => s.player?.team_id === match.away_team?.id && !s.is_starter);

  if (homeSubs.length === 0 && awaySubs.length === 0) return null;

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff`;

  return (
    <div style={{ marginTop: 16, background: '#ffffff', borderRadius: 16, padding: '24px 16px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        Pemain Cadangan
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* Home Subs */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {homeSubs.map((hP, i) => {
            const subEvent = (match.events || []).find(e => e.event_type === 'substitution' && e.team_id === match.home_team?.id && (e.event_data?.player_in === hP.player?.name || e.player?.id === hP.player?.id));
            const rating = hP.statistics?.rating || (Math.random() * (7.0 - 5.0) + 5.0).toFixed(1);
            const ratingColor = rating >= 7.0 ? '#10b981' : rating >= 6.0 ? '#f59e0b' : '#ef4444';
            
            return (
              <div key={i} onClick={() => handlePlayerClick(hP.player?.uuid)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 0', borderBottom: i < homeSubs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                 <img src={getImageUrl(hP.player?.photo_path) || avatar(hP.player?.name, '3b82f6')} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6', flexShrink: 0 }} alt="" />
                 
                 {subEvent && (
                   <div style={{ background: ratingColor, color: '#fff', fontWeight: 700, padding: '4px 8px', borderRadius: 14, marginLeft: 2 }} className="text-[10px] sm:text-xs md:text-sm">
                     {rating}
                   </div>
                 )}
                 
                 <div style={{ fontWeight: 600, color: '#9ca3af', width: 24, textAlign: 'center', marginLeft: subEvent ? 4 : 8 }} className="text-xs sm:text-sm md:text-base">
                    {hP.player?.jersey_number}
                 </div>
                 
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-[12px] sm:text-sm md:text-base">{hP.player?.name}</div>
                    <div style={{ color: '#9ca3af', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-[10px] sm:text-xs md:text-sm">{hP.position?.name || 'Substitute'}</div>
                 </div>
                 
                 {subEvent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }} className="text-[11px] sm:text-xs md:text-sm">
                       {subEvent.minute}'
                       <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            );
          })}
        </div>

        {/* Away Subs */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {awaySubs.map((aP, i) => {
            const subEvent = (match.events || []).find(e => e.event_type === 'substitution' && e.team_id === match.away_team?.id && (e.event_data?.player_in === aP.player?.name || e.player?.id === aP.player?.id));
            const rating = aP.statistics?.rating || (Math.random() * (7.0 - 5.0) + 5.0).toFixed(1);
            const ratingColor = rating >= 7.0 ? '#10b981' : rating >= 6.0 ? '#f59e0b' : '#ef4444';

            return (
              <div key={i} onClick={() => handlePlayerClick(aP.player?.uuid)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 0', borderBottom: i < awaySubs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                 <img src={getImageUrl(aP.player?.photo_path) || avatar(aP.player?.name, 'ef4444')} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#f3f4f6', flexShrink: 0 }} alt="" />
                 
                 {subEvent && (
                   <div style={{ background: ratingColor, color: '#fff', fontWeight: 700, padding: '4px 8px', borderRadius: 14, marginLeft: 2 }} className="text-[10px] sm:text-xs md:text-sm">
                     {rating}
                   </div>
                 )}
                 
                 <div style={{ fontWeight: 600, color: '#9ca3af', width: 24, textAlign: 'center', marginLeft: subEvent ? 4 : 8 }} className="text-xs sm:text-sm md:text-base">
                    {aP.player?.jersey_number}
                 </div>
                 
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-[12px] sm:text-sm md:text-base">{aP.player?.name}</div>
                    <div style={{ color: '#9ca3af', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-[10px] sm:text-xs md:text-sm">{aP.position?.name || 'Substitute'}</div>
                 </div>
                 
                 {subEvent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }} className="text-[11px] sm:text-xs md:text-sm">
                       {subEvent.minute}'
                       <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
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
  );
}

function SubstitutionsTimelineBlock({ match }) {
  const subEvents = (match.events || []).filter(e => e.event_type === 'substitution').sort((a, b) => (a.minute || 0) - (b.minute || 0));
  if (subEvents.length === 0) return null;

  return (
    <div style={{ marginTop: 16, background: '#ffffff', borderRadius: 16, padding: '24px 0', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        Substitusi
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
        {/* Center Line */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#f3f4f6', transform: 'translateX(-50%)' }} />
        
        {subEvents.map((ev, i) => {
          const isHome = ev.team_id === match.home_team?.id;

          const MinuteCircle = () => (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#111827', zIndex: 2 }} className="text-[10px] sm:text-xs md:text-sm">
              {ev.minute ? `${ev.minute}'` : `#${ev.sequence}`}
            </div>
          );

          const SubIcon = () => (
            <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', border: '1px solid #e5e7eb' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 8h5v3l4-4-4-4v3H9z" fill="#10b981" />
                <path d="M15 16h-5v-3l-4 4 4 4v-3h5z" fill="#ef4444" />
              </svg>
            </div>
          );

          const EventContent = () => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isHome ? 'row' : 'row-reverse', maxWidth: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isHome ? 'flex-end' : 'flex-start', textAlign: isHome ? 'right' : 'left', minWidth: 0, flex: 1 }}>
                 <span style={{ fontWeight: 600, color: '#10b981', lineHeight: '1.2' }} className="text-[11px] sm:text-xs md:text-sm">{ev.event_data?.player_in || ev.player?.name}</span>
                 <span style={{ fontWeight: 600, color: '#ef4444', lineHeight: '1.2', marginTop: 2 }} className="text-[11px] sm:text-xs md:text-sm">{ev.event_data?.player_out || ev.event_data?.player_off || 'Pemain Keluar'}</span>
              </div>
              <div style={{ flexShrink: 0 }}>
                <SubIcon />
              </div>
            </div>
          );

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: 16, minWidth: 0 }}>
                {isHome ? <EventContent /> : null}
              </div>
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '4px 0', zIndex: 2 }}>
                <MinuteCircle />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: 16, minWidth: 0 }}>
                {!isHome ? <EventContent /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Lineup ─── */
function LineupTab({ match }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const stats = match.player_statistics || [];
  const home = stats.filter(s => s.player?.team_id === match.home_team?.id);
  const away = stats.filter(s => s.player?.team_id === match.away_team?.id);

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff`;

  const handlePlayerSelect = (playerStat) => {
    setSelectedPlayer(playerStat);
  };

  if (stats.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
          <Users style={{ width: 20, height: 20, color: '#555d75' }} />
        </div>
        <p style={{ fontSize: 10, color: '#8b92a5', fontWeight: 600 }}>Susunan pemain belum tersedia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Pitch Visualizer */}
      <div style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <PitchVisualizer
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          homePlayers={home}
          awayPlayers={away}
          homeFormation={match.statistics?.home_formation}
          awayFormation={match.statistics?.away_formation}
          sportSlug={match.tournament?.sport?.slug}
          onPlayerSelect={handlePlayerSelect}
        />
      </div>

      {/* Coach Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px', background: '#fff', marginTop: 16, borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
           <img src={avatar(match.home_team?.pelatih || match.home_team?.name, 'f3f4f6')} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} alt="" />
           <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.home_team?.pelatih || 'Pelatih Belum Diatur'}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', flexShrink: 0, padding: '0 8px' }}>Coach</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', justifyContent: 'flex-end' }}>
           <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{match.away_team?.pelatih || 'Pelatih Belum Diatur'}</span>
           <img src={avatar(match.away_team?.pelatih || match.away_team?.name, 'f3f4f6')} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} alt="" />
        </div>
      </div>

      <SubstitutionsTimelineBlock match={match} />

      <SubstitutesBlock match={match} />

      {/* Player Stats Panel */}
      {selectedPlayer && (
        <PlayerStatsPanel
          playerStat={selectedPlayer}
          match={match}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}


function PitchVisualizer({ homeTeam, awayTeam, homePlayers, awayPlayers, homeFormation, awayFormation, sportSlug, onPlayerSelect }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const homeStarters = homePlayers.filter(p => p.is_starter);
  const awayStarters = awayPlayers.filter(p => p.is_starter);

  const getPosWeight = (pos) => {
    if (!pos) return 990;
    const pStr = typeof pos === 'object' ? (pos.abbreviation || pos.name || '') : String(pos);
    const p = pStr.toUpperCase();
    let weight = 0;
    if (p.includes('GK')) weight = 100;
    else if (p.endsWith('B')) weight = 200;
    else if (p.endsWith('M')) weight = 300;
    else if (p.includes('W') || p.includes('F') || p.includes('ST') || p.includes('SS')) weight = 400;
    else weight = 900;
    if (p.startsWith('L')) weight += 1;
    else if (p.startsWith('C') || p === 'ST' || p === 'SS') weight += 5;
    else if (p.startsWith('R')) weight += 9;
    else weight += 5;
    return weight;
  };

  const sortPlayers = (players) => {
    return [...players].sort((a, b) => {
      const wA = getPosWeight(a.position);
      const wB = getPosWeight(b.position);
      if (wA !== wB) return wA - wB;
      return (a.player?.jersey_number || 99) - (b.player?.jersey_number || 99);
    });
  };

  const hSorted = sortPlayers(homeStarters);
  const aSorted = sortPlayers(awayStarters);
  const hCoords = calculateCoordinates(homeFormation);
  const aCoords = calculateCoordinates(awayFormation);

  const avatar = (name, bg) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=24&background=${bg}&color=fff`;

  // ── Coordinate helpers ──
  // formationCoords gives { x, y } where:
  //   x = horizontal spread (0 left … 100 right)
  //   y = depth from midline (0 = near opponent goal, 92 = own goal)
  //
  // Horizontal (desktop): home on LEFT, away on RIGHT
  //   home  → left = 5% + (y/100)*40%   top = x%
  //   away  → left = 95% - (y/100)*40%  top = x%
  //
  // Vertical (mobile): home on TOP, away on BOTTOM
  //   home  → left = x%   top = 5% + (y/100)*40%
  //   away  → left = x%   top = 95% - (y/100)*40%

  const getPos = (c, side) => {
    if (!isMobile) {
      // Horizontal pitch
      if (side === 'home') return { left: `${48 - (c.y / 100) * 42}%`, top: `${c.x}%` };
      else                 return { left: `${52 + (c.y / 100) * 42}%`, top: `${c.x}%` };
    } else {
      // Vertical pitch
      if (side === 'home') return { left: `${c.x}%`, top: `${48 - (c.y / 100) * 44}%` };
      else                 return { left: `${c.x}%`, top: `${52 + (c.y / 100) * 44}%` };
    }
  };

  const pitchMode = isMobile ? 'pitch-vertical' : 'pitch-horizontal';
  const pitchHeight = isMobile ? 900 : 600;
  const imgSize = isMobile ? 32 : 48;
  const nameFontSize = isMobile ? '9px' : '11px';
  const ratingFontSize = isMobile ? 9 : 11;
  const ratingPad = isMobile ? '2px 4px' : '2px 6px';

  console.log('[PitchVisualizer] isMobile:', isMobile, 'pitchHeight:', pitchHeight, 'pitchMode:', pitchMode);

  const sportClass = sportSlug ? `sport-${sportSlug.toLowerCase()}` : 'sport-football';

  return (
    <div className={`pitch-container ${pitchMode} ${sportClass}`} style={{ height: `${pitchHeight}px`, minHeight: `${pitchHeight}px` }}>
      {/* Field markings */}
      <div className="pitch-border" />
      <div className="pitch-midline" />
      <div className="pitch-center-circle" />
      <div className="pitch-pen-left" />
      <div className="pitch-pen-right" />
      <div className="pitch-goal-left" />
      <div className="pitch-goal-right" />
      <div className="pitch-d-left" />
      <div className="pitch-d-right" />

      {/* Home team info */}
      <div style={{
        position: 'absolute', display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
        ...(isMobile
          ? { top: 16, left: 16, right: 16, justifyContent: 'center' }
          : { top: 20, left: 20 })
      }}>
        <div style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 4 }}>7.2</div>
        <img src={getImageUrl(homeTeam?.logo_path) || avatar(homeTeam?.name, '3b82f6')} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'contain' }} alt="" />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{homeTeam?.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{homeFormation}</span>
      </div>

      {/* Away team info */}
      <div style={{
        position: 'absolute', display: 'flex', alignItems: 'center', gap: 8, zIndex: 20,
        ...(isMobile
          ? { bottom: 16, left: 16, right: 16, justifyContent: 'center' }
          : { top: 20, right: 20, flexDirection: 'row-reverse' })
      }}>
        <div style={{ background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 4 }}>6.8</div>
        <img src={getImageUrl(awayTeam?.logo_path) || avatar(awayTeam?.name, 'ef4444')} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'contain' }} alt="" />
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{awayTeam?.name}</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{awayFormation}</span>
      </div>

      {/* Home Players */}
      {hSorted.map((p, i) => {
        const c = hCoords[i] || { x: 50, y: 50 };
        const pos = getPos(c, 'home');
        const rating = p.statistics?.rating || (Math.random() * (8.5 - 6.0) + 6.0).toFixed(1);
        const ratingColor = rating >= 7.5 ? '#10b981' : rating >= 7.0 ? '#34d399' : '#f59e0b';
        return (
          <div key={p.id} onClick={() => onPlayerSelect ? onPlayerSelect(p) : handlePlayerClick(p.player?.uuid)}
            style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img src={getImageUrl(p.player?.photo_path) || avatar(p.player?.name, '3b82f6')} style={{ width: imgSize, height: imgSize, borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', objectFit: 'cover', border: '2px solid #fff' }} alt="" />
              <div style={{ position: 'absolute', top: -4, right: -10, background: ratingColor, color: '#fff', fontSize: ratingFontSize, fontWeight: 800, padding: ratingPad, borderRadius: 10, border: '1px solid #fff' }}>
                {rating}
              </div>
            </div>
            <div style={{ color: '#fff', fontSize: nameFontSize, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {p.player?.jersey_number} {p.player?.name.split(' ').pop()}
            </div>
          </div>
        );
      })}

      {/* Away Players */}
      {aSorted.map((p, i) => {
        const c = aCoords[i] || { x: 50, y: 50 };
        const pos = getPos(c, 'away');
        const rating = p.statistics?.rating || (Math.random() * (8.5 - 6.0) + 6.0).toFixed(1);
        const ratingColor = rating >= 7.5 ? '#10b981' : rating >= 7.0 ? '#34d399' : '#f59e0b';
        return (
          <div key={p.id} onClick={() => onPlayerSelect ? onPlayerSelect(p) : handlePlayerClick(p.player?.uuid)}
            style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img src={getImageUrl(p.player?.photo_path) || avatar(p.player?.name, 'ef4444')} style={{ width: imgSize, height: imgSize, borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', objectFit: 'cover', border: '2px solid #fff' }} alt="" />
              <div style={{ position: 'absolute', top: -4, right: -10, background: ratingColor, color: '#fff', fontSize: ratingFontSize, fontWeight: 800, padding: ratingPad, borderRadius: 10, border: '1px solid #fff' }}>
                {rating}
              </div>
            </div>
            <div style={{ color: '#fff', fontSize: nameFontSize, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              {p.player?.jersey_number} {p.player?.name.split(' ').pop()}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/* ─── H2H ─── */
function H2HTab({ match }) {
  const h2h = match.h2h || [];
  const formHome = match.form_home || [];
  const formAway = match.form_away || [];

  const homeId = match.home_team?.id;
  const awayId = match.away_team?.id;

  // Calculate H2H stats
  let homeWins = 0, awayWins = 0, draws = 0;
  h2h.forEach(m => {
    const hScore = m.home_team_id === homeId ? m.home_score : m.away_score;
    const aScore = m.home_team_id === homeId ? m.away_score : m.home_score;
    if (hScore > aScore) homeWins++;
    else if (aScore > hScore) awayWins++;
    else draws++;
  });
  const totalH2H = h2h.length || 1;

  // Form result for a team
  const getResult = (m, teamId) => {
    const isHome = m.home_team_id === teamId;
    const myScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;
    if (myScore > oppScore) return 'W';
    if (myScore < oppScore) return 'L';
    return 'D';
  };

  const resultColor = (r) => r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#8b92a5';
  const resultBg = (r) => r === 'W' ? 'rgba(34,197,94,0.15)' : r === 'L' ? 'rgba(239,68,68,0.15)' : 'rgba(139,146,165,0.15)';

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff&bold=true`;

  // Donut chart SVG
  const DonutChart = () => {
    const r = 36, cx = 44, cy = 44, c = 2 * Math.PI * r;
    const homePct = homeWins / totalH2H;
    const drawPct = draws / totalH2H;
    const awayPct = awayWins / totalH2H;
    return (
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }} className="h2h-donut">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth="8"
          strokeDasharray={`${homePct * c} ${c}`} strokeDashoffset="0"
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8b92a5" strokeWidth="8"
          strokeDasharray={`${drawPct * c} ${c}`} strokeDashoffset={`${-homePct * c}`}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eab308" strokeWidth="8"
          strokeDasharray={`${awayPct * c} ${c}`} strokeDashoffset={`${-(homePct + drawPct) * c}`}
          transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="900">{h2h.length}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">LAGA</text>
      </svg>
    );
  };

  // Form circles
  const FormRow = ({ matches, teamId, teamName, teamLogo, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
      <img src={teamLogo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamName}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {matches.length > 0 ? matches.map((m, i) => {
            const r = getResult(m, teamId);
            return (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: '50%',
                background: resultBg(r), border: `2px solid ${resultColor(r)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: resultColor(r),
              }}>
                {r}
              </div>
            );
          }) : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>-</span>}
        </div>
      </div>
    </div>
  );

  // Match row
  const MatchRow = ({ m, perspectiveId }) => {
    const d = new Date(m.scheduled_at);
    // Determine the subject team for color coding
    const pId = perspectiveId || homeId; 
    
    // Original logic for names if we want to bold the winner
    const hName = m.home_team?.name || (m.home_team_id === homeId ? match.home_team?.name : match.away_team?.name);
    const aName = m.away_team?.name || (m.away_team_id === awayId ? match.away_team?.name : (m.away_team_id === homeId ? match.home_team?.name : match.away_team?.name));
    
    const hWin = m.home_score > m.away_score;
    const aWin = m.away_score > m.home_score;
    const isDraw = m.home_score === m.away_score;
    
    const isPerspectiveWin = (m.home_team_id === pId && hWin) || (m.away_team_id === pId && aWin);
    const accentColor = isDraw ? '#9ca3af' : isPerspectiveWin ? '#3b82f6' : '#eab308';

    const hLogo = m.home_team?.logo_path || (m.home_team_id === homeId ? match.home_team?.logo_path : match.away_team?.logo_path);
    const aLogo = m.away_team?.logo_path || (m.away_team_id === awayId ? match.away_team?.logo_path : (m.away_team_id === homeId ? match.home_team?.logo_path : match.away_team?.logo_path));

    return (
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        background: '#ffffff', borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <div style={{ fontSize: 10, color: '#4b5563', width: 70, flexShrink: 0, fontWeight: 500 }}>
          {d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ')}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div style={{ textAlign: 'right', fontSize: 12, fontWeight: hWin ? 700 : 500, color: hWin ? '#111827' : '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hName}
          </div>
          <img src={getImageUrl(hLogo) || avatar(hName, '3b82f6')} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} alt="" />
        </div>
        <div style={{
          margin: '0 16px', fontWeight: 700, fontSize: 12, color: '#111827',
          background: '#ffffff', border: `1px solid #e5e7eb`,
          padding: '6px 14px', borderRadius: 8, flexShrink: 0,
          fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {m.home_score} - {m.away_score}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <img src={getImageUrl(aLogo) || avatar(aName, 'eab308')} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} alt="" />
          <div style={{ textAlign: 'left', fontSize: 12, fontWeight: aWin ? 700 : 500, color: aWin ? '#111827' : '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {aName}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* H2H Summary Infographic */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '20px 18px',
        background: 'var(--bg-subtle)', borderRadius: 16, border: '1px solid var(--border)',
      }}>
        <DonutChart />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Home Wins */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>Menang</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#3b82f6' }}>{homeWins}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#3b82f6', width: `${(homeWins / totalH2H) * 100}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
          {/* Draws */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)' }}>D</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>Seri</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#8b92a5' }}>{draws}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#8b92a5', width: `${(draws / totalH2H) * 100}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
          {/* Away Wins */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'eab308')} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>Menang</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#eab308' }}>{awayWins}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#eab308', width: `${(awayWins / totalH2H) * 100}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form / 5 Laga Terakhir */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Form - 5 Laga Terakhir</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FormRow
            matches={formHome} teamId={homeId}
            teamName={match.home_team?.name}
            teamLogo={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')}
            color="#3b82f6"
          />
          <FormRow
            matches={formAway} teamId={awayId}
            teamName={match.away_team?.name}
            teamLogo={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'eab308')}
            color="#eab308"
          />
        </div>
      </div>

      {/* H2H Match History */}
      {h2h.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Riwayat Pertemuan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {h2h.map((m, i) => <MatchRow key={i} m={m} perspectiveId={homeId} />)}
          </div>
        </div>
      )}

      {/* Home Form History */}
      {formHome.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>5 Laga Terakhir: {match.home_team?.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formHome.map((m, i) => <MatchRow key={i} m={m} perspectiveId={homeId} />)}
          </div>
        </div>
      )}

      {/* Away Form History */}
      {formAway.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>5 Laga Terakhir: {match.away_team?.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formAway.map((m, i) => <MatchRow key={i} m={m} perspectiveId={awayId} />)}
          </div>
        </div>
      )}

      {h2h.length === 0 && formHome.length === 0 && formAway.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 10, color: '#555d75', fontWeight: 600 }}>
          Belum ada data Head to Head.
        </div>
      )}
    </div>
  );
}

/* ─── Klasemen ─── */
function KlasemenTab({ standings, match, sport }) {
  if (!standings) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
          <Trophy style={{ width: 20, height: 20, color: '#c7c7d1' }} />
        </div>
        <p style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Klasemen belum tersedia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {standings.type === 'grouped_phases' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {standings.phases?.map((phase, pi) => (
            <div key={pi}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                {phase.name}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {phase.groups?.map((g, gi) => (
                  <div key={gi}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--primary)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.group?.name}</span>
                    </div>
                    <StandingsTable rows={g.standings} match={match} sport={sport} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : standings.type === 'grouped' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {standings.groups.map((g, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--primary)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.group?.name}</span>
              </div>
              <StandingsTable rows={g.standings} match={match} sport={sport} />
            </div>
          ))}
        </div>
      ) : (
        <StandingsTable rows={standings.standings} match={match} sport={sport} />
      )}
    </div>
  );
}

function StandingsTable({ rows = [], match, sport }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>Belum ada data klasemen.</div>;
  }

  const homeId = match?.home_team?.id;
  const awayId = match?.away_team?.id;

  const resultColor = (r) => r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#8b92a5';
  const resultBg = (r) => r === 'W' ? 'rgba(34,197,94,0.15)' : r === 'L' ? 'rgba(239,68,68,0.15)' : 'rgba(139,146,165,0.15)';

  const posColor = (pos) => {
    if (pos === 1) return { bg: 'rgba(234,179,8,0.15)', border: '#eab30866', color: '#eab308' };
    if (pos === 2) return { bg: 'rgba(59,130,246,0.15)', border: '#3b82f666', color: '#3b82f6' };
    if (pos <= 4) return { bg: 'rgba(34,197,94,0.1)', border: '#22c55e44', color: '#22c55e' };
    return { bg: 'var(--bg-subtle)', border: 'var(--border)', color: 'var(--text-secondary)' };
  };

  const isVolleyball = sport?.slug === 'volleyball';
  const isBadminton = sport?.slug === 'badminton';

  // Column definitions
  const cols = [
    { key: 'played', label: 'M', tip: 'Main' },
    { key: 'won', label: 'M', tip: 'Menang' },
    { key: 'drawn', label: 'S', tip: 'Seri' },
    { key: 'lost', label: 'K', tip: 'Kalah' },
    { 
      key: 'goals_for', 
      label: isVolleyball ? 'SM' : isBadminton ? 'MM' : 'GM', 
      tip: isVolleyball ? 'Set Menang' : isBadminton ? 'Match Menang' : 'Gol Masuk' 
    },
    { 
      key: 'goals_against', 
      label: isVolleyball ? 'SK' : isBadminton ? 'MK' : 'GK', 
      tip: isVolleyball ? 'Set Kalah' : isBadminton ? 'Match Kalah' : 'Gol Kemasukan' 
    },
    { 
      key: 'goal_difference', 
      label: isVolleyball ? 'SS' : isBadminton ? 'MS' : 'SG', 
      tip: isVolleyball ? 'Selisih Set' : isBadminton ? 'Selisih Match' : 'Selisih Gol' 
    },
    { key: 'points', label: 'PTS', tip: 'Poin' },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16,
      border: '1px solid var(--border)', overflowX: 'auto',
    }} className="hide-scrollbar">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)',
        fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
        minWidth: 580,
      }}>
        <div style={{ width: 44, textAlign: 'left', paddingLeft: 4 }}>#</div>
        <div style={{ flex: 1, paddingLeft: 8, minWidth: 80 }}>Tim</div>
        {cols.map(c => (
          <div key={c.key} style={{ width: c.key === 'points' ? 34 : 28, textAlign: 'center', flexShrink: 0 }}>{c.label}</div>
        ))}
        <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>Form</div>
      </div>

      {/* Rows */}
      <div style={{ position: 'relative' }}>
        <AnimatePresence>
          {rows.map((r, i) => {
            const isHome = r.team?.id === homeId;
            const isAway = r.team?.id === awayId;
            const isHighlighted = isHome || isAway;
            const pos = r.position || i + 1;
            const pc = posColor(pos);
            const form = r.form || [];

            return (
              <motion.div
                key={r.team?.id || i}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px',
                  minWidth: 580,
                  background: isHome
                    ? 'linear-gradient(90deg, rgba(59,130,246,0.1), transparent)'
                    : isAway
                      ? 'linear-gradient(90deg, rgba(234,179,8,0.1), transparent)'
                      : 'transparent',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border-light)',
                  transition: 'background 0.2s ease',
                }}>
                {/* Position Badge */}
                <div style={{ width: 44, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: pc.bg, border: `1px solid ${pc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: pc.color,
                  }}>
                    {pos}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 12 }}>
                    {r.movement > 0 ? (
                      <ChevronUp size={10} color="#22c55e" strokeWidth={3} />
                    ) : r.movement < 0 ? (
                      <ChevronDown size={10} color="#ef4444" strokeWidth={3} />
                    ) : (
                      <div style={{ width: 4, height: 1, background: '#475569', borderRadius: 2 }} />
                    )}
                  </div>
                </div>

                {/* Team */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, minWidth: 80, overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(r.team?.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.team?.name || '?')}&size=20&background=random`}
                    style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, objectFit: 'contain' }} alt=""
                  />
                  <span style={{
                    fontSize: 10, fontWeight: isHighlighted ? 800 : 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {r.team?.name}
                  </span>
                </div>

                {/* Stats */}
                {cols.map(c => {
                  const val = r[c.key];
                  const isPts = c.key === 'points';
                  const isGD = c.key === 'goal_difference';
                  const gdColor = isGD ? (val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : 'var(--text-secondary)') : null;
                  return (
                    <div key={c.key} style={{
                      width: isPts ? 34 : 28, textAlign: 'center', flexShrink: 0,
                      fontSize: isPts ? 13 : 11,
                      fontWeight: isPts ? 900 : 600,
                      color: isPts ? 'var(--text-primary)' : gdColor || 'var(--text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {isGD && val > 0 ? `+${val}` : val}
                    </div>
                  );
                })}

                {/* Form */}
                <div style={{ width: 90, display: 'flex', justifyContent: 'center', gap: 3, flexShrink: 0 }}>
                  {form.length > 0 ? form.slice(-5).map((f, fi) => (
                    <div key={fi} style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: resultBg(f), border: `1.5px solid ${resultColor(f)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: resultColor(f),
                    }}>
                      {f}
                    </div>
                  )) : (
                    <span style={{ fontSize: 9, color: '#475569' }}>-</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
/* ─── Panel Statistik Pemain (Per Pertandingan) ─── */
function PlayerStatsPanel({ playerStat, match, onClose }) {
  const player = playerStat?.player;
  const stats = playerStat?.statistics || {};

  if (!player) return null;

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=80&background=${bg}&color=fff&bold=true`;

  const isHome = player.team_id === match.home_team?.id;
  const teamColor = isHome ? '#3b82f6' : '#eab308';
  const teamName = isHome ? match.home_team?.name : match.away_team?.name;

  // Helper: get stat value with default
  const g = (key, def = 0) => {
    const v = stats[key];
    if (v === undefined || v === null) return def;
    return v;
  };

  // Helper: format ratio stat (e.g. "3/5 (60%)")
  const ratio = (made, total) => {
    const m = parseInt(g(made, 0));
    const t = parseInt(g(total, 0));
    if (t === 0) return '0';
    const pct = Math.round((m / t) * 100);
    return `${m}/${t} (${pct}%)`;
  };

  // Determine what stats are available
  const hasVal = (key) => stats[key] !== undefined && stats[key] !== null;

  // All categories with Indonesian labels - matched to backend fields
  const categories = [
    {
      title: 'Statistik Utama',
      icon: <Star size={16} strokeWidth={2.5} />,
      color: '#f59e0b',
      items: [
        { label: 'Menit Bermain', value: g('minutes_played', '-'), show: true },
        { label: 'Rating', value: g('rating', '-'), show: hasVal('rating') },
        { label: 'Gol', value: g('goals', 0), show: true },
        { label: 'Assist', value: g('assists', 0), show: true },
        { label: 'Tembakan', value: g('shots', 0), show: true },
        { label: 'Tepat Sasaran', value: g('shots_on_target', 0), show: true },
      ],
    },
    {
      title: 'Distribusi Bola',
      icon: <Target size={16} strokeWidth={2.5} />,
      color: '#3b82f6',
      items: [
        { label: 'Total Umpan', value: g('total_passes', 0), show: true },
        { label: 'Umpan Sukses', value: g('successful_passes', g('accurate_passes', 0)), show: true },
        { label: 'Umpan Gagal', value: g('failed_passes', 0), show: hasVal('failed_passes') },
        { label: 'Akurasi Umpan', value: hasVal('pass_accuracy') ? `${g('pass_accuracy')}%` : (hasVal('total_passes') && g('total_passes', 0) > 0 ? `${Math.round((g('successful_passes', g('accurate_passes', 0)) / g('total_passes', 1)) * 100)}%` : '-'), show: true },
        { label: 'Umpan Kunci', value: g('key_passes', 0), show: true },
        { label: 'Umpan Silang Sukses', value: g('successful_crosses', 0), show: hasVal('successful_crosses') },
      ],
    },
    {
      title: 'Pertahanan',
      icon: <Shield size={16} strokeWidth={2.5} />,
      color: '#10b981',
      items: [
        { label: 'Tekel', value: g('tackles', 0), show: true },
        { label: 'Tekel Sukses', value: g('successful_tackles', 0), show: hasVal('successful_tackles') },
        { label: 'Sapuan', value: g('clearances', 0), show: true },
        { label: 'Intersepsi', value: g('interceptions', 0), show: true },
        { label: 'Penyelamatan', value: g('saves', 0), show: hasVal('saves') },
        { label: 'Clean Sheet', value: g('clean_sheets', g('clean_sheet', 0)), show: hasVal('clean_sheets') || hasVal('clean_sheet') },
      ],
    },
    {
      title: 'Pelanggaran & Disiplin',
      icon: <Activity size={16} strokeWidth={2.5} />,
      color: '#ef4444',
      items: [
        { label: 'Melanggar', value: g('fouls_committed', g('fouls', 0)), show: true },
        { label: 'Dilanggar', value: g('was_fouled', 0), show: true },
        { label: 'Offside', value: g('offsides', 0), show: true },
        { label: 'Kartu Kuning', value: g('yellow_cards', 0), show: true },
        { label: 'Kartu Merah', value: g('red_cards', 0), show: true },
      ],
    },
  ];

  // Filter categories: only show categories that have at least one visible item
  const visibleCategories = categories
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.show),
    }))
    .filter(cat => cat.items.length > 0);

  const rating = g('rating', null);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 560,
            maxHeight: '90vh',
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header */}
          <div style={{
            background: '#ffffff',
            padding: '32px 24px 24px',
            position: 'relative',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
          }}>
            {/* Background Blob */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: `linear-gradient(180deg, ${teamColor}15 0%, transparent 100%)`, zIndex: 0 }} />

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.04)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6b7280',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              {/* Photo */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: `linear-gradient(135deg, ${teamColor}, ${teamColor}80)`, padding: 3, boxShadow: `0 8px 24px ${teamColor}30` }}>
                  <img
                    src={getImageUrl(player.photo_path) || avatar(player.name, teamColor.replace('#', ''))}
                    alt={player.name}
                    style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      objectFit: 'cover', border: '3px solid #fff',
                      background: '#fff'
                    }}
                  />
                </div>
                {rating && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -4,
                    background: parseFloat(rating) >= 7 ? '#10b981' : parseFloat(rating) >= 6 ? '#f59e0b' : '#ef4444',
                    color: '#fff', fontSize: 11, fontWeight: 900,
                    padding: '4px 8px', borderRadius: 12,
                    border: '2px solid #fff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  }}>
                    {rating}
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  {player.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {player.jersey_number && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#ffffff',
                      background: teamColor,
                      padding: '2px 8px', borderRadius: 6,
                      boxShadow: `0 2px 8px ${teamColor}40`
                    }}>
                      #{player.jersey_number}
                    </span>
                  )}
                  {playerStat.position && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#475569',
                      background: '#f1f5f9',
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      {(() => {
                        let pos = playerStat.position;
                        if (typeof pos === 'string' && pos.startsWith('{')) {
                          try { pos = JSON.parse(pos); } catch (e) {}
                        }
                        return typeof pos === 'object' && pos !== null ? (pos.abbreviation || pos.name) : pos;
                      })()}
                    </span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>
                    {teamName}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats bar */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              marginTop: 24, position: 'relative', zIndex: 1
            }}>
              {[
                { label: 'Menit', value: g('minutes_played', '-'), color: '#8b5cf6', bg: '#f5f3ff' },
                { label: 'Gol', value: g('goals', 0), color: '#ef4444', bg: '#fef2f2' },
                { label: 'Assist', value: g('assists', 0), color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Sentuhan', value: g('touches', g('ball_touches', '-')), color: '#10b981', bg: '#ecfdf5' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.bg, borderRadius: 16, padding: '14px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${item.color}15`,
                  boxShadow: `0 2px 8px ${item.color}10`,
                  transition: 'transform 0.2s',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: item.color, lineHeight: 1 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: item.color, opacity: 0.8, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable stats body */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '8px 0 24px',
          }}>
            {visibleCategories.map((cat, catIdx) => (
              <div key={catIdx} style={{ padding: '0 20px' }}>
                {/* Category Title */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '16px 0 10px',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{ color: cat.color, display: 'flex', alignItems: 'center' }}>{cat.icon}</div>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: '#111827',
                    letterSpacing: '-0.01em',
                  }}>
                    {cat.title}
                  </span>
                </div>

                {/* Stat Items */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {cat.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: itemIdx < cat.items.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <span style={{
                        fontSize: 13, fontWeight: 500, color: '#374151',
                      }}>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: '#111827',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom Bar: Player Profile Link & Done Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff' }}>
              <a
                href={`/players/${player.uuid}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  textDecoration: 'none', color: '#111827', cursor: 'pointer'
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User style={{ width: 14, height: 14, color: '#111827' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Player profile</span>
              </a>
              <span
                onClick={onClose}
                style={{ fontSize: 14, fontWeight: 700, color: '#10b981', cursor: 'pointer' }}
              >
                Done
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Statistik ─── */
function StatistikTab({ match }) {
  const [period, setPeriod] = useState('all');
  let stats = match.statistics || {};
  const pStats = match.player_statistics || [];

  if (pStats.length > 0) {
    const computed = { ...stats };
    const homeId = match.home_team?.id;
    
    pStats.forEach(ps => {
      const isHome = ps.player?.team_id === homeId;
      const suffix = isHome ? '_home' : '_away';
      if (ps.statistics && typeof ps.statistics === 'object') {
        Object.entries(ps.statistics).forEach(([key, val]) => {
          const num = parseFloat(val) || 0;
          computed[`${key}${suffix}`] = (computed[`${key}${suffix}`] || 0) + num;
        });
      }
    });
    stats = computed;
  }

  const isStatsEmpty = !stats || (Array.isArray(stats) && stats.length === 0) || (typeof stats === 'object' && Object.keys(stats).length === 0);

  if (isStatsEmpty) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: '#8b92a5', fontWeight: 600 }}>Statistik pertandingan belum tersedia.</p>
      </div>
    );
  }

  const sport = match.tournament?.sport;
  const sportSlug = String(sport?.slug || '').toLowerCase();
  const isFootballOrFutsal = !sportSlug || ['football', 'futsal', 'soccer', 'sepak-bola', 'sepakbola'].some(s => sportSlug.includes(s));

  const prefix = period === 'all' ? '' : period === 'h1' ? 'h1_' : 'h2_';
  const s = (key) => stats[`${prefix}${key}`];

  const Badge = ({ value, color }) => (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 800, color: color, flexShrink: 0,
      background: `${color}15`,
    }}>
      {value}
    </div>
  );

  const StatRow = ({ label, homeVal, awayVal, lowerIsBetter = false }) => {
    const hStr = homeVal != null ? String(homeVal) : '0';
    const aStr = awayVal != null ? String(awayVal) : '0';
    const h = parseFloat(hStr) || 0;
    const a = parseFloat(aStr) || 0;

    let hWin = h > a;
    let aWin = a > h;
    
    if (lowerIsBetter) {
      hWin = h < a;
      aWin = a < h;
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          {hWin ? (
            <div style={{ background: '#27345b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 16, textAlign: 'center' }}>
              {hStr}
            </div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', padding: '4px 14px', textAlign: 'center' }}>
              {hStr}
            </div>
          )}
        </div>
        <div style={{ flex: 2, textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {aWin ? (
            <div style={{ background: '#df9a0f', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 16, textAlign: 'center' }}>
              {aStr}
            </div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', padding: '4px 14px', textAlign: 'center' }}>
              {aStr}
            </div>
          )}
        </div>
      </div>
    );
  };

  const labelMap = {
    passing: 'Passing',
    kontrol: 'Kontrol',
    dribling: 'Dribling',
    finishing: 'Finishing',
    stamina: 'Stamina',
    koordinasi_pemain: 'Koordinasi Antar Pemain',
    tackles: 'Tackle',
    saves: 'Penyelamatan',
    service: 'Service',
    block: 'Block',
    smash: 'Smash',
    dig: 'Dig',
    assist: 'Assist',
    footwalk: 'Footwalk',
    penempatan_posisi: 'Penempatan Posisi',
    loop: 'Loop',
    error: 'Error'
  };

  const possHome = parseInt(s('possession_home')) || 50;
  const possAway = parseInt(s('possession_away')) || 50;

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=24&background=${bg}&color=fff`;

  const periods = [
    { id: 'all', label: 'Semua' },
    { id: 'h1', label: 'Babak 1' },
    { id: 'h2', label: 'Babak 2' },
  ];

  const SPORT_STATS = {
    football: [
      { key: 'possession', label: 'Penguasaan Bola', type: 'percentage' },
      { key: 'shots', label: 'Total Tembakan' },
      { key: 'shots_on_target', label: 'Tembakan Tepat Sasaran' },
      { key: 'corners', label: 'Tendangan Sudut' },
      { key: 'fouls', label: 'Pelanggaran', lowerIsBetter: true },
      { key: 'offsides', label: 'Offside', lowerIsBetter: true },
      { key: 'yellow_cards', label: 'Kartu Kuning', lowerIsBetter: true },
      { key: 'red_cards', label: 'Kartu Merah', lowerIsBetter: true },
    ],
    futsal: [
      { key: 'possession', label: 'Penguasaan Bola', type: 'percentage' },
      { key: 'shots', label: 'Total Tembakan' },
      { key: 'shots_on_target', label: 'Tembakan Tepat Sasaran' },
      { key: 'corners', label: 'Tendangan Sudut' },
      { key: 'fouls', label: 'Pelanggaran', lowerIsBetter: true },
      { key: 'yellow_cards', label: 'Kartu Kuning', lowerIsBetter: true },
      { key: 'red_cards', label: 'Kartu Merah', lowerIsBetter: true },
    ],
    basketball: [
      { key: 'points', label: 'Poin' },
      { key: 'rebounds', label: 'Rebounds' },
      { key: 'assists', label: 'Assists' },
      { key: 'steals', label: 'Steals' },
      { key: 'blocks', label: 'Blocks' },
      { key: 'turnovers', label: 'Turnovers', lowerIsBetter: true },
      { key: 'fouls', label: 'Pelanggaran', lowerIsBetter: true },
    ],
    volleyball: [
      { key: 'service', label: 'Service' },
      { key: 'block', label: 'Block' },
      { key: 'smash', label: 'Smash / Kills' },
      { key: 'dig', label: 'Digs / Penyelamatan' },
      { key: 'assist', label: 'Assists / Umpan' },
      { key: 'error', label: 'Errors', lowerIsBetter: true },
    ],
    badminton: [
      { key: 'aces', label: 'Service Aces' },
      { key: 'smashes', label: 'Smashes' },
      { key: 'net_wins', label: 'Net Play Wins' },
      { key: 'errors', label: 'Unforced Errors', lowerIsBetter: true },
    ]
  };

  const statConfig = SPORT_STATS[sportSlug] || SPORT_STATS.football;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sub-tabs */}
      {isFootballOrFutsal && (
        <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                background: period === p.id ? 'var(--primary)' : 'var(--bg-subtle)',
                color: period === p.id ? 'var(--bg-app)' : 'var(--text-secondary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {statConfig.map(config => {
          if (config.type === 'percentage') {
            const hVal = parseInt(s(`${config.key}_home`)) || 50;
            const aVal = parseInt(s(`${config.key}_away`)) || 50;
            return (
              <div key={config.key} style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Statistik Utama</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>Persentase {config.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', height: 36, gap: 2 }}>
                  <div style={{ flex: hVal, background: '#27345b', height: '100%', borderRadius: '18px 0 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 16, transition: 'flex 1s ease' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{hVal}%</span>
                  </div>
                  <div style={{ flex: aVal, background: '#df9a0f', height: '100%', borderRadius: '0 18px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, transition: 'flex 1s ease' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{aVal}%</span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <StatRow 
              key={config.key} 
              label={config.label} 
              homeVal={s(`${config.key}_home`)} 
              awayVal={s(`${config.key}_away`)} 
              lowerIsBetter={config.lowerIsBetter} 
            />
          );
        })}
      </div>

    </div>
  );
}

function RingkasanTab({ match }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchData: match })
        });
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.summary) {
            setSummary(data.summary);
          } else {
            setError(data.error || 'Gagal mengambil ringkasan.');
          }
        }
      } catch (err) {
        if (isMounted) setError('Gagal terhubung ke server AI.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, [match]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
        padding: 24, borderRadius: 16, color: '#fff', position: 'relative', overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(49, 46, 129, 0.2)'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
          <Sparkles size={120} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 8 }}>
            <Sparkles size={18} color="#fbbf24" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>Analisis & Ringkasan AI</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 12, opacity: 0.8, fontStyle: 'italic' }}>AI sedang membaca jalannya pertandingan...</span>
            </div>
            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, width: '100%', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, width: '90%', animation: 'pulse 1.5s infinite 0.2s' }} />
            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, width: '95%', animation: 'pulse 1.5s infinite 0.4s' }} />
            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s infinite 0.6s' }} />
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,0.2)', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}


