"use client";
import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useState, useEffect, useRef } from 'react';
import { Clock, ArrowLeft, MapPin, Users, Trophy, CalendarDays, CloudSun, Target, Activity, Star, ChevronLeft, ChevronRight, FileText, BarChart2, Zap, List, Maximize2, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getImageUrl } from '../../../api';
import { calculateCoordinates } from '../../../utils/formationCoords';

const TABS = [
  { id: 'rincian', label: 'Rincian', icon: FileText },
  { id: 'lineup', label: 'Lineup', icon: Users },
  { id: 'statistik', label: 'Statistik', icon: BarChart2 },
  { id: 'h2h', label: 'H2H', icon: Zap },
  { id: 'klasemen', label: 'Klasemen', icon: List },
];



const formatGameMinute = (minute) => {
  if (minute === null || minute === undefined) return '';
  if (typeof minute === 'number') return Math.floor(minute);
  const parsed = parseFloat(minute);
  if (!isNaN(parsed) && String(minute).includes('.')) {
    return Math.floor(parsed);
  }
  return minute;
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
  const hideMaximize = true;

  const [match, setMatch] = useState(null);
  const [standings, setStandings] = useState(null);
  const [activeTab, setActiveTab] = useState('rincian');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tabHovered, setTabHovered] = useState(false);
  const tabsRef = useRef(null);
  const prevMatchIdRef = useRef(null);

  useEffect(() => {
    if (!matchId) return;

    let isMounted = true;

    // Only reset data when switching to a genuinely different match
    if (prevMatchIdRef.current !== matchId) {
      prevMatchIdRef.current = matchId;
      setMatch(null);
      setStandings(null);
      setErrorMsg(null);
    }

    const fetchDetail = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await api.get(`/matches/${matchId}`);
        if (res.data.success && isMounted) {
          setMatch(res.data.data);
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
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail(true);

    // Poll every 30s to keep minute, scores, and standings updated in real time
    const intervalId = setInterval(() => {
      fetchDetail(false);
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
        <p style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Memuat detail pertandingan...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Terjadi Kesalahan Server</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, marginBottom: 18 }}>Error: {errorMsg}</p>
        <button onClick={() => router.back()} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Kembali
        </button>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Pertandingan Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, marginBottom: 18 }}>Maaf, pertandingan yang Anda cari tidak tersedia atau telah dihapus.</p>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Detail Pertandingan</span>
      </div>

      <div className="card animate-slide-up">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="loader"></div>
        </div>
      ) : match ? (
        <>
          {/* Header Seamless */}
          <div style={{ position: 'relative', padding: '48px 0 0' }}>

            {!hideMaximize && (
              <Link href={`/matches/${matchId}`} style={{ position: 'absolute', top: 16, right: 16, padding: 8, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                <Maximize2 size={16} />
              </Link>
            )}

            {/* Teams & Score */}
            <div className="match-header-flex" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 10, padding: '0 24px' }}>
              {/* Home */}
              <div className="team-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} alt="" className="team-logo" style={{ width: 84, height: 84, objectFit: 'contain' }} />
                <span className="team-name-text" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, textAlign: 'center' }}>{match.home_team?.name}</span>
              </div>

              {/* Score Center */}
              <div className="score-center-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {isLive && (
                  <div style={{ background: 'var(--accent-rose)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Activity size={12} /> LIVE
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {isFinished || isLive ? (
                    <>
                      <span className="score-number" style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.home_score}</span>
                      <span className="score-divider" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)' }}>-</span>
                      <span className="score-number" style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.away_score}</span>
                    </>
                  ) : (
                    <span className="score-time" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {sched?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {isLive && match.minute && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 6, marginTop: 12 }}>
                    {formatGameMinute(match.minute)}{match.minute !== 'HT' && match.minute !== 'FT' ? "'" : ""}
                  </span>
                )}
                {isFinished && !isLive && (
                  <div className="status-text" style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Waktu Penuh
                  </div>
                )}
              </div>

              {/* Away */}
              <div className="team-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} alt="" className="team-logo" style={{ width: 84, height: 84, objectFit: 'contain' }} />
                <span className="team-name-text" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16, textAlign: 'center' }}>{match.away_team?.name}</span>
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
                      <div key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          onClick={() => handlePlayerClick(g.player?.uuid)}
                          style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                        >
                          {g.player?.name || 'Pemain'}
                        </span>
                        {g.event_type === 'penalty' && <span style={{ fontSize: 10, color: 'var(--warning)' }}>(P)</span>}
                        {g.event_type === 'own_goal' && <span style={{ fontSize: 10, color: 'var(--accent-rose)' }}>(OG)</span>}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatGameMinute(g.minute)}&apos;</span>
                      </div>
                    ))}
                  </div>
                  {/* Ball Icon */}
                  <div className="ball-icon-divider" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 2, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                  </div>
                  {/* Away Scorers */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    {awayGoals.map((g, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatGameMinute(g.minute)}&apos;</span>
                        <span
                          onClick={() => handlePlayerClick(g.player?.uuid)}
                          style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                        >
                          {g.player?.name || 'Pemain'}
                        </span>
                        {g.event_type === 'penalty' && <span style={{ fontSize: 10, color: 'var(--warning)' }}>(P)</span>}
                        {g.event_type === 'own_goal' && <span style={{ fontSize: 10, color: 'var(--accent-rose)' }}>(OG)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Divider */}
            <div style={{ margin: '32px 0 0', height: 1, background: 'var(--border)' }} />



            {/* Tabs */}
            <div
              style={{ position: 'relative', marginTop: 16, padding: '0 24px' }}
            >
              {/* Scrollable Tabs */}
              <div
                ref={tabsRef}
                style={{ display: 'flex', gap: 32, overflowX: 'auto', borderBottom: '1px solid var(--border-light)', paddingBottom: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="hide-scrollbar"
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        position: 'relative',
                        padding: '0 0 16px 0', fontSize: 14, fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', transition: 'all 0.2s ease', cursor: 'pointer',
                        background: 'none', border: 'none'
                      }}
                    >
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
          </div>

          {/* Content */}
          <div style={{ padding: '24px 24px' }}>
            {activeTab === 'rincian' && <RincianTab match={match} />}
            {activeTab === 'lineup' && <LineupTab match={match} />}
            {activeTab === 'statistik' && <StatistikTab match={match} />}
            {activeTab === 'h2h' && <H2HTab match={match} />}
            {activeTab === 'klasemen' && (
              <KlasemenTab standings={standings} match={match} sport={match.tournament?.sport} />
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: '#8b92a5', fontSize: 13 }}>
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
            font-size: 11px !important; 
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
          .score-number { font-size: 28px !important; }
          .score-divider { font-size: 12px !important; margin: 0 4px !important; }
          .score-time { font-size: 18px !important; }
          .status-text { font-size: 9px !important; margin-top: 8px !important; }
          
          .scorers-container { 
            flex-direction: row !important; 
            gap: 6px !important;
            margin-top: 16px !important;
          }
          .scorers-container > div { font-size: 10px !important; }
          .scorers-container span { font-size: 10px !important; }
          .ball-icon-divider { display: flex !important; transform: scale(0.8); }

          .info-cards-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .info-card { padding: 10px !important; }
          .info-card-label { font-size: 8px !important; }
          .info-card-value { font-size: 11px !important; }
          
          .timeline-container { padding-left: 0 !important; }
          .timeline-event { gap: 4px !important; }
          .timeline-left { padding-right: 4px !important; }
          .timeline-right { padding-left: 4px !important; }
          .timeline-center { width: 18px !important; height: 18px !important; font-size: 7px !important; }

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
        <div style={{ fontSize: 12, color: '#555d75', fontWeight: 600 }}>Belum ada gol dalam pertandingan ini.</div>
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
                <span style={{ fontSize: 13, fontWeight: 800, color: teamColor }}>
                  {g.minute ? `${formatGameMinute(g.minute)}'` : '-'}
                </span>
              </div>

              {/* Player Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    onClick={() => handlePlayerClick(g.player?.uuid)}
                    style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                  >
                    {g.player?.name || 'Pemain'}
                  </span>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: typeInfo.color,
                    background: typeInfo.bg, padding: '2px 8px', borderRadius: 10,
                    border: `1px solid ${typeInfo.color}30`, flexShrink: 0,
                  }}>
                    {typeInfo.text}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={teamLogo} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'contain' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{teamName}</span>
                  {g.event_data?.assist && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• Assist: {g.event_data.assist}</span>
                  )}
                  {g.event_data?.commentary && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>• {g.event_data.commentary}</span>
                  )}
                </div>
              </div>

              {/* Running Score */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '6px 12px', flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6' }}>{runHome}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>-</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>{runAway}</span>
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
        <span className="info-card-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="info-card-value" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
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

      {/* Info Pertandingan */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Info Pertandingan</span>
        </div>
        <div className="info-cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoCard icon={CalendarDays} label="Tanggal" value={d?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) || '-'} />
          <InfoCard icon={Clock} label="Waktu" value={d?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '-'} />
          <InfoCard icon={MapPin} label="Tempat" value={match.venue?.name || match.field_court || 'TBD'} color="#22c55e" />
          <InfoCard icon={Trophy} label="Babak" value={match.round ? `Pekan ${match.round}` : '-'} color="#eab308" />
          {match.referee && (
            <InfoCard icon={Target} label="Wasit" value={match.referee.name} color="#a855f7" />
          )}
          {match.statistics?.weather && (
            <InfoCard icon={CloudSun} label="Cuaca" value={match.statistics.weather} color="#f97316" />
          )}
          {match.statistics?.attendance && (
            <InfoCard icon={Users} label="Penonton" value={match.statistics.attendance} color="#06b6d4" />
          )}
        </div>
      </div>

      {/* Detail Gol */}
      <GoalDetailSection match={match} />

      {/* ── Mini Stats (Possession & Key Events) ── */}
      {match.statistics && (
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginTop: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 16 }}>
            Persentase Penguasaan Bola
          </div>

          <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden' }}>
            {/* Home Bar */}
            <div style={{ flex: parseInt(match.statistics.possession_home) || 50, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
              <img src={getImageUrl(match.home_team?.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.home_team?.name || '?')}`} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{match.statistics.possession_home || 50}%</span>
            </div>
            {/* Away Bar */}
            <div style={{ flex: parseInt(match.statistics.possession_away) || 50, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{match.statistics.possession_away || 50}%</span>
              <img src={getImageUrl(match.away_team?.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.away_team?.name || '?')}`} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            {/* Corners Pill */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{match.statistics.corners_home || 0}</span>
              <span style={{ fontSize: 13 }}>⛳️</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{match.statistics.corners_away || 0}</span>
            </div>
            {/* Yellow Cards Pill */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{match.statistics.yellow_cards_home || 0}</span>
              <div style={{ width: 10, height: 14, background: '#eab308', borderRadius: 2 }}></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{match.statistics.yellow_cards_away || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Kejadian Pertandingan */}
      {match.events && match.events.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            {/* Center line */}
            <div style={{ position: 'absolute', left: '50%', top: 12, bottom: 0, width: 2, background: 'var(--border)', transform: 'translateX(-50%)' }} />

            {/* Top Score Marker */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, marginBottom: 24 }}>
              <div className="timeline-marker" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{match.status === 'finished' ? 'FT' : formatGameMinute(match.minute) || 'LIVE'}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{match.home_score}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)' }}>-</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{match.away_score}</span>
              </div>
            </div>

            <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 16 }}>
              {match.events.map((ev, i) => {
                const isHome = ev.team_id === match.home_team?.id;

                const EventIconCircle = ({ type }) => {
                  if (type === 'goal' || type === 'penalty' || type === 'own_goal')
                    return <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="10" /></svg></div>;
                  if (type === 'yellow_card') return <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 10, height: 14, background: '#eab308', borderRadius: 2 }} /></div>;
                  if (type === 'red_card') return <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 10, height: 14, background: '#ef4444', borderRadius: 2 }} /></div>;
                  if (type === 'substitution') return (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 8h5v3l4-4-4-4v3H9z" fill="#22c55e" />
                        <path d="M15 16h-5v-3l-4 4 4 4v-3h5z" fill="#ef4444" />
                      </svg>
                    </div>
                  );
                  return <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6' }} />;
                };

                return (
                  <div key={i} className="timeline-event" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    {/* Left Side (Home) */}
                    <div className="timeline-left" style={{ flex: 1, paddingRight: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                      {isHome && (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span
                              onClick={() => handlePlayerClick(ev.player?.uuid)}
                              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                            >
                              {ev.player?.name || 'Pemain'}
                            </span>
                            {ev.event_data?.commentary && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.event_data.commentary}</span>}
                          </div>
                          <img
                            onClick={() => handlePlayerClick(ev.player?.uuid)}
                            src={getImageUrl(ev.player?.photo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(ev.player?.name || 'P')}&size=32&background=e2e8f0&color=1e293b`}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border)' }}
                            alt=""
                          />
                          <EventIconCircle type={ev.event_type} />
                        </>
                      )}
                    </div>

                    {/* Center Bubble */}
                    <div className="timeline-center" style={{
                      height: 24, padding: '0 10px', borderRadius: 12,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ev.minute ? `${formatGameMinute(ev.minute)}'` : `#${ev.sequence}`}
                      </span>
                    </div>

                    {/* Right Side (Away) */}
                    <div className="timeline-right" style={{ flex: 1, paddingLeft: 16, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12 }}>
                      {!isHome && (
                        <>
                          <EventIconCircle type={ev.event_type} />
                          <img
                            onClick={() => handlePlayerClick(ev.player?.uuid)}
                            src={getImageUrl(ev.player?.photo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(ev.player?.name || 'P')}&size=32&background=e2e8f0&color=1e293b`}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border)' }}
                            alt=""
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                            <span
                              onClick={() => handlePlayerClick(ev.player?.uuid)}
                              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                            >
                              {ev.player?.name || 'Pemain'}
                            </span>
                            {ev.event_data?.commentary && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ev.event_data.commentary}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: '#555d75', fontWeight: 600 }}>
          Belum ada kejadian pertandingan.
        </div>
      )}
    </div>
  );
}


/* ─── Lineup ─── */
function LineupTab({ match }) {
  const stats = match.player_statistics || [];
  const home = stats.filter(s => s.player?.team_id === match.home_team?.id);
  const away = stats.filter(s => s.player?.team_id === match.away_team?.id);

  const homeSubs = home.filter(p => !p.is_starter);
  const awaySubs = away.filter(p => !p.is_starter);
  const maxSubs = Math.max(homeSubs.length, awaySubs.length);

  const avatar = (name, bg) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=40&background=${bg}&color=fff`;

  if (stats.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <div className="empty-state-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
          <Users style={{ width: 20, height: 20, color: '#555d75' }} />
        </div>
        <p style={{ fontSize: 12, color: '#8b92a5', fontWeight: 600 }}>Susunan pemain belum tersedia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Pitch Visualizer */}
      <PitchVisualizer
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        homePlayers={home}
        awayPlayers={away}
        homeFormation={match.statistics?.home_formation}
        awayFormation={match.statistics?.away_formation}
      />

      {/* 2. Info Bar Formasi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{match.statistics?.home_formation || 'TBD'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{match.statistics?.away_formation || 'TBD'}</span>
          <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
        </div>
      </div>

      {/* 3. Bangku Cadangan */}
      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10l-5-5-5 5" /><path d="M12 5v14" /></svg>
            BANGKU
          </div>

          <div style={{ position: 'relative' }}>
            {/* Center Divider */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)', transform: 'translateX(-50%)' }}></div>

            {/* Team Logos Header */}
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} style={{ width: 28, height: 28, opacity: 0.8 }} alt="" />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} style={{ width: 28, height: 28, opacity: 0.8 }} alt="" />
              </div>
            </div>

            {/* Subs Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Array(maxSubs).fill(null).map((_, i) => {
                const hP = homeSubs[i];
                const aP = awaySubs[i];
                return (
                  <div key={i} style={{ display: 'flex' }}>
                    {/* Home Sub */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingRight: 20 }}>
                      {hP ? (
                        <>
                          <span
                            onClick={() => handlePlayerClick(hP.player?.uuid)}
                            style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                          >
                            {hP.player?.name}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{hP.player?.jersey_number || '-'}</span>
                          <img
                            onClick={() => handlePlayerClick(hP.player?.uuid)}
                            src={getImageUrl(hP.player?.photo_path) || avatar(hP.player?.name, '3b82f6')}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                            alt=""
                          />
                        </>
                      ) : null}
                    </div>

                    {/* Away Sub */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingLeft: 20 }}>
                      {aP ? (
                        <>
                          <img
                            onClick={() => handlePlayerClick(aP.player?.uuid)}
                            src={getImageUrl(aP.player?.photo_path) || avatar(aP.player?.name, 'ef4444')}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                            alt=""
                          />
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{aP.player?.jersey_number || '-'}</span>
                          <span
                            onClick={() => handlePlayerClick(aP.player?.uuid)}
                            style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.1)' }}
                          >
                            {aP.player?.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PitchVisualizer({ homeTeam, awayTeam, homePlayers, awayPlayers, homeFormation, awayFormation }) {
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

  return (
    <div className="pitch-container" style={{ position: 'relative', width: '100%', height: '640px', background: '#ecfdf5', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Pitch Lines */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#d1fae5', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', border: '2px solid #d1fae5', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
      <div style={{ position: 'absolute', top: '-10px', left: '20%', right: '20%', height: '100px', border: '2px solid #d1fae5' }} />
      <div style={{ position: 'absolute', bottom: '-10px', left: '20%', right: '20%', height: '100px', border: '2px solid #d1fae5' }} />
      <div style={{ position: 'absolute', top: '-10px', left: '35%', right: '35%', height: '45px', border: '2px solid #d1fae5' }} />
      <div style={{ position: 'absolute', bottom: '-10px', left: '35%', right: '35%', height: '45px', border: '2px solid #d1fae5' }} />

      {/* Away Players (Top Half) */}
      {aSorted.map((p, i) => {
        const c = aCoords[i] || { x: 50, y: 50 };
        const top = 50 - (c.y / 100) * 45;
        return (
          <div key={p.id} onClick={() => handlePlayerClick(p.player?.uuid)} className="player-dot" style={{ position: 'absolute', left: `${c.x}%`, top: `${top}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, cursor: 'pointer' }}>
            <img src={getImageUrl(p.player?.photo_path) || avatar(p.player?.name, 'ef4444')} style={{ width: 26, height: 26, borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', objectFit: 'cover', border: '2px solid #fff' }} alt="" />
            <div style={{ background: '#fff', color: 'var(--text-primary)', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '3px', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {p.player?.jersey_number} {p.player?.name.split(' ').pop()}
            </div>
          </div>
        );
      })}

      {/* Home Players (Bottom Half) */}
      {hSorted.map((p, i) => {
        const c = hCoords[i] || { x: 50, y: 50 };
        const top = 50 + (c.y / 100) * 45;
        return (
          <div key={p.id} onClick={() => handlePlayerClick(p.player?.uuid)} className="player-dot" style={{ position: 'absolute', left: `${c.x}%`, top: `${top}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, cursor: 'pointer' }}>
            <img src={getImageUrl(p.player?.photo_path) || avatar(p.player?.name, '3b82f6')} style={{ width: 26, height: 26, borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', objectFit: 'cover', border: '2px solid #fff' }} alt="" />
            <div style={{ background: '#fff', color: 'var(--text-primary)', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '3px', whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
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
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamName}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {matches.length > 0 ? matches.map((m, i) => {
            const r = getResult(m, teamId);
            return (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: '50%',
                background: resultBg(r), border: `2px solid ${resultColor(r)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: resultColor(r),
              }}>
                {r}
              </div>
            );
          }) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>}
        </div>
      </div>
    </div>
  );

  // Match row
  const MatchRow = ({ m }) => {
    const d = new Date(m.scheduled_at);
    const hName = m.home_team_id === homeId ? match.home_team?.name : match.away_team?.name;
    const aName = m.away_team_id === awayId ? match.away_team?.name : (m.away_team_id === homeId ? match.home_team?.name : match.away_team?.name);
    const hWin = m.home_score > m.away_score;
    const aWin = m.away_score > m.home_score;
    const isDraw = m.home_score === m.away_score;
    const accentColor = isDraw ? '#8b92a5' : (hWin && m.home_team_id === homeId) || (aWin && m.away_team_id === homeId) ? '#3b82f6' : '#eab308';

    return (
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 14px',
        background: 'var(--bg-subtle)', borderRadius: 12,
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', width: 56, flexShrink: 0, fontWeight: 500 }}>
          {d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
        </div>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: hWin ? 700 : 500, color: hWin ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hName}
        </div>
        <div style={{
          margin: '0 10px', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)',
          background: 'var(--bg-card)', border: `1px solid var(--border)`,
          padding: '3px 10px', borderRadius: 8, flexShrink: 0,
          fontVariantNumeric: 'tabular-nums', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          {m.home_score} - {m.away_score}
        </div>
        <div style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: aWin ? 700 : 500, color: aWin ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {aName}
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
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Menang</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#3b82f6' }}>{homeWins}</span>
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
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Seri</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#8b92a5' }}>{draws}</span>
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
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Menang</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#eab308' }}>{awayWins}</span>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Form - 5 Laga Terakhir</div>
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
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Riwayat Pertemuan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {h2h.map((m, i) => <MatchRow key={i} m={m} />)}
          </div>
        </div>
      )}

      {/* Home Form History */}
      {formHome.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>5 Laga Terakhir: {match.home_team?.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formHome.map((m, i) => <MatchRow key={i} m={m} />)}
          </div>
        </div>
      )}

      {/* Away Form History */}
      {formAway.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>5 Laga Terakhir: {match.away_team?.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formAway.map((m, i) => <MatchRow key={i} m={m} />)}
          </div>
        </div>
      )}

      {h2h.length === 0 && formHome.length === 0 && formAway.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, color: '#555d75', fontWeight: 600 }}>
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
        <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Klasemen belum tersedia.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {standings.type === 'grouped' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {standings.groups.map((g, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8eaed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.group?.name}</span>
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
    return <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>Belum ada data klasemen.</div>;
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
        fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
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
                    fontSize: 10, fontWeight: 800, color: pc.color,
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
                    fontSize: 12, fontWeight: isHighlighted ? 800 : 600,
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
                      fontSize: 8, fontWeight: 800, color: resultColor(f),
                    }}>
                      {f}
                    </div>
                  )) : (
                    <span style={{ fontSize: 10, color: '#475569' }}>-</span>
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
/* ─── Statistik ─── */
function StatistikTab({ match }) {
  const [period, setPeriod] = useState('all');
  const stats = match.statistics;
  if (!stats) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <p style={{ fontSize: 12, color: '#8b92a5', fontWeight: 600 }}>Statistik pertandingan belum tersedia.</p>
      </div>
    );
  }

  const sport = match.tournament?.sport;
  const sportSlug = String(sport?.slug || '').toLowerCase();
  const isFootballOrFutsal = !sportSlug || sportSlug === 'football' || sportSlug === 'futsal';

  const prefix = period === 'all' ? '' : period === 'h1' ? 'h1_' : 'h2_';
  const s = (key) => stats[`${prefix}${key}`];

  const Badge = ({ value, color }) => (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color: color, flexShrink: 0,
      background: `${color}15`,
    }}>
      {value}
    </div>
  );

  const StatRow = ({ label, homeVal, awayVal }) => {
    const h = parseInt(homeVal) || 0;
    const a = parseInt(awayVal) || 0;
    const total = h + a;
    let homePct = 50, awayPct = 50;
    if (total > 0) { homePct = (h / total) * 100; awayPct = (a / total) * 100; }
    const hWin = h > a;
    const aWin = a > h;

    return (
      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Badge value={h} color={hWin ? '#3b82f6' : '#94a3b8'} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>{label}</span>
          <Badge value={a} color={aWin ? '#eab308' : '#94a3b8'} />
        </div>
        <div style={{ display: 'flex', height: 5, borderRadius: 3, background: 'var(--bg-subtle)', gap: 3, margin: '0 4px' }}>
          <div style={{ width: `${homePct}%`, background: '#3b82f6', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          <div style={{ width: `${awayPct}%`, background: '#eab308', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
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

  const sportFields = sport?.stat_fields || [];
  const accumFields = sportFields.filter(f => !['goals', 'assists', 'yellow_cards', 'red_cards', 'minutes_played'].includes(f));

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
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
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

      {/* ── Penguasaan Bola ── */}
      {isFootballOrFutsal && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Penguasaan Bola</div>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden', height: 28, background: 'var(--bg-subtle)' }}>
            <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} style={{ width: 22, height: 22, borderRadius: '50%', marginLeft: 3, flexShrink: 0, zIndex: 2 }} alt="" />
            <div style={{ flex: possHome, background: '#3b82f6', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, transition: 'flex 1s ease' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{possHome}%</span>
            </div>
            <div style={{ flex: possAway, background: '#eab308', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 8, transition: 'flex 1s ease' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{possAway}%</span>
            </div>
            <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'eab308')} style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 3, flexShrink: 0, zIndex: 2 }} alt="" />
          </div>
        </div>
      )}

      {/* ── Tembakan ── */}
      {isFootballOrFutsal && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Tembakan</div>
          <StatRow label="Total Tembakan" homeVal={s('shots_home')} awayVal={s('shots_away')} />
          <StatRow label="Tembakan Tepat Sasaran" homeVal={s('shots_on_target_home')} awayVal={s('shots_on_target_away')} />
        </div>
      )}

      {/* ── Umum ── */}
      {isFootballOrFutsal && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
          <StatRow label="Tendangan Sudut" homeVal={s('corners_home')} awayVal={s('corners_away')} />
          <StatRow label="Pelanggaran" homeVal={s('fouls_home')} awayVal={s('fouls_away')} />
          <StatRow label="Offside" homeVal={s('offsides_home')} awayVal={s('offsides_away')} />
          <StatRow label="Kartu Kuning" homeVal={s('yellow_cards_home')} awayVal={s('yellow_cards_away')} />
          <StatRow label="Kartu Merah" homeVal={s('red_cards_home')} awayVal={s('red_cards_away')} />
        </div>
      )}

      {/* ── Statistik Akumulasi (Otomatis dari Pemain) ── */}
      {accumFields.length > 0 && (
        <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Statistik Akumulasi
          </div>
          {accumFields.map(field => (
            <StatRow
              key={field}
              label={labelMap[field] || field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              homeVal={stats[`${field}_home`]}
              awayVal={stats[`${field}_away`]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

