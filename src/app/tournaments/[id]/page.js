"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, MapPin, Calendar, Users, Award, Shield, ChevronRight, Star } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

export default function TournamentDetailPage({ params }) {
  const unwrappedParams = use(params);
  const tournamentId = unwrappedParams.id;
  const router = useRouter();

  const [tournament, setTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches, standings, info
  const [matchView, setMatchView] = useState('upcoming'); // upcoming, finished



  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=L&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch tournament details
        const tRes = await api.get('/tournaments');
        if (tRes.data.success) {
          const matched = tRes.data.data.find(t => String(t.id) === String(tournamentId));
          if (matched) {
            setTournament(matched);
          }
        }

        // Fetch matches for this tournament
        const mRes = await api.get('/matches', { params: { per_page: 100 } });
        if (mRes.data.success) {
          const tMatches = mRes.data.data.filter(m => String(m.tournament_id) === String(tournamentId));
          setMatches(tMatches);
        }

        // Fetch standings for this tournament
        try {
          const sRes = await api.get(`/standings/${tournamentId}`);
          if (sRes.data.success) {
            setStandings(sRes.data.data);
          }
        } catch (err) {
          console.log('No standings endpoint for this tournament or returned 404/500');
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

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        <Link href="/tournaments" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>{tournament.sport?.name || 'Olahraga'}</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>{tournament.name}</span>
      </div>

      {/* Main Bronze/Gold Styled Banner Header */}
      <div 
        className="tournament-banner-card"
        style={{
          background: 'linear-gradient(135deg, rgba(54, 43, 31, 0.95) 0%, rgba(26, 21, 16, 0.95) 100%)',
          border: '1px solid rgba(133, 98, 62, 0.25)',
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
        <style dangerouslySetInnerHTML={{__html: `
           @media (max-width: 640px) {
              .mobile-back-navbar {
                display: flex !important;
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
             .tournament-banner-card {
               border-radius: 0 !important;
               border-left: 0 !important;
               border-right: 0 !important;
               border-top: 0 !important;
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
                border-radius: 0 !important;
                border-left: 0 !important;
                border-right: 0 !important;
                padding: 16px !important;
              }
            }
         `}} />
        <div className="tournament-header-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="tournament-logo-text-row" style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 200 }}>
            {/* Left big tournament logo */}
            <div 
              style={{
                width: 76,
                height: 76,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <img 
                src={getImageUrl(tournament.logo_path || tournament.logo) || avatar(tournament.name, '3b82f6')} 
                style={{ width: 52, height: 52, objectFit: 'contain' }}
                alt={tournament.name}
              />
            </div>

            {/* Middle Title / Description Info */}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1, marginBottom: 4 }}>
                {tournament.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                  {tournament.location || 'Indonesia'}
                </span>
                <span 
                  style={{
                    fontSize: 12, color: '#cca26b', background: 'rgba(204, 162, 107, 0.1)',
                    border: '1px solid rgba(204, 162, 107, 0.2)', padding: '2px 8px', borderRadius: 12, fontWeight: 700
                  }}
                >
                  25-26
                </span>
              </div>
            </div>
          </div>

          {/* Right action button (Star) */}
          <button 
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Star size={18} />
          </button>
        </div>

        {/* Tab Selection Row (Flex list like Pills) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              background: activeTab === 'info' ? 'rgba(204, 162, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'info' ? '#cca26b' : '#94a3b8',
              borderColor: activeTab === 'info' ? '#cca26b' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            Gambaran Umum
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              background: activeTab === 'matches' ? 'rgba(204, 162, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'matches' ? '#cca26b' : '#94a3b8',
              borderColor: activeTab === 'matches' ? '#cca26b' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            Daftar Pertandingan
          </button>

          {standings.length > 0 && (
            <button
              onClick={() => setActiveTab('standings')}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                background: activeTab === 'standings' ? 'rgba(204, 162, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === 'standings' ? '#cca26b' : '#94a3b8',
                borderColor: activeTab === 'standings' ? '#cca26b' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              Klasemen
            </button>
          )}

          <button
            style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.04)',
              background: 'rgba(255, 255, 255, 0.02)', color: '#475569', cursor: 'default', whiteSpace: 'nowrap'
            }}
          >
            Pemain Terbaik
          </button>

          <button
            style={{
              padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.04)',
              background: 'rgba(255, 255, 255, 0.02)', color: '#475569', cursor: 'default', whiteSpace: 'nowrap'
            }}
          >
            Piala
          </button>
        </div>
      </div>

      {/* Main Container Contents */}
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
        {activeTab === 'matches' && (
          <div>
            {/* Matches view filter (Upcoming vs Results) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <button
                onClick={() => setMatchView('upcoming')}
                style={{
                  padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 16, border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: matchView === 'upcoming' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: matchView === 'upcoming' ? '#3b82f6' : '#64748b'
                }}
              >
                Mendatang
              </button>
              <button
                onClick={() => setMatchView('finished')}
                style={{
                  padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 16, border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: matchView === 'finished' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: matchView === 'finished' ? '#3b82f6' : '#64748b'
                }}
              >
                Hasil
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

                  return (
                    <div 
                      key={m.id} 
                      onClick={() => router.push(`/matches/${m.id}`)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.02)',
                        borderRadius: 14,
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        gap: 12
                      }}
                      className="hover-card"
                    >
                      {/* Left Side: Date / Time Column */}
                      <div style={{ width: 64, flexShrink: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                        {dateShort}
                      </div>

                      {/* Center Teams Horizontal Display */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', textAlign: 'right' }}>{m.home_team?.name}</span>
                          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
                        </div>

                        {/* Mid score / schedule time button */}
                        <div 
                          style={{ 
                            padding: '6px 14px', borderRadius: 12, background: 'rgba(0, 0, 0, 0.45)', 
                            border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: 12, fontWeight: 800, minWidth: 60, textAlign: 'center',
                            color: hasScore ? '#3b82f6' : '#94a3b8'
                          }}
                        >
                          {hasScore ? `${m.home_score} : ${m.away_score}` : time}
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start' }}>
                          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{m.away_team?.name}</span>
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
          <div style={{ overflowX: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 14 }}>Tabel Klasemen</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 12px' }}>Pos</th>
                  <th style={{ padding: '10px 12px' }}>Tim</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>M</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>M</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>S</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>K</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>GM-GK</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>SG</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#3b82f6' }}>Poin</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <tr key={team.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: idx === 0 ? '#10b981' : '#f1f5f9' }}>{idx + 1}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={getImageUrl(team.team?.logo_path) || avatar(team.team?.name)} style={{ width: 24, height: 24, borderRadius: '50%' }} alt={team.team?.name} />
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{team.team?.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{team.played ?? 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{team.won ?? 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{team.drawn ?? 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{team.lost ?? 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{team.goals_for ?? 0} - {team.goals_against ?? 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{(team.goals_for ?? 0) - (team.goals_against ?? 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{team.points ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'info' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Tentang Turnamen</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              Turnamen <strong>{tournament.name}</strong> diselenggarakan resmi di Bojonegoro. Turnamen ini merupakan ajang bergengsi yang memfasilitasi persaingan sportif bagi tim-tim di daerah Bojonegoro.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Olahraga</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{tournament.sport?.name || 'Multi-Sport'}</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Lokasi Pertandingan</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{tournament.location || 'Bojonegoro'}</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Status Turnamen</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{tournament.status || 'Berjalan'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
