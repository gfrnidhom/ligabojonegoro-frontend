"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, MapPin, Calendar, Users, Award, Shield, ChevronRight, Star, LayoutGrid, List, BarChart2, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

const avatar = (name, bg = '3b82f6') => {
  if (!name) return `https://ui-avatars.com/api/?name=L&background=${bg}&color=fff&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
};

export default function TournamentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const tournamentId = unwrappedParams.id;
  const router = useRouter();

  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches, standings, info, players, stats
  const [matchView, setMatchView] = useState('upcoming'); // upcoming, finished
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [playerStats, setPlayerStats] = useState({ top_scorers: [], top_cards: [], top_clean_sheets: [] });
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
        const mRes = await api.get('/matches', { params: { per_page: 100 } });
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
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat detail turnamen...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <Shield size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Turnamen Tidak Ditemukan</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, marginBottom: 18 }}>Maaf, turnamen yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Group matches by month if needed, or simply filter
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const finishedMatches = matches.filter(m => ['finished', 'live', 'ongoing'].includes(m.status));
  const filteredMatches = matchView === 'upcoming' ? upcomingMatches : finishedMatches;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000, margin: '16px auto', padding: '0 16px 64px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '0 4px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(245,158,11,0.08)', border: 'none',
            borderRadius: 12, width: 42, height: 42, cursor: 'pointer', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Detail Turnamen</span>
      </div>

      {/* Main Bronze/Gold Styled Banner Header */}
      <div 
        className="tournament-banner-card"
        style={{
          background: 'linear-gradient(145deg, rgba(245,158,11,0.06) 0%, rgba(22,27,34,0.95) 35%, rgba(13,17,23,0.98) 100%)',
          backdropFilter: 'blur(30px)',
          border: 'none',
          borderRadius: 32,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(245,158,11,0.06)'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
           @media (max-width: 640px) {
              .page-container {
               margin: 0 !important;
               padding: 0 12px 60px !important;
               max-width: 100% !important;
               width: 100% !important;
             }
             .tournament-banner-card {
               border-radius: 16px !important;
               padding: 16px !important;
               margin-bottom: 12px !important;
             }
             .tournament-header-card {
               padding: 16px 18px !important;
             }
              .tournament-logo-text-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 16px !important;
              }
              .tab-contents-block {
                border-radius: 16px !important;
                padding: 16px !important;
              }
            }
         `}} />
        <div className="tournament-header-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, position: 'relative', zIndex: 1 }}>
          <div className="tournament-logo-text-row" style={{ display: 'flex', alignItems: 'center', gap: 32, flex: 1 }}>
            {/* Big Premium Tournament Logo */}
            <div 
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <img 
                src={getImageUrl(tournament.logo_path || tournament.logo) || avatar(tournament.name, '3b82f6')} 
                style={{ width: 44, height: 44, objectFit: 'contain' }}
                alt={tournament.name}
              />
            </div>

            {/* Title & Meta Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '3px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, marginBottom: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Star size={10} fill="#fbbf24" />
                {tournament.sport?.name || 'Turnamen Utama'}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', lineHeight: 1.1, marginBottom: 8, letterSpacing: '-0.02em' }}>
                {tournament.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  <MapPin size={14} color="#ef4444" />
                  <span>{tournament.location || 'Bojonegoro'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  <Users size={14} color="#10b981" />
                  <span>{tournament.teams?.length || 0} Tim</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 12px -3px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Ikuti
            </button>
            <button 
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#f8fafc',
                transition: 'all 0.2s'
              }}
            >
              <Star size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selection Row (Glassmorphic Pills) */}
        <div 
          className="hide-scrollbar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            overflowX: 'auto', 
            paddingBottom: 4,
            msOverflowStyle: 'none', 
            scrollbarWidth: 'none',
            position: 'relative',
            zIndex: 1
          }}
        >
          {[
            { id: 'info', label: 'Ringkasan', icon: Shield },
            { id: 'matches', label: 'Pertandingan', icon: Calendar },
            { id: 'standings', label: 'Klasemen', icon: Trophy, show: Array.isArray(standings) ? standings.length > 0 : (standings?.standings?.length > 0 || standings?.groups?.length > 0) },
            { id: 'players', label: 'Pemain Terbaik', icon: Award },
            { id: 'stats', label: 'Statistik', icon: BarChart2 }
          ].filter(t => t.show !== false).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  borderRadius: 16,
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#fbbf24' : '#94a3b8',
                  border: `1px solid ${isActive ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  backdropFilter: 'blur(12px)',
                  boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div 
        className="tab-contents-block"
        style={{
          background: 'linear-gradient(145deg, rgba(245,158,11,0.04) 0%, rgba(22,27,34,0.92) 35%, rgba(13,17,23,0.96) 100%)',
          backdropFilter: 'blur(20px)',
          border: 'none',
          borderRadius: 24,
          padding: 20,
          minHeight: 400,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(245,158,11,0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {activeTab === 'matches' && (
          <div>
            {/* Matches view filter (Upcoming vs Results) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={() => setMatchView('upcoming')}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 16, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: matchView === 'upcoming' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    color: matchView === 'upcoming' ? '#f59e0b' : '#64748b'
                  }}
                >
                  Mendatang
                </button>
                <button
                  onClick={() => setMatchView('finished')}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 16, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: matchView === 'finished' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                    color: matchView === 'finished' ? '#f59e0b' : '#64748b'
                  }}
                >
                  Hasil
                </button>
              </div>

              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.03)', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {viewMode === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
              </button>
            </div>

            {/* Time period header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
              <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.04)', width: '100%' }} />
              <div style={{ position: 'absolute', padding: '0 16px', background: 'rgb(24, 24, 27)', color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mei 2026
              </div>
            </div>

            {/* Individual match rows */}
            {filteredMatches.length > 0 ? (
              <div style={
                viewMode === 'grid' 
                ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }
                : { display: 'flex', flexDirection: 'column', gap: 10 }
              }>
                {filteredMatches.map(m => {
                  const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                  const isFinished = m.status === 'finished';
                  const hasScore = isLive || isFinished;
                  const time = m.scheduled_at
                    ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : 'TBA';
                  const dateShort = m.scheduled_at
                    ? new Date(m.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                    : '-';

                  if (viewMode === 'grid') {
                    return (
                        <div
                          key={m.id}
                          onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: 20,
                            padding: '20px 16px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                          }}
                          className="hover-card-grid"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, width: '100%' }}>
                            {isLive ? (
                              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em', animation: 'pulseGlow 2s infinite' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
                                LIVE
                              </div>
                            ) : isFinished ? (
                              <div style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                SELESAI
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.15)', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                {time}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} alt="" />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', textAlign: 'center', lineHeight: 1.3 }}>{m.home_team?.name}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ 
                                background: 'rgba(15, 23, 42, 0.6)', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: 16, 
                                padding: '8px 16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                              }}>
                                {hasScore ? (
                                  <>
                                    <span style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{m.home_score}</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>-</span>
                                    <span style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{m.away_score}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 14, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>VS</span>
                                )}
                              </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} alt="" />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', textAlign: 'center', lineHeight: 1.3 }}>{m.away_team?.name}</span>
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
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.02)',
                        borderRadius: 12,
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        gap: 10
                      }}
                      className="hover-card"
                    >
                      {/* Left Side: Date / Time Column */}
                      <div style={{ width: 64, flexShrink: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        {dateShort}
                      </div>

                      {/* Center Teams Horizontal Display */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textAlign: 'right' }}>{m.home_team?.name}</span>
                          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
                        </div>

                        {/* Mid score / schedule time button */}
                        <div 
                          style={{ 
                            padding: '4px 10px', borderRadius: 10, background: 'rgba(0, 0, 0, 0.45)', 
                            border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: 11, fontWeight: 800, minWidth: 54, textAlign: 'center',
                            color: hasScore ? '#f59e0b' : '#94a3b8'
                          }}
                        >
                          {hasScore ? `${m.home_score} : ${m.away_score}` : time}
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
                          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{m.away_team?.name}</span>
                        </div>
                      </div>

                      {/* Far right: Favorite star */}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <Star size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Belum ada pertandingan.</p>
              </div>
            )}
          </div>
        )}

                        {activeTab === 'standings' && (
          <div className="animate-fade-in" style={{ padding: '0 4px' }}>
            <KlasemenTab standings={standings} />
          </div>
        )}

                        {activeTab === 'players' && (
          <div className="animate-fade-in" style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Scorers Card */}
            <div style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.92)', borderRadius: 24, border: 'none', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: '#f59e0b', filter: 'blur(80px)', opacity: 0.2 }} />
              
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>Pencetak Gol Terbanyak</h3>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '0 24px 24px', position: 'relative' }}>
                {playerStats.top_scorers?.length > 0 ? (() => {
                  const top3 = playerStats.top_scorers.slice(0, 3);
                  const rest = playerStats.top_scorers.slice(3);
                  return (
                    <>
                      {/* Premium Podium Layout */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, padding: '40px 0 0', borderBottom: '1px solid rgba(255,255,255,0.05)', perspective: '1000px' }}>
                        {/* 2nd Place */}
                        {top3[1] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 2 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img src={getImageUrl(top3[1].player?.photo_path) || avatar(top3[1].player?.name)} style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #cbd5e1', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#cbd5e1', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, border: '2px solid #0f172a' }}>2</div>
                            </div>
                            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[1].player?.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{top3[1].player?.team || '-'}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#cbd5e1', textShadow: '0 0 10px rgba(203, 213, 225, 0.3)' }}>{top3[1].goals}</div>
                            <div style={{ width: '100%', height: 40, background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.1), transparent)', borderTopLeftRadius: 10, borderTopRightRadius: 10, marginTop: 10, borderTop: '1.5px solid rgba(203, 213, 225, 0.2)' }} />
                          </motion.div>
                        )}
                        {/* 1st Place */}
                        {top3[0] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -8 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', zIndex: 3 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 24, filter: 'drop-shadow(0 4px 8px rgba(234, 179, 8, 0.4))', zIndex: 10 }}>👑</div>
                              <img src={getImageUrl(top3[0].player?.photo_path) || avatar(top3[0].player?.name)} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid #eab308', objectFit: 'cover', boxShadow: '0 12px 24px rgba(234, 179, 8, 0.25)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: '#eab308', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, border: '3px solid #0f172a' }}>1</div>
                            </div>
                            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 900, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[0].player?.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>{top3[0].player?.team || '-'}</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#eab308', textShadow: '0 0 20px rgba(234, 179, 8, 0.4)' }}>{top3[0].goals}</div>
                            <div style={{ width: '100%', height: 60, background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.15), transparent)', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 12, borderTop: '2.5px solid rgba(234, 179, 8, 0.3)' }} />
                          </motion.div>
                        )}
                        {/* 3rd Place */}
                        {top3[2] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 1 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img src={getImageUrl(top3[2].player?.photo_path) || avatar(top3[2].player?.name)} style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #b45309', objectFit: 'cover', boxShadow: '0 6px 12px rgba(0,0,0,0.3)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#b45309', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, border: '2px solid #0f172a' }}>3</div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[2].player?.name}</div>
                            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{top3[2].player?.team || '-'}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#b45309', textShadow: '0 0 10px rgba(180, 83, 9, 0.3)' }}>{top3[2].goals}</div>
                            <div style={{ width: '100%', height: 30, background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.1), transparent)', borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, borderTop: '1px solid rgba(180, 83, 9, 0.2)' }} />
                          </motion.div>
                        )}
                      </div>

                      {/* Remaining List */}
                      {rest.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          {rest.map((item, idx) => {
                            const realRank = idx + 4;
                            const maxGoals = top3[0].goals || 1;
                            const pct = (item.goals / maxGoals) * 100;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: idx < rest.length - 1 ? '1px dashed rgba(255,255,255,0.03)' : 'none' }}>
                                <div style={{ width: 28, fontSize: 13, fontWeight: 800, color: '#64748b', textAlign: 'center' }}>{realRank}</div>
                                <div style={{ margin: '0 16px 0 8px' }}>
                                  <img src={getImageUrl(item.player?.photo_path) || avatar(item.player?.name)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.name}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.team || '-'}</div>
                                </div>
                                <div style={{ width: '25%', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                  <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b' }}>{item.goals}</div>
                                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 4 }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })() : <div style={{ fontSize: 13, color: '#64748b', padding: '24px 0', textAlign: 'center' }}>Belum ada data gol.</div>}
              </div>
            </div>

            {/* Top Clean Sheets Card */}
            <div style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.92)', borderRadius: 24, border: 'none', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: '#10b981', filter: 'blur(80px)', opacity: 0.15 }} />
              
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>Tanpa Kebobolan</h3>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Statistik Kiper Terbaik</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 24px 24px', position: 'relative' }}>
                {playerStats.top_clean_sheets?.length > 0 ? (() => {
                  const top3 = playerStats.top_clean_sheets.slice(0, 3);
                  const rest = playerStats.top_clean_sheets.slice(3);
                  return (
                    <>
                      {/* Premium Podium Layout */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, padding: '40px 0 0', borderBottom: '1px solid rgba(255,255,255,0.05)', perspective: '1000px' }}>
                        {/* 2nd Place */}
                        {top3[1] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 2 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img src={getImageUrl(top3[1].player?.photo_path) || avatar(top3[1].player?.name)} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid #cbd5e1', objectFit: 'cover', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, borderRadius: '50%', background: '#cbd5e1', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, border: '3px solid #0f172a' }}>2</div>
                            </div>
                            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[1].player?.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{top3[1].player?.team || '-'}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#cbd5e1', textShadow: '0 0 10px rgba(203, 213, 225, 0.3)' }}>{top3[1].clean_sheets}</div>
                            <div style={{ width: '100%', height: 60, background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.1), transparent)', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 12, borderTop: '2px solid rgba(203, 213, 225, 0.2)' }} />
                          </motion.div>
                        )}
                        {/* 1st Place */}
                        {top3[0] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -8 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '35%', zIndex: 3 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 32, filter: 'drop-shadow(0 4px 8px rgba(234, 179, 8, 0.4))', zIndex: 10 }}>👑</div>
                              <img src={getImageUrl(top3[0].player?.photo_path) || avatar(top3[0].player?.name)} style={{ width: 96, height: 96, borderRadius: '50%', border: '5px solid #eab308', objectFit: 'cover', boxShadow: '0 15px 30px rgba(234, 179, 8, 0.25)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 36, height: 36, borderRadius: '50%', background: '#eab308', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, border: '4px solid #0f172a' }}>1</div>
                            </div>
                            <div style={{ marginTop: 20, fontSize: 15, fontWeight: 900, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[0].player?.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>{top3[0].player?.team || '-'}</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: '#eab308', textShadow: '0 0 20px rgba(234, 179, 8, 0.4)' }}>{top3[0].clean_sheets}</div>
                            <div style={{ width: '100%', height: 90, background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.15), transparent)', borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 12, borderTop: '3px solid rgba(234, 179, 8, 0.3)' }} />
                          </motion.div>
                        )}
                        {/* 3rd Place */}
                        {top3[2] && (
                          <motion.div 
                            whileHover={{ scale: 1.05, translateY: -5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 1 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <img src={getImageUrl(top3[2].player?.photo_path) || avatar(top3[2].player?.name)} style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #b45309', objectFit: 'cover', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }} alt="" />
                              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, borderRadius: '50%', background: '#b45309', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, border: '3px solid #0f172a' }}>3</div>
                            </div>
                            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 800, color: '#f8fafc', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[2].player?.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{top3[2].player?.team || '-'}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#b45309', textShadow: '0 0 10px rgba(180, 83, 9, 0.3)' }}>{top3[2].clean_sheets}</div>
                            <div style={{ width: '100%', height: 40, background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.1), transparent)', borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 12, borderTop: '2px solid rgba(180, 83, 9, 0.2)' }} />
                          </motion.div>
                        )}
                      </div>

                      {/* Remaining List */}
                      {rest.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          {rest.map((item, idx) => {
                            const realRank = idx + 4;
                            const maxCS = top3[0].clean_sheets || 1;
                            const pct = (item.clean_sheets / maxCS) * 100;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: idx < rest.length - 1 ? '1px dashed rgba(255,255,255,0.03)' : 'none' }}>
                                <div style={{ width: 28, fontSize: 13, fontWeight: 800, color: '#64748b', textAlign: 'center' }}>{realRank}</div>
                                <div style={{ margin: '0 16px 0 8px' }}>
                                  <img src={getImageUrl(item.player?.photo_path) || avatar(item.player?.name)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.name}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.player?.team || '-'}</div>
                                </div>
                                <div style={{ width: '25%', minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{item.clean_sheets}</div>
                                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4 }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })() : <div style={{ fontSize: 13, color: '#64748b', padding: '24px 0', textAlign: 'center' }}>Belum ada data kiper.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in" style={{ padding: '0 4px' }}>
            {(() => {
              const finished = matches.filter(m => m.status === 'finished');
              const totalMatches = finished.length;
              let totalGoals = 0;
              let maxDiff = -1;
              let biggestWin = null;
              
              finished.forEach(m => {
                const hs = m.home_score || 0;
                const as = m.away_score || 0;
                totalGoals += (hs + as);
                
                const diff = Math.abs(hs - as);
                if (diff > maxDiff) {
                  maxDiff = diff;
                  biggestWin = m;
                }
              });
              
              const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {/* Modern Statistics Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                    
                    <div style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.02)', padding: '24px 16px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: 12, border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                        <Calendar size={20} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{totalMatches}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Laga Selesai</div>
                    </div>

                    <div style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.02)', padding: '24px 16px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: 12, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <Award size={20} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{totalGoals}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Gol</div>
                    </div>

                    <div style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.02)', padding: '24px 16px', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: 12, border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                        <BarChart2 size={20} strokeWidth={2.5} />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{avgGoals}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rata-rata Gol</div>
                    </div>
                  </div>

                  {/* Highlighted Biggest Win Segment */}
                  {biggestWin && (
                    <div style={{ position: 'relative', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 32, border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -150, right: -150, width: 400, height: 400, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                      
                      <div style={{ padding: '24px 32px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Trophy size={20} color="#eab308" />
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Kemenangan Terbesar</h3>
                      </div>
                      
                      <div style={{ padding: '56px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, position: 'relative', zIndex: 1 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <img src={getImageUrl(biggestWin.home_team?.logo_path) || avatar(biggestWin.home_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                          </div>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>{biggestWin.home_team?.name}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                          <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '24px 48px', borderRadius: 24, fontSize: 56, fontWeight: 900, color: '#fbbf24', letterSpacing: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.4)', textShadow: '0 0 20px rgba(96, 165, 250, 0.4)' }}>
                            {biggestWin.home_score}-{biggestWin.away_score}
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skor Akhir</div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <img src={getImageUrl(biggestWin.away_team?.logo_path) || avatar(biggestWin.away_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                          </div>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#f1f5f9' }}>{biggestWin.away_team?.name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Best Team Stats Section */}
                  <TeamBestStats data={teamStats} />
                </div>
              );
            })()}
          </div>
        )}

{activeTab === 'info' && (
          <div className="animate-fade-in" style={{ padding: '0 4px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tentang Turnamen</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Turnamen <strong>{tournament.name}</strong> diselenggarakan resmi di Bojonegoro. Turnamen ini merupakan ajang bergengsi yang memfasilitasi persaingan sportif bagi tim-tim di daerah Bojonegoro.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Olahraga</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}><Trophy size={14} color="#f59e0b" /> {tournament.sport?.name || 'Multi-Sport'}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>
                  {tournament.status === 'upcoming' ? 'Akan Datang' : tournament.status === 'ongoing' ? 'Sedang Berlangsung' : 'Selesai'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


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
                <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f59e0b' }} />
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
    if (pos === 2) return { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b66', color: '#fbbf24' };
    if (pos <= 4) return { bg: 'rgba(34,197,94,0.1)', border: '#22c55e44', color: '#22c55e' };
    return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#8b92a5' };
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
      background: 'rgba(255,255,255,0.02)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto',
    }} className="hide-scrollbar">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
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
                    ? 'linear-gradient(90deg, rgba(245,158,11,0.1), transparent)'
                    : isAway
                      ? 'linear-gradient(90deg, rgba(234,179,8,0.1), transparent)'
                      : 'transparent',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
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
                    style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, objectFit: 'contain' }} alt=""
                  />
                  <span style={{
                    fontSize: 11, fontWeight: isHighlighted ? 700 : 500,
                    color: isHighlighted ? '#f1f5f9' : '#e8eaed',
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
                  const gdColor = isGD ? (val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : '#8b92a5') : null;
                  return (
                    <div key={c.key} style={{
                      width: isPts ? 34 : 28, textAlign: 'center', flexShrink: 0,
                      fontSize: isPts ? 13 : 11,
                      fontWeight: isPts ? 900 : 600,
                      color: isPts ? '#f1f5f9' : gdColor || '#8b92a5',
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
  if (!stats || stats.possession_home === undefined) {
    return (
      <div className="empty-state" style={{ padding: '36px 16px' }}>
        <p style={{ fontSize: 12, color: '#8b92a5', fontWeight: 600 }}>Statistik pertandingan belum tersedia.</p>
      </div>
    );
  }

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
      <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Badge value={h} color={hWin ? '#f59e0b' : '#475569'} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e8eaed', textAlign: 'center' }}>{label}</span>
          <Badge value={a} color={aWin ? '#eab308' : '#475569'} />
        </div>
        <div style={{ display: 'flex', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', gap: 3, margin: '0 4px' }}>
          <div style={{ width: `${homePct}%`, background: '#f59e0b', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          <div style={{ width: `${awayPct}%`, background: '#eab308', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      </div>
    );
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              background: period === p.id ? '#f59e0b' : 'transparent',
              color: period === p.id ? '#fff' : '#8b92a5',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Penguasaan Bola ── */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Penguasaan Bola</div>
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden', height: 28, background: 'rgba(255,255,255,0.06)' }}>
          <img src={getImageUrl(match.home_team?.logo_path) || avatar(match.home_team?.name, '3b82f6')} style={{ width: 22, height: 22, borderRadius: '50%', marginLeft: 3, flexShrink: 0, zIndex: 2 }} alt="" />
          <div style={{ flex: possHome, background: '#f59e0b', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, transition: 'flex 1s ease' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{possHome}%</span>
          </div>
          <div style={{ flex: possAway, background: '#eab308', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 8, transition: 'flex 1s ease' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{possAway}%</span>
          </div>
          <img src={getImageUrl(match.away_team?.logo_path) || avatar(match.away_team?.name, 'eab308')} style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 3, flexShrink: 0, zIndex: 2 }} alt="" />
        </div>
      </div>

      {/* ── Tembakan ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#e8eaed', marginBottom: 6 }}>Tembakan</div>
        <StatRow label="Total Tembakan" homeVal={s('shots_home')} awayVal={s('shots_away')} />
        <StatRow label="Tembakan Tepat Sasaran" homeVal={s('shots_on_target_home')} awayVal={s('shots_on_target_away')} />
      </div>

      {/* ── Umum ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <StatRow label="Tendangan Sudut" homeVal={s('corners_home')} awayVal={s('corners_away')} />
        <StatRow label="Pelanggaran" homeVal={s('fouls_home')} awayVal={s('fouls_away')} />
        <StatRow label="Offside" homeVal={s('offsides_home')} awayVal={s('offsides_away')} />
        <StatRow label="Kartu Kuning" homeVal={s('yellow_cards_home')} awayVal={s('yellow_cards_away')} />
        <StatRow label="Kartu Merah" homeVal={s('red_cards_home')} awayVal={s('red_cards_away')} />
      </div>
    </div>
  );
}


function TeamBestStats({ data }) {
  if (!data) return null;
  const categories = [
    {
      title: 'Serangan',
      icon: <BarChart2 size={20} />,
      color: '#ef4444',
      subStats: [
        { key: 'goals', name: 'Gol' },
        { key: 'shots', name: 'Tembakan' },
        { key: 'shots_on_target', name: 'Tembakan Tepat Sasaran' },
      ].filter(s => data[s.key]?.length > 0)
    },
    {
      title: 'Distribusi',
      icon: <Users size={20} />,
      color: '#f59e0b',
      subStats: [
        { key: 'corners', name: 'Tendangan Sudut' },
      ].filter(s => data[s.key]?.length > 0)
    },
    {
      title: 'Bertahan',
      icon: <Shield size={20} />,
      color: '#10b981',
      subStats: [
        { key: 'conceded', name: 'Gol Kebobolan' },
      ].filter(s => data[s.key]?.length > 0)
    },
    {
      title: 'Pelanggaran',
      icon: <Award size={20} />,
      color: '#f59e0b',
      subStats: [
        { key: 'yellow_cards', name: 'Kartu Kuning' },
        { key: 'red_cards', name: 'Kartu Merah' },
      ].filter(s => data[s.key]?.length > 0)
    },
    {
      title: 'Lainnya',
      icon: <Star size={20} />,
      color: '#8b5cf6',
      subStats: [
        { key: 'matches_played', name: 'Pertandingan' },
      ].filter(s => data[s.key]?.length > 0)
    }
  ].filter(c => c.subStats.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 0 }}>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06))' }} />
        <h2 style={{ fontSize: 13, fontWeight: 900, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="#f59e0b" />
          Tim Terbaik
        </h2>
        <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.06))' }} />
      </div>

      {categories.map((cat, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, border: `1px solid ${cat.color}20` }}>
              {React.cloneElement(cat.icon, { size: 14 })}
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {cat.subStats.map((sub, sIdx) => (
              <div key={sIdx} style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {sub.name}
                </div>
                <div style={{ padding: '4px 0' }}>
                  {data[sub.key]?.map((item, tIdx) => (
                    <motion.div 
                      key={tIdx} 
                      whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: tIdx < data[sub.key].length - 1 ? '1px solid rgba(255,255,255,0.01)' : 'none' }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', fontSize: 10, fontWeight: 900, color: tIdx === 0 ? '#eab308' : tIdx === 1 ? '#94a3b8' : tIdx === 2 ? '#b45309' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {tIdx + 1}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img src={getImageUrl(item.team?.logo_path) || avatar(item.team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.team?.name}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: tIdx === 0 ? cat.color : '#f8fafc', opacity: tIdx === 0 ? 1 : 0.8 }}>
                        {item.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
