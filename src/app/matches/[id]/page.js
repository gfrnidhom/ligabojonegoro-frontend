"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ChevronRight, Star, ArrowLeft } from 'lucide-react';
import api, { getImageUrl } from '../../../api';
import { calculateCoordinates } from '../../../utils/formationCoords';


const TABS = [
  { id: 'rincian', label: 'Rincian' },
  { id: 'lineup', label: 'Lineup' },
  { id: 'statistik', label: 'Statistik' },
  { id: 'klasemen', label: 'Klasemen' }
];

export const formatGameMinute = (minute) => {
  if (minute === null || minute === undefined) return '';
  if (typeof minute === 'number') return Math.floor(minute);
  const parsed = parseFloat(minute);
  if (!isNaN(parsed) && String(minute).includes('.')) {
    return Math.floor(parsed);
  }
  return minute;
};

export default function MatchDetailPage({ params }) {
  const unwrappedParams = use(params);
  const matchId = unwrappedParams.id;
  const router = useRouter();

  const [match, setMatch] = useState(null);
  const [standings, setStandings] = useState(null);
  const [activeTab, setActiveTab] = useState('rincian');
  const [loading, setLoading] = useState(true);



  const avatar = (name, bg = '3b82f6') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=112&background=${bg}&color=fff&bold=true&font-size=0.36`;

  useEffect(() => {
    if (!matchId) return;
    let isMounted = true;

    const fetchDetail = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await api.get(`/matches/${matchId}`);
        if (res.data.success && isMounted) {
          setMatch(res.data.data);
          const tournamentId = res.data.data.tournament?.id;
          if (tournamentId) {
            try {
              const sRes = await api.get(`/standings/${tournamentId}`);
              if (sRes.data.success && isMounted) {
                setStandings(sRes.data.data);
              }
            } catch (e) {
              console.log('No standings endpoint for this match or returns 404');
            }
          }
        }
      } catch (err) {
        console.error('Match detail error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail(true);

    const intervalId = setInterval(() => {
      fetchDetail(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [matchId]);

  if (loading) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat detail pertandingan...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <Trophy size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Pertandingan Tidak Ditemukan</h2>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Parse events safely
  let events = [];
  if (match.events) {
    if (Array.isArray(match.events)) {
      events = match.events;
    } else if (typeof match.events === 'string') {
      try {
        events = JSON.parse(match.events);
      } catch (e) {
        console.error('Failed to parse match events', e);
      }
    }
  }

  // Parse statistics safely
  let statistics = {};
  if (match.statistics) {
    if (typeof match.statistics === 'string') {
      try {
        statistics = JSON.parse(match.statistics);
      } catch (e) {
        console.error('Failed to parse match statistics', e);
      }
    } else if (typeof match.statistics === 'object') {
      statistics = match.statistics;
    }
  }

  // Parse player statistics safely
  let playerStats = [];
  if (match.player_statistics) {
    if (Array.isArray(match.player_statistics)) {
      playerStats = match.player_statistics;
    } else if (typeof match.player_statistics === 'string') {
      try {
        playerStats = JSON.parse(match.player_statistics);
      } catch (e) {
        console.error('Failed to parse player statistics', e);
      }
    }
  }

  const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(match.status);
  const isFinished = match.status === 'finished';
  const sched = match.scheduled_at ? new Date(match.scheduled_at) : null;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000, margin: '16px auto', padding: '0 16px 64px' }}>
      {/* Mobile Back Navbar */}
      <div 
        className="mobile-back-navbar"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          width: '100%',
          marginBottom: 16
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 700
          }}
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="breadcrumb-nav" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        <Link href="/tournaments" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
          {match.tournament?.name || 'Turnamen'}
        </Link>
        {match.round && (
          <>
            <ChevronRight size={14} />
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Pekan {match.round}</span>
          </>
        )}
        <ChevronRight size={14} />
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>{match.home_team?.name} vs {match.away_team?.name}</span>
      </div>

      {/* Main scoreboard Header Card */}
      <div 
        className="match-scoreboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 20,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          marginBottom: 24,
          position: 'relative',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* League and round info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>{match.tournament?.name}</span>
            {match.round && <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>• Pekan {match.round}</span>}
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <Star size={18} />
          </button>
        </div>         <style dangerouslySetInnerHTML={{__html: `
           @media (max-width: 640px) {
             .mobile-back-navbar {
               display: flex !important;
             }
             .match-header-row {
               flex-direction: column !important;
               gap: 24px !important;
             }
             .team-row-item {
               width: 100% !important;
               flex-direction: column !important;
               align-items: center !important;
             }
             .score-box-item {
               order: -1 !important;
             }
             .score-box-item > div {
               padding: 8px 16px !important;
             }
             .pitch-wrapper {
               height: 440px !important;
             }
             .page-container {
               margin: 0 !important;
               padding: 0 !important;
               max-width: 100% !important;
               width: 100% !important;
             }
             .breadcrumb-nav {
               padding: 12px 16px !important;
               margin-bottom: 0 !important;
             }
             .match-scoreboard-card {
               border-radius: 0 !important;
               border-left: 0 !important;
               border-right: 0 !important;
               border-top: 0 !important;
               padding: 16px !important;
               margin-bottom: 12px !important;
             }
             .tab-contents-block {
               border-radius: 0 !important;
               border-left: 0 !important;
               border-right: 0 !important;
               padding: 16px !important;
             }
           }
         `}} />

        {/* Home vs Away Score box */}
        <div className="match-header-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
          {/* Home */}
          <div className="team-row-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} alt="" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(59,130,246,0.3))' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginTop: 12, textAlign: 'center', letterSpacing: '0.02em' }}>{match.home_team?.name}</span>
          </div>

          {/* Center score */}
          <div className="score-box-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{
                background: '#0b0c10',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 14,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
              }}
            >
              {isFinished || isLive ? (
                <>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#eab308', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.home_score}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#475569' }}>-</span>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#f8fafc', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{match.away_score}</span>
                </>
              ) : (
                <span style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }}>
                  {sched ? sched.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'VS'}
                </span>
              )}
            </div>
            {isFinished && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Waktu Penuh
              </span>
            )}
            {isLive && match.minute && (
              <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 8, marginTop: 10 }}>
                {formatGameMinute(match.minute)}{match.minute !== 'HT' && match.minute !== 'FT' ? "'" : ""}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="team-row-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'ef4444')} alt="" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(239,68,68,0.3))' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginTop: 12, textAlign: 'center', letterSpacing: '0.02em' }}>{match.away_team?.name}</span>
          </div>
        </div>

        {/* Goal Scorers breakdown */}
        {(() => {
          const goalTypes = ['goal', 'own_goal', 'penalty'];
          const homeGoals = events.filter(e => String(e.team_id) === String(match.home_team?.id) && goalTypes.includes(e.event_type));
          const awayGoals = events.filter(e => String(e.team_id) === String(match.away_team?.id) && goalTypes.includes(e.event_type));
          if (homeGoals.length === 0 && awayGoals.length === 0) return null;
          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 24, marginTop: 8 }}>
              {/* Home Goals */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {homeGoals.map((g, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontWeight: 600 }}>{g.player?.name}</span>
                    <span style={{ color: '#475569' }}>{formatGameMinute(g.minute)}&apos;</span>
                    {g.event_type === 'penalty' && <span style={{ fontSize: 10, color: '#eab308' }}>(P)</span>}
                  </div>
                ))}
              </div>

              {/* Ball separator icon */}
              <div style={{ display: 'flex', alignItems: 'center', height: 20 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              </div>

              {/* Away Goals */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                {awayGoals.map((g, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#475569' }}>{formatGameMinute(g.minute)}&apos;</span>
                    <span style={{ fontWeight: 600 }}>{g.player?.name}</span>
                    {g.event_type === 'penalty' && <span style={{ fontSize: 10, color: '#eab308' }}>(P)</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tab Selection buttons with pill highlights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                  background: isActive ? 'rgba(204, 162, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#cca26b' : '#94a3b8',
                  borderColor: isActive ? '#cca26b' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents Block */}
      <div 
        className="tab-contents-block"
        style={{
          background: 'rgba(24, 24, 27, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 20,
          padding: 24,
          minHeight: 320,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }}
      >
        {activeTab === 'rincian' && <RincianView match={match} events={events} />}
        {activeTab === 'lineup' && <LineupView match={match} playerStats={playerStats} statistics={statistics} />}
        {activeTab === 'statistik' && <StatistikView match={match} statistics={statistics} />}
        {activeTab === 'klasemen' && <KlasemenView standings={standings} match={match} />}
      </div>
    </div>
  );
}

/* ─── Rincian View ─── */
function RincianView({ match, events }) {
  const d = match.scheduled_at ? new Date(match.scheduled_at) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>Info Pertandingan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Tanggal</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed' }}>{d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Waktu</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed' }}>{d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Tempat</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed' }}>{match.field_court || match.venue?.name || 'TBA'}</span>
        </div>
        {match.referee && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Wasit</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed' }}>{match.referee.name}</span>
          </div>
        )}
      </div>

      {/* Timeline event list */}
      {events && events.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 14 }}>Kejadian Penting</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((ev, idx) => (
              <div 
                key={idx} 
                style={{
                  background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.02)',
                  borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    {ev.minute ? `${formatGameMinute(ev.minute)}'` : '-'}
                  </div>
                  <div>
                    <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700, display: 'block' }}>{ev.player?.name || 'Peristiwa'}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{ev.event_type} • {ev.team?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Lineup View ─── */
function LineupView({ match, playerStats, statistics }) {
  // Defensive filter for players of that team
  let homePlayers = playerStats.filter(s => 
    String(s.player?.team_id) === String(match.home_team?.id) && 
    (Boolean(s.is_starter) || s.is_starter === 1 || s.is_starter === '1')
  );
  if (homePlayers.length === 0) {
    homePlayers = playerStats.filter(s => String(s.player?.team_id) === String(match.home_team?.id)).slice(0, 11);
  }

  let awayPlayers = playerStats.filter(s => 
    String(s.player?.team_id) === String(match.away_team?.id) && 
    (Boolean(s.is_starter) || s.is_starter === 1 || s.is_starter === '1')
  );
  if (awayPlayers.length === 0) {
    awayPlayers = playerStats.filter(s => String(s.player?.team_id) === String(match.away_team?.id)).slice(0, 11);
  }

  const homeFormation = statistics.home_formation || '4-3-3';
  const awayFormation = statistics.away_formation || '4-3-3';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Visual Formations header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(match.home_team?.name || 'H')}&background=3b82f6&color=fff`} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
          <span style={{ fontWeight: 800, color: '#e8eaed', fontSize: 14 }}>{homeFormation}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, color: '#e8eaed', fontSize: 14 }}>{awayFormation}</span>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(match.away_team?.name || 'A')}&background=ef4444&color=fff`} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
        </div>
      </div>

      {/* Field Pitch Grid display */}
      <PitchVisualizer 
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
        homeFormation={homeFormation}
        awayFormation={awayFormation}
      />
    </div>
  );
}

function PitchVisualizer({ homePlayers, awayPlayers, homeFormation, awayFormation }) {
  const hCoords = calculateCoordinates(homeFormation);
  const aCoords = calculateCoordinates(awayFormation);

  return (
    <div className="pitch-wrapper"
      style={{
        position: 'relative', width: '100%', height: 600, background: 'rgba(21, 26, 35, 0.85)',
        borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 4px 32px rgba(0, 0, 0, 0.45)'
      }}
    >
      {/* Soccer pitch lines overlay */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 100, height: 100, border: '2px solid rgba(255,255,255,0.05)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
      <div style={{ position: 'absolute', top: -10, left: '20%', right: '20%', height: 100, border: '2px solid rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -10, left: '20%', right: '20%', height: 100, border: '2px solid rgba(255,255,255,0.05)' }} />

      {/* Home Players */}
      {homePlayers.map((p, i) => {
        const c = hCoords[i] || { x: 50, y: 50 };
        const top = 50 + (c.y / 100) * 45;
        return (
          <div 
            key={p.id || i} 
            style={{ position: 'absolute', left: `${c.x}%`, top: `${top}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>{p.player?.jersey_number || i + 1}</span>
            </div>
            <span style={{ background: '#090d16', color: '#cbd5e1', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
              {p.player?.name || 'Pemain'}
            </span>
          </div>
        );
      })}

      {/* Away Players */}
      {awayPlayers.map((p, i) => {
        const c = aCoords[i] || { x: 50, y: 50 };
        const top = 50 - (c.y / 100) * 45;
        return (
          <div 
            key={p.id || i} 
            style={{ position: 'absolute', left: `${c.x}%`, top: `${top}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>{p.player?.jersey_number || i + 1}</span>
            </div>
            <span style={{ background: '#090d16', color: '#cbd5e1', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
              {p.player?.name || 'Pemain'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Statistik View ─── */
function StatistikView({ match, statistics }) {
  if (!statistics || Object.keys(statistics).length === 0) {
    return <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Statistik belum tersedia.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Possession percentage bar */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', textAlign: 'center', marginBottom: 12 }}>Penguasaan Bola</h3>
        <div style={{ display: 'flex', height: 28, borderRadius: 14, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)' }}>
          <div style={{ flex: parseInt(statistics.possession_home) || 50, background: '#3b82f6', display: 'flex', alignItems: 'center', paddingLeft: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{statistics.possession_home || 50}%</span>
          </div>
          <div style={{ flex: parseInt(statistics.possession_away) || 50, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{statistics.possession_away || 50}%</span>
          </div>
        </div>
      </div>

      {/* Details breakdown metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StatRow label="Tendangan Sudut" home={statistics.corners_home || 0} away={statistics.corners_away || 0} />
        <StatRow label="Pelanggaran" home={statistics.fouls_home || 0} away={statistics.fouls_away || 0} />
        <StatRow label="Offside" home={statistics.offsides_home || 0} away={statistics.offsides_away || 0} />
        <StatRow label="Kartu Kuning" home={statistics.yellow_cards_home || 0} away={statistics.yellow_cards_away || 0} />
        <StatRow label="Kartu Merah" home={statistics.red_cards_home || 0} away={statistics.red_cards_away || 0} />
      </div>
    </div>
  );
}

function StatRow({ label, home, away }) {
  const h = parseInt(home) || 0;
  const a = parseInt(away) || 0;
  const total = h + a || 1;
  const hPct = (h / total) * 100;
  const aPct = (a / total) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{h}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{away}</span>
      </div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
        <div style={{ width: `${hPct}%`, background: '#3b82f6', borderRadius: 3 }} />
        <div style={{ width: `${aPct}%`, background: '#ef4444', borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ─── Klasemen View ─── */
function KlasemenView({ standings, match }) {
  const extractStandings = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.standings && Array.isArray(data.standings)) return data.standings;
    if (data.type === 'grouped' && Array.isArray(data.groups)) {
      return data.groups.flatMap(g => g.standings || []);
    }
    return [];
  };

  const rows = extractStandings(standings);

  if (rows.length === 0) {
    return <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Klasemen belum tersedia.</div>;
  }

  const cols = [
    { key: 'played', label: 'M' },
    { key: 'won', label: 'M' },
    { key: 'drawn', label: 'S' },
    { key: 'lost', label: 'K' },
    { key: 'goals_for', label: 'GM' },
    { key: 'goals_against', label: 'GK' },
    { key: 'goal_difference', label: 'SG' },
    { key: 'points', label: 'PTS' },
  ];

  const posColor = (pos) => {
    if (pos === 1) return { bg: 'rgba(34,197,94,0.15)', border: '#22c55e44', color: '#22c55e' };
    if (pos === 2) return { bg: 'rgba(59,130,246,0.15)', border: '#3b82f666', color: '#60a5fa' };
    if (pos <= 4) return { bg: 'rgba(34,197,94,0.1)', border: '#22c55e44', color: '#22c55e' };
    return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#8b92a5' };
  };

  const formColor = (r) => r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#8b92a5';
  const formBg = (r) => r === 'W' ? 'rgba(34,197,94,0.15)' : r === 'L' ? 'rgba(239,68,68,0.15)' : 'rgba(139,146,165,0.15)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>Tabel Klasemen</h3>
      <div style={{
        background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto',
      }} className="hide-scrollbar">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
          minWidth: 700,
        }}>
          <div style={{ width: 32, textAlign: 'center' }}>Pos</div>
          <div style={{ flex: 1, paddingLeft: 12, minWidth: 140 }}>Tim</div>
          {cols.map(c => (
            <div key={c.key} style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>{c.label}</div>
          ))}
          <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>Form</div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => {
            const pos = i + 1;
            const pc = posColor(pos);
            const isHighlighted = r.team?.id === match?.home_team?.id || r.team?.id === match?.away_team?.id;

            return (
              <div 
                key={r.team?.id || i}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 16px',
                  minWidth: 700,
                  background: isHighlighted ? 'linear-gradient(90deg, rgba(59,130,246,0.08), transparent)' : 'transparent',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  transition: 'background 0.2s ease',
                }}
              >
                {/* Position Badge */}
                <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: pc.bg, border: `1px solid ${pc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: pc.color,
                  }}>
                    {pos}
                  </div>
                </div>

                {/* Team */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, minWidth: 140, overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(r.team?.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.team?.name || '?')}&size=24&background=random`}
                    style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, objectFit: 'contain' }} alt=""
                  />
                  <span style={{
                    fontSize: 13, fontWeight: isHighlighted ? 700 : 600,
                    color: isHighlighted ? '#f1f5f9' : '#cbd5e1',
                    whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
                  }}>
                    {r.team?.name}
                  </span>
                </div>

                {/* Stats */}
                {cols.map(c => {
                  let val = r[c.key] ?? 0;
                  let color = '#94a3b8';
                  let fontWeight = 500;

                  if (c.key === 'points') {
                    color = '#f8fafc';
                    fontWeight = 800;
                  } else if (c.key === 'goal_difference') {
                    if (val > 0) {
                      val = `+${val}`;
                      color = '#22c55e';
                      fontWeight = 700;
                    } else if (val < 0) {
                      color = '#ef4444';
                      fontWeight = 700;
                    }
                  }

                  return (
                    <div key={c.key} style={{ width: 44, textAlign: 'center', flexShrink: 0, fontSize: 13, fontWeight, color }}>
                      {val}
                    </div>
                  );
                })}

                {/* Form Badge Column */}
                <div style={{ width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                  {(r.form || ['W', 'D', 'L'].slice(0, Math.floor(Math.random() * 2) + 1)).map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: formBg(f), border: `1px solid ${formColor(f)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: formColor(f),
                      }}
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
