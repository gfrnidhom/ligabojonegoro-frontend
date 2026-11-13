"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, MapPin, Calendar, Users, Award, Shield, ChevronRight, Star, LayoutGrid, List, BarChart2, GitMerge, ChevronUp, ChevronDown, Bell } from 'lucide-react';
import api, { getImageUrl, fetchAllMatches } from '../../../api';
import TournamentBracket from '../../../components/TournamentBracket';

const avatar = (name, bg = '3b82f6') => {
  if (!name) return `https://ui-avatars.com/api/?name=L&background=${bg}&color=fff&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
};

/**
 * Returns grouped player stat configs based on sport slug.
 * The backend always returns: top_scorers (goals, assists), top_cards (yellow_cards, red_cards),
 * top_clean_sheets, top_minutes — so we filter/relabel per sport.
 */
const getPlayerStatGroups = (sportSlug, playerStats) => {
  const slug = String(sportSlug || '').toLowerCase();

  if (slug === 'volleyball') {
    return [
      {
        title: 'Statistik Pemain',
        stats: [
          { key: 'points', label: 'Poin Tertinggi', data: playerStats?.top_scorers, valueKey: 'goals', isNegative: false },
          { key: 'minutes_played', label: 'Menit Bermain', data: playerStats?.top_minutes, valueKey: 'minutes_played', isNegative: false }
        ]
      }
    ];
  }

  if (slug === 'badminton') {
    return [
      {
        title: 'Statistik Pemain',
        stats: [
          { key: 'minutes_played', label: 'Menit Bermain', data: playerStats?.top_minutes, valueKey: 'minutes_played', isNegative: false }
        ]
      }
    ];
  }

  // Default: Football / Futsal
  return [
    {
      title: 'Statistik Utama',
      stats: [
        { key: 'goals', label: 'Pencetak Gol', data: playerStats?.top_scorers, valueKey: 'goals', isNegative: false },
        { key: 'assists', label: 'Assists', data: playerStats?.top_scorers ? [...playerStats.top_scorers].sort((a, b) => (b.assists || 0) - (a.assists || 0)) : [], valueKey: 'assists', isNegative: false },
        { key: 'minutes_played', label: 'Menit Bermain', data: playerStats?.top_minutes, valueKey: 'minutes_played', isNegative: false }
      ]
    },
    {
      title: 'Pertahanan',
      stats: [
        { key: 'clean_sheets', label: 'Tanpa Kebobolan', data: playerStats?.top_clean_sheets, valueKey: 'clean_sheets', isNegative: false }
      ]
    },
    {
      title: 'Pelanggaran & Disiplin',
      stats: [
        { key: 'yellow_cards', label: 'Kartu Kuning', data: playerStats?.top_cards ? [...playerStats.top_cards].sort((a,b) => (b.yellow_cards || 0) - (a.yellow_cards || 0)) : [], valueKey: 'yellow_cards', isNegative: true },
        { key: 'red_cards', label: 'Kartu Merah', data: playerStats?.top_cards ? [...playerStats.top_cards].sort((a,b) => (b.red_cards || 0) - (a.red_cards || 0)) : [], valueKey: 'red_cards', isNegative: true }
      ]
    }
  ];
};

/**
 * Returns grouped team stat configs based on sport slug.
 * Backend team-stats keys: goals, shots, shots_on_target, corners, yellow_cards, red_cards, conceded, matches_played
 */
const getTeamStatGroups = (sportSlug) => {
  const slug = String(sportSlug || '').toLowerCase();

  if (slug === 'volleyball') {
    return [
      {
        title: 'Statistik Utama',
        stats: [
          { key: 'goals', label: 'Poin', isNegative: false },
          { key: 'conceded', label: 'Poin Kemasukan', isNegative: true },
          { key: 'matches_played', label: 'Pertandingan Dimainkan', isNegative: false },
        ]
      }
    ];
  }

  if (slug === 'badminton') {
    return [
      {
        title: 'Statistik Utama',
        stats: [
          { key: 'goals', label: 'Poin', isNegative: false },
          { key: 'conceded', label: 'Poin Kemasukan', isNegative: true },
          { key: 'matches_played', label: 'Pertandingan Dimainkan', isNegative: false },
        ]
      }
    ];
  }

  // Default: Football / Futsal
  return [
    {
      title: 'Statistik Utama',
      stats: [
        { key: 'goals', label: 'Gol', isNegative: false },
        { key: 'shots', label: 'Tembakan', isNegative: false },
        { key: 'shots_on_target', label: 'Tembakan Tepat Sasaran', isNegative: false },
        { key: 'corners', label: 'Tendangan Sudut', isNegative: false },
      ]
    },
    {
      title: 'Pertahanan',
      stats: [
        { key: 'conceded', label: 'Gol Kebobolan', isNegative: true },
        { key: 'matches_played', label: 'Pertandingan Dimainkan', isNegative: false },
      ]
    },
    {
      title: 'Pelanggaran & Disiplin',
      stats: [
        { key: 'yellow_cards', label: 'Kartu Kuning', isNegative: true },
        { key: 'red_cards', label: 'Kartu Merah', isNegative: true },
      ]
    }
  ];
};

/**
 * Returns info tab player stat highlight configs based on sport slug.
 */
const getInfoPlayerStatHighlights = (sportSlug, playerStats) => {
  const slug = String(sportSlug || '').toLowerCase();

  if (slug === 'volleyball') {
    return [
      { title: 'Poin Tertinggi', data: playerStats?.top_scorers, valueKey: 'goals' },
      { title: 'Menit Bermain', data: playerStats?.top_minutes, valueKey: 'minutes_played' },
    ];
  }

  if (slug === 'badminton') {
    return [
      { title: 'Menit Bermain', data: playerStats?.top_minutes, valueKey: 'minutes_played' },
    ];
  }

  // Default: Football / Futsal
  return [
    { title: 'Pencetak Gol', data: playerStats?.top_scorers, valueKey: 'goals' },
    { title: 'Assists', data: playerStats?.top_scorers ? [...playerStats.top_scorers].sort((a, b) => (b.assists || 0) - (a.assists || 0)) : [], valueKey: 'assists' },
  ];
};

function PlayerStatCard({ title, data, valueKey, labelKey = 'goals', isMock = false, isNegative = false }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <ChevronRight size={16} color="var(--text-muted)" />
      </div>
      
      <div>
        {data && data.length > 0 ? data.slice(0, 3).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ marginRight: 12 }}>
              <img src={getImageUrl(item.player?.photo_path) || avatar(item.player?.name)} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <img src={getImageUrl(item.player?.team_logo) || avatar(item.player?.team, 'cbd5e1')} style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'contain' }} alt="" />
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.team || '-'}</div>
              </div>
            </div>
            <div style={{ marginLeft: 16 }}>
              <div style={{ background: isNegative ? '#dc2626' : '#1e3a8a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, minWidth: 28, textAlign: 'center' }}>
                {isMock ? item.mockValue : item[valueKey]}
              </div>
            </div>
          </div>
        )) : (
          <div style={{ padding: '16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>Data tidak tersedia</div>
        )}
      </div>
    </div>
  );
}

function TeamStatCard({ title, data, valueKey, isNegative = false }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <ChevronRight size={16} color="var(--text-muted)" />
      </div>
      
      <div>
        {data && data.length > 0 ? data.slice(0, 3).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ width: 24, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{idx + 1}</div>
            <div style={{ marginRight: 12 }}>
              <img src={getImageUrl(item.team?.logo_path) || avatar(item.team?.name)} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'contain' }} alt="" />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.team?.name}
            </div>
            <div style={{ marginLeft: 16 }}>
              <div style={{ background: isNegative ? '#dc2626' : '#1e3a8a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, minWidth: 28, textAlign: 'center' }}>
                {item[valueKey] ?? item.value}
              </div>
            </div>
          </div>
        )) : (
          <div style={{ padding: '16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>Data tidak tersedia</div>
        )}
      </div>
    </div>
  );
}

export default function TournamentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const tournamentId = unwrappedParams.id;
  const router = useRouter();

  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [bracketData, setBracketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches, bracket, standings, info, players, stats

  const TABS = ['matches', 'bracket', 'standings', 'info', 'teams', 'players', 'stats'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && TABS.includes(tab)) {
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
  const [matchView, setMatchView] = useState(null); // null = otomatis, 'upcoming', 'finished'
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [playerStats, setPlayerStats] = useState({ top_scorers: [], top_cards: [], top_clean_sheets: [], top_minutes: [] });
  const [teamStats, setTeamStats] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch tournament details
        const tRes = await api.get('/tournaments');
        if (tRes.data.success) {
          const matched = tRes.data.data.find(t => String(t.uuid) === String(tournamentId) || String(t.id) === String(tournamentId));
          if (matched) {
            setTournament(matched);
            
            // If it's a knockout or group_knockout, or has_knockout is true, fetch bracket
            if (matched.type === 'group_knockout' || matched.type === 'knockout' || matched.has_knockout) {
              try {
                const kRes = await api.get(`/tournaments/${matched.uuid || matched.id}/knockout`);
                if (kRes.data.success && kRes.data.data.bracket) {
                  setBracketData(kRes.data.data.bracket);
                }
              } catch (err) {
                console.log('No knockout bracket available yet');
              }
            }

            // Fetch standings for this tournament using UUID if possible
            try {
              const sRes = await api.get(`/standings/${matched.uuid || matched.id}`);
              if (sRes.data.success) {
                setStandings(sRes.data.data);
              }
            } catch (err) {
              console.log('No standings endpoint for this tournament or returned 404/500');
            }
          }
        }

        // Fetch matches for this tournament
        const mRes = await fetchAllMatches({ tournament_id: tournamentId });
        if (mRes.data.success) {
          const tMatches = mRes.data.data.filter(m => String(m.tournament_id) === String(tournamentId) || String(m.tournament?.uuid) === String(tournamentId));
          setMatches(tMatches);
        }

        // Fetch player stats
        try {
          const pRes = await api.get('/player-stats', { params: { tournament_id: tournamentId, limit: 10 } });
          if (pRes.data.success) {
            setPlayerStats(pRes.data.data);
          }
        } catch (err) {
          console.log('No player stats available');
        }

        // Fetch team stats
        try {
          const tsRes = await api.get('/team-stats', { params: { tournament_id: tournamentId, limit: 5 } });
          if (tsRes.data.success) {
            setTeamStats(tsRes.data.data);
          }
        } catch (err) {
          console.log('No team stats available');
        }

      } catch (err) {
        console.error('Error fetching tournament detail data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [tournamentId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Memuat detail turnamen...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <Shield size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Turnamen Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 6, marginBottom: 18 }}>Maaf, turnamen yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Group matches by month if needed, or simply filter
  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const finishedMatches = matches
    .filter(m => m.status !== 'scheduled')
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
  // Default: tampilkan jadwal mendatang; jika tidak ada, langsung tampilkan hasil
  const effectiveView = matchView ?? (upcomingMatches.length > 0 ? 'upcoming' : 'finished');
  const filteredMatches = effectiveView === 'upcoming' ? upcomingMatches : finishedMatches;

  let totalTeams = tournament.teams?.length || 0;
  if (totalTeams === 0 && standings) {
    const uniqueTeams = new Set();
    if (standings.type === 'grouped_phases') {
      standings.phases?.forEach(phase => {
        phase.groups?.forEach(g => {
          g.standings?.forEach(s => {
            if (s.team_id || s.team?.id) uniqueTeams.add(s.team_id || s.team?.id);
          });
        });
      });
      totalTeams = uniqueTeams.size;
    } else if (standings.type === 'grouped') {
      standings.groups?.forEach(g => {
        g.standings?.forEach(s => {
          if (s.team_id || s.team?.id) uniqueTeams.add(s.team_id || s.team?.id);
        });
      });
      totalTeams = uniqueTeams.size;
    } else if (Array.isArray(standings)) {
      totalTeams = standings.length;
    } else if (standings.standings) {
      totalTeams = standings.standings.length || 0;
    }
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px 64px' }}>
      <style>{`
        .t-row-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @media (max-width: 640px) {
          .t-row { gap: 6px !important; }
          .t-row-date { width: 40px !important; }
          .t-row-date span:first-child { font-size: 11px !important; }
          .t-row-spacer { display: none !important; }
          .t-row-score { width: 50px !important; }
          .t-row-name { font-size: 13px !important; white-space: normal; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
          .tournament-header-row h1 { font-size: 18px !important; }
        }
      `}</style>
      <div className="animate-slide-up" style={{ width: '100%' }}>
        <div style={{ 
          background: '#ffffff',
          border: '1px solid #eef0f3',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 20
        }}>
          
          {/* Header: logo + nama (kiri), aksi (kanan) */}
          <div className="tournament-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 24px', marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <img src={getImageUrl(tournament.logo_path || tournament.logo) || avatar(tournament.name, 'ffffff')}
                   onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatar(tournament.name, 'ffffff'); }}
                   style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} alt="" />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{tournament.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#6b7280', marginTop: 4, flexWrap: 'wrap' }}>
                  <span>{tournament.sport?.name || 'Turnamen'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {tournament.location || 'Bojonegoro'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {totalTeams} Tim</span>
                </div>
              </div>
            </div>
            <button style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 24, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              Ikuti
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 32, padding: '0 24px', borderBottom: '1px solid var(--border-light)', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="hide-scrollbar">
            {[
              { id: 'info', label: 'Ringkasan' },
              { id: 'matches', label: 'Pertandingan' },
              { id: 'bracket', label: 'Bracket', show: (tournament.type === 'group_knockout' || tournament.type === 'knockout' || bracketData.length > 0) },
              { id: 'standings', label: 'Klasemen', show: Array.isArray(standings) ? standings.length > 0 : (standings?.standings?.length > 0 || standings?.groups?.length > 0 || standings?.phases?.length > 0) },
              { id: 'teams', label: 'Daftar Tim', show: tournament.teams?.length > 0 },
              { id: 'players', label: 'Pemain Terbaik' },
              { id: 'stats', label: 'Statistik Tim' }
            ].filter(t => t.show !== false).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center',
                    padding: '0 0 16px 0', fontSize: 13, fontWeight: 600,
                    color: isActive ? '#111827' : '#6b7280',
                    whiteSpace: 'nowrap', transition: 'all 0.2s ease', cursor: 'pointer',
                    background: 'none', border: 'none', outline: 'none'
                  }}
                >
                  {tab.label}
                  {isActive && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#111827', borderRadius: '4px 4px 0 0' }} />}
                </button>
              )
            })}
          </div>
        </div>

      {/* Content wrapper without the heavy glass card */}
      <div 
        style={{
          padding: '24px 0',
          position: 'relative',
        }}
      >
        {activeTab === 'matches' && (
          <div>
            {/* Matches view filter (Upcoming vs Results) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setMatchView('upcoming')}
                  style={{
                    padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20,
                    border: effectiveView === 'upcoming' ? '1px solid #111827' : '1px solid #e5e7eb',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: effectiveView === 'upcoming' ? '#111827' : '#ffffff',
                    color: effectiveView === 'upcoming' ? '#ffffff' : '#111827'
                  }}
                >
                  Mendatang
                </button>
                <button
                  onClick={() => setMatchView('finished')}
                  style={{
                    padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20,
                    border: effectiveView === 'finished' ? '1px solid #111827' : '1px solid #e5e7eb',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: effectiveView === 'finished' ? '#111827' : '#ffffff',
                    color: effectiveView === 'finished' ? '#ffffff' : '#111827'
                  }}
                >
                  Hasil
                </button>
              </div>

              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {viewMode === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
              </button>
            </div>

            {/* Individual match rows grouped by month */}
            {filteredMatches.length > 0 ? (() => {
              // Group matches by month
              const monthGroups = {};
              filteredMatches.forEach(m => {
                const d = m.scheduled_at ? new Date(m.scheduled_at) : null;
                const key = d ? d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Belum Ditentukan';
                if (!monthGroups[key]) monthGroups[key] = [];
                monthGroups[key].push(m);
              });

              return Object.entries(monthGroups).map(([monthLabel, monthMatches]) => (
                <div key={monthLabel}>
                  {/* Month header */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '20px 4px 10px', textTransform: 'capitalize' }}>
                    {monthLabel}
                  </div>

                  <div style={
                    viewMode === 'grid' 
                    ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }
                    : { display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #eef0f3', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
                  }>
                    {monthMatches.map(m => {
                      const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                      const isFinished = m.status === 'finished';
                      const hasScore = isLive || isFinished;
                      const time = m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : 'TBA';
                      const dateShort = m.scheduled_at
                        ? new Date(m.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                        : '-';

                      if (viewMode === 'grid') {
                        return (
                            <div
                              key={m.id}
                              onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
                              style={{
                                background: 'var(--bg-subtle)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 20,
                                padding: '20px 16px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                              }}
                              className="hover-card-grid"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, width: '100%' }}>
                                {isLive ? (
                                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em', animation: 'pulseGlow 2s infinite' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
                                    LIVE
                                  </div>
                                ) : isFinished ? (
                                  <div style={{ background: 'var(--border-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                    SELESAI
                                  </div>
                                ) : (
                                  <div style={{ background: 'rgba(0, 0, 0, 0.08)', color: 'var(--text-primary)', border: '1px solid rgba(0, 0, 0, 0.15)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                    {time}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                  <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                    <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatar(m.home_team?.name); }} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.05))' }} alt="" />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3 }}>{m.home_team?.name}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ 
                                    background: 'var(--bg-subtle)', 
                                    border: '1px solid var(--border-light)', 
                                    borderRadius: 16, 
                                    padding: '8px 16px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 12,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                                  }}>
                                    {hasScore ? (
                                      <>
                                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{m.home_score}</span>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>-</span>
                                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{m.away_score}</span>
                                      </>
                                    ) : (
                                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>VS</span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                  <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                    <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = avatar(m.away_team?.name); }} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.05))' }} alt="" />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3 }}>{m.away_team?.name}</span>
                                </div>
                              </div>
                            </div>
                        );
                      }

                      return (
                        <div 
                          key={m.id} 
                          onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
                          style={{
                            background: 'transparent',
                            borderBottom: '1px solid #f1f5f9',
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            width: '100%',
                          }}
                          className="hover-bg"
                        >
                          <div className="t-row" style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, gap: 8 }}>
                            {/* Tanggal + status */}
                            <div className="t-row-date" style={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 12, color: '#6b7280' }}>{dateShort}</span>
                              {isLive ? (
                                <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 600 }}>{m.minute ? `${m.minute}'` : 'LIVE'}</span>
                              ) : isFinished ? (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>FT</span>
                              ) : null}
                            </div>
                            {/* Home */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
                              <span className="t-row-name" style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>{m.home_team?.name || 'Home'}</span>
                              <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} alt="" />
                            </div>
                            {/* Skor / jam */}
                            <div className="t-row-score" style={{ width: 64, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                              {hasScore ? (
                                <span style={{ fontSize: 14, fontWeight: 600, color: isLive ? '#16a34a' : '#111827', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...(isLive ? { background: '#dcfce7', padding: '2px 8px', borderRadius: 8 } : {}) }}>
                                  {m.home_score} - {m.away_score}
                                </span>
                              ) : (
                                <span style={{ fontSize: 13, color: '#475569', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{time}</span>
                              )}
                            </div>
                            {/* Away */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, minWidth: 0 }}>
                              <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} alt="" />
                              <span className="t-row-name" style={{ fontSize: 14, color: '#111827' }}>{m.away_team?.name || 'Away'}</span>
                            </div>
                            <div className="t-row-spacer" style={{ width: 56, flexShrink: 0 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })() : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 11 }}>Belum ada pertandingan.</p>
              </div>
            )}
          </div>
        )}

                        {activeTab === 'standings' && (
          <div className="animate-fade-in" style={{ padding: '0 4px' }}>
            <KlasemenTab standings={standings} sport={tournament.sport} />
          </div>
        )}

                        {activeTab === 'teams' && (
                          <div style={{ padding: '8px 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                              {tournament.teams?.length > 0 ? tournament.teams.map(team => (
                                <div 
                                  key={team.id || team.uuid} 
                                  onClick={() => router.push(`/teams/${team.uuid || team.id}`)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                                    background: 'var(--bg-subtle)', borderRadius: 16, border: '1px solid var(--border)',
                                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                                >
                                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                                    <img src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} style={{ width: 32, height: 32, objectFit: 'contain' }} alt={team.name} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{team.city || 'Bojonegoro'}</div>
                                  </div>
                                  <ChevronRight size={16} color="var(--text-muted)" />
                                </div>
                              )) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                  Belum ada tim terdaftar di turnamen ini.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

        {activeTab === 'players' && (
          <div className="animate-fade-in" style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {(() => {
              const playerGroupedStats = getPlayerStatGroups(tournament.sport?.slug, playerStats);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {playerGroupedStats.map((group, gIdx) => {
                    const availableStats = group.stats.filter(config => config.data && config.data.length > 0);
                    if (availableStats.length === 0) return null;

                    return (
                      <div key={gIdx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border-light))' }} />
                          <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {group.title}
                          </h2>
                          <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, var(--border-light))' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                          {availableStats.map(config => (
                            <PlayerStatCard 
                              key={config.key} 
                              title={config.label} 
                              data={config.data} 
                              valueKey={config.valueKey} 
                              isNegative={config.isNegative} 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {playerGroupedStats.every(g => g.stats.every(s => !s.data || s.data.length === 0)) && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Belum ada statistik pemain tersedia</div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'bracket' && (
          <div className="animate-fade-in">
            <TournamentBracket bracketData={bracketData} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in" style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {(() => {
              const groupedStats = getTeamStatGroups(tournament.sport?.slug);

              let hasAnyData = false;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {groupedStats.map((group, gIdx) => {
                    const availableStats = group.stats.filter(config => teamStats?.[config.key]?.length > 0);
                    if (availableStats.length === 0) return null;
                    hasAnyData = true;

                    return (
                      <div key={gIdx}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border-light))' }} />
                          <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {group.title}
                          </h2>
                          <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, var(--border-light))' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                          {availableStats.map(config => (
                            <TeamStatCard 
                              key={config.key} 
                              title={config.label} 
                              data={teamStats[config.key]} 
                              valueKey="value" 
                              isNegative={config.isNegative} 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!hasAnyData && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Belum ada statistik tim tersedia</div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="animate-fade-in" style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Player Stats Highlights - Sport Aware */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
              {getInfoPlayerStatHighlights(tournament.sport?.slug, playerStats).map((config, idx) => (
                <PlayerStatCard 
                  key={idx}
                  title={config.title} 
                  data={config.data} 
                  valueKey={config.valueKey} 
                />
              ))}
            </div>

            {/* Knockout Bracket or Standings Highlight */}
            {(tournament.type === 'group_knockout' || tournament.type === 'knockout' || bracketData.length > 0) ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border-light))' }} />
                  <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Bagan Knockout
                  </h2>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, var(--border-light))' }} />
                </div>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                  <TournamentBracket bracketData={bracketData} />
                </div>
              </div>
            ) : (standings && (Array.isArray(standings) ? standings.length > 0 : (standings?.standings?.length > 0 || standings?.groups?.length > 0 || standings?.phases?.length > 0))) ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border-light))' }} />
                  <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Klasemen Singkat
                  </h2>
                  <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, var(--border-light))' }} />
                </div>
                <KlasemenTab standings={standings} sport={tournament.sport} compact={true} />
              </div>
            ) : null}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--border-light))' }} />
                <h2 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Tentang Turnamen
                </h2>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, var(--border-light))' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
                Turnamen <strong>{tournament.name}</strong> diselenggarakan resmi di Bojonegoro. Turnamen ini merupakan ajang bergengsi yang memfasilitasi persaingan sportif bagi tim-tim di daerah Bojonegoro.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Olahraga</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Trophy size={14} color="currentColor" /> {tournament.sport?.name || 'Multi-Sport'}</span>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    {tournament.status === 'upcoming' ? 'Akan Datang' : tournament.status === 'ongoing' ? 'Sedang Berlangsung' : 'Selesai'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}


function KlasemenTab({ standings, match, sport, compact = false }) {
  const [activePhaseTab, setActivePhaseTab] = useState(0);

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

  const scoringInfo = standings.scoring_info || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {standings.type === 'grouped_phases' ? (
        <div>
          {/* Phase Tabs */}
          {!compact && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {standings.phases?.map((phase, pi) => (
                <button 
                  key={pi} 
                  onClick={() => setActivePhaseTab(pi)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: 999, 
                    fontSize: 13, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    border: activePhaseTab === pi ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: activePhaseTab === pi ? 'var(--primary)' : 'var(--bg-card)',
                    color: activePhaseTab === pi ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {phase.name}
                </button>
              ))}
            </div>
          )}

          {/* Active Phase Content */}
          {standings.phases?.[activePhaseTab] && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {standings.phases[activePhaseTab].groups?.map((g, gi) => (
                <div key={gi}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--primary)' }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{g.group?.name}</span>
                  </div>
                  <StandingsTable rows={g.standings} match={match} sport={sport} scoringInfo={scoringInfo} compact={compact} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : standings.type === 'grouped' ? (
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          {standings.groups.map((g, i) => (
            <div key={i}>
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-light)', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 4, height: 18, borderRadius: 2, background: 'var(--primary)' }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{g.group?.name}</span>
              </div>
              <StandingsTable rows={g.standings} match={match} sport={sport} scoringInfo={scoringInfo} isGrouped={true} compact={compact} />
            </div>
          ))}
        </div>
      ) : (
        <StandingsTable rows={standings.standings} match={match} sport={sport} scoringInfo={scoringInfo} compact={compact} />
      )}
    </div>
  );
}

function StandingsTable({ rows = [], match, sport, scoringInfo, isGrouped, compact = false }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>Belum ada data klasemen.</div>;
  }

  const homeId = match?.home_team?.id;
  const awayId = match?.away_team?.id;

  const resultBg = (r) => r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#9ca3af';

  const posColor = (pos) => {
    return 'transparent';
  };

  const slug = String(sport?.slug || '').toLowerCase();
  const isFootball = slug === 'football' || slug === 'futsal' || slug === '';
  const isVolleyball = slug === 'volleyball';
  const isBadminton = slug === 'badminton';
  // Set-based sports: goals_* = sets won/lost, points_* = total points of every set in the tournament
  const isNetSport = ['sets', 'tennis'].includes(scoringInfo?.score_type) || isVolleyball || isBadminton;

  // Use scoring_info labels from backend if available, fallback to defaults
  const goalsLabel = scoringInfo?.goals_label || {};
  const labelFor = isNetSport ? 'SW' : (goalsLabel.for || 'GF');
  const labelAgainst = isNetSport ? 'SL' : (goalsLabel.against || 'GA');
  const labelDiff = isNetSport ? 'SD' : (goalsLabel.diff || 'GD');

  // Tooltip text based on sport
  const tipFor = isNetSport ? 'Set Menang' : 'Gol Memasukkan';
  const tipAgainst = isNetSport ? 'Set Kalah' : 'Gol Kemasukan';
  const tipDiff = isNetSport ? 'Selisih Set' : 'Selisih Gol';

  // For non-football sports, hide "drawn" column since draws are rare/impossible
  const showDrawn = isFootball && !isNetSport;

  // Column definitions - dynamic per sport
  const allCols = [
    { key: 'played', label: 'M', tip: 'Main' },
    { key: 'won', label: 'M', tip: 'Menang' },
    ...(showDrawn ? [{ key: 'drawn', label: 'S', tip: 'Seri' }] : []),
    { key: 'lost', label: 'K', tip: 'Kalah' },
    { key: 'plus_minus', label: `${labelFor}/${labelAgainst}`, tip: `${tipFor} - ${tipAgainst}` },
    { key: 'goal_difference', label: labelDiff, tip: tipDiff },
    ...(isNetSport ? [
      { key: 'points_akumulasi', label: 'PW-PL', tip: 'Total poin dari seluruh set selama turnamen (Menang - Kalah)' },
      { key: 'points_difference', label: 'PD', tip: 'Selisih total poin' },
    ] : []),
    { key: 'points', label: 'PTS', tip: 'Poin' },
  ];

  const cols = compact 
    ? allCols.filter(c => ['played', 'plus_minus', 'points_akumulasi', 'points'].includes(c.key))
    : allCols;

  return (
    <div style={{
      overflowX: 'auto',
    }} className="hide-scrollbar">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        background: '#fff', borderBottom: '1px solid var(--border-light)',
        fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
        minWidth: 580,
      }}>
        <div style={{ width: 28, textAlign: 'center' }}>#</div>
        <div style={{ flex: 1, paddingLeft: 8, minWidth: 80 }}>Tim</div>
        {cols.map(c => (
          <div key={c.key} title={c.tip} style={{ width: c.key === 'points' ? 34 : c.key === 'points_akumulasi' ? 64 : c.key === 'plus_minus' ? 50 : c.key === 'points_difference' ? 36 : 28, textAlign: 'center', flexShrink: 0 }}>{c.label}</div>
        ))}
        {!compact && <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>Form</div>}
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
                    ? 'linear-gradient(90deg, rgba(0, 0, 0,0.1), transparent)'
                    : isAway
                      ? 'linear-gradient(90deg, rgba(234,179,8,0.1), transparent)'
                      : 'transparent',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border-light)',
                  transition: 'background 0.2s ease',
                }}>
                <div style={{ width: 3, position: 'absolute', left: 0, top: 8, bottom: 8, borderRadius: '0 4px 4px 0', background: pc }} />
                
                {/* Position Badge */}
                <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {pos}
                </div>

                {/* Team */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, minWidth: 80, overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(r.team?.logo_path) || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.team?.name || '?')}&size=20&background=random`}
                    style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, objectFit: 'contain' }} alt=""
                  />
                  <span style={{
                    fontSize: 9, fontWeight: isHighlighted ? 700 : 500,
                    color: isHighlighted ? 'var(--text-primary)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {r.team?.name}
                  </span>
                </div>

                {/* Stats */}
                {cols.map(c => {
                  let val;
                  if (c.key === 'plus_minus') {
                    val = `${r.goals_for || 0}-${r.goals_against || 0}`;
                  } else if (c.key === 'points_akumulasi') {
                    val = `${r.points_for || 0}-${r.points_against || 0}`;
                  } else if (c.key === 'points_difference') {
                    val = r.points_difference ?? ((r.points_for || 0) - (r.points_against || 0));
                  } else {
                    val = r[c.key];
                  }
                  
                  const isPts = c.key === 'points';
                  const isGD = c.key === 'goal_difference' || c.key === 'points_difference';
                  const gdColor = isGD ? (val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : 'var(--text-secondary)') : null;
                  return (
                    <div key={c.key} style={{
                      width: isPts ? 34 : c.key === 'points_akumulasi' ? 64 : c.key === 'plus_minus' ? 50 : c.key === 'points_difference' ? 36 : 28, textAlign: 'center', flexShrink: 0,
                      fontSize: isPts ? 13 : 11,
                      fontWeight: isPts ? 900 : 600,
                      color: isPts ? 'var(--text-primary)' : gdColor || 'var(--text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap'
                    }}>
                      {isGD && val > 0 ? `+${val}` : val}
                    </div>
                  );
                })}

                {/* Form */}
                {!compact && (
                  <div style={{ width: 90, display: 'flex', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                    {form.length > 0 ? form.slice(-5).map((f, fi) => (
                      <div key={fi} style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: resultBg(f),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#fff',
                      }}>
                        {f}
                      </div>
                    )) : (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>-</span>
                    )}
                  </div>
                )}
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
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <p style={{ fontSize: 10, color: '#8b92a5', fontWeight: 600 }}>Statistik pertandingan belum tersedia.</p>
      </div>
    );
  }

  const prefix = period === 'all' ? '' : period === 'h1' ? 'h1_' : 'h2_';
  const s = (key) => stats[`${prefix}${key}`];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          {hWin ? (
            <div style={{ background: '#1e3a8a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 14, minWidth: 32, textAlign: 'center' }}>
              {hStr}
            </div>
          ) : (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', padding: '4px 12px', minWidth: 32, textAlign: 'center' }}>
              {hStr}
            </div>
          )}
        </div>
        <div style={{ flex: 2, textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {aWin ? (
            <div style={{ background: '#d97706', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 14, minWidth: 32, textAlign: 'center' }}>
              {aStr}
            </div>
          ) : (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', padding: '4px 12px', minWidth: 32, textAlign: 'center' }}>
              {aStr}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sportSlug = String(match.tournament?.sport?.slug || '').toLowerCase();
  const isVolleyball = sportSlug === 'volleyball';
  const isBadminton = sportSlug === 'badminton';

  if (isVolleyball) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <StatRow label="Service" homeVal={s('service_home')} awayVal={s('service_away')} />
        <StatRow label="Block" homeVal={s('block_home')} awayVal={s('block_away')} />
        <StatRow label="Smash / Kills" homeVal={s('smash_home')} awayVal={s('smash_away')} />
        <StatRow label="Digs / Penyelamatan" homeVal={s('dig_home')} awayVal={s('dig_away')} />
        <StatRow label="Errors" homeVal={s('error_home')} awayVal={s('error_away')} lowerIsBetter />
      </div>
    );
  }

  if (isBadminton) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <StatRow label="Service Aces" homeVal={s('aces_home')} awayVal={s('aces_away')} />
        <StatRow label="Smashes" homeVal={s('smashes_home')} awayVal={s('smashes_away')} />
        <StatRow label="Net Play Wins" homeVal={s('net_wins_home')} awayVal={s('net_wins_away')} />
        <StatRow label="Unforced Errors" homeVal={s('errors_home')} awayVal={s('errors_away')} lowerIsBetter />
      </div>
    );
  }

  const possHome = parseInt(s('possession_home')) || 50;
  const possAway = parseInt(s('possession_away')) || 50;

  const periods = [
    { id: 'all', label: 'Semua' },
    { id: 'h1', label: 'Babak 1' },
    { id: 'h2', label: 'Babak 2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              background: period === p.id ? 'var(--primary)' : 'transparent',
              color: period === p.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Penguasaan Bola ── */}
      <div style={{ padding: '16px 0', marginTop: 8 }}>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 16 }}>
          Persentase Penguasaan Bola
        </div>

        <div style={{ display: 'flex', height: 36, borderRadius: 18, overflow: 'hidden' }}>
          {/* Home Bar */}
          <div style={{ flex: possHome, background: '#1e3a8a', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{possHome}%</span>
          </div>
          {/* Away Bar */}
          <div style={{ flex: possAway, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{possAway}%</span>
          </div>
        </div>
      </div>

      {/* ── Tembakan ── */}
      <div style={{ marginTop: 16 }}>
        <StatRow label="Total Tembakan" homeVal={s('shots_home')} awayVal={s('shots_away')} />
        <StatRow label="Tembakan Tepat Sasaran" homeVal={s('shots_on_target_home')} awayVal={s('shots_on_target_away')} />
      </div>

      {/* ── Umum ── */}
      <div style={{ marginTop: 16 }}>
        <StatRow label="Tendangan Sudut" homeVal={s('corners_home')} awayVal={s('corners_away')} />
        <StatRow label="Pelanggaran" homeVal={s('fouls_home')} awayVal={s('fouls_away')} lowerIsBetter />
        <StatRow label="Offside" homeVal={s('offsides_home')} awayVal={s('offsides_away')} lowerIsBetter />
        <StatRow label="Kartu Kuning" homeVal={s('yellow_cards_home')} awayVal={s('yellow_cards_away')} lowerIsBetter />
        <StatRow label="Kartu Merah" homeVal={s('red_cards_home')} awayVal={s('red_cards_away')} lowerIsBetter />
      </div>
    </div>
  );
}

