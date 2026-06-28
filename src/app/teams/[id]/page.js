"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, MapPin, Trophy, Users, Calendar, BarChart2, Activity, Target } from 'lucide-react';
import api from '../../../api';
import Link from 'next/link';

const PlayerPin = ({ player, getImageUrl, avatar }) => {
  if (!player) return null;
  return (
    <Link href={`/players/${player.uuid || player.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: '#fff', gap: 4 }}>
      <img src={getImageUrl(player.photo_path || player.photo) || avatar(player.name)} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover', background: '#fff' }} alt={player.name} />
      <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>
        {player.jersey_number ? `${player.jersey_number} ` : ''}{player.name.split(' ').pop()}
      </span>
    </Link>
  );
};

export default function TeamDetailPage({ params }) {
  const unwrappedParams = use(params);
  const teamId = unwrappedParams.id;
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, matches, squad, stats, info

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://app.ligabojonegoro.id/storage/${cleanPath}`;
  };

  const avatar = (name, bg = '000000') => {
    if (!name) return `https://ui-avatars.com/api/?name=L&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);

        // Fetch team details
        const tRes = await api.get('/teams');
        if (tRes.data.success) {
          const matched = tRes.data.data.find(t => String(t.uuid) === String(teamId) || String(t.id) === String(teamId));
          if (matched) {
            setTeam(matched);
          }
        }

        // Fetch matches involving this team
        const mRes = await api.get('/matches', { params: { per_page: 200 } });
        if (mRes.data.success) {
          const teamMatches = mRes.data.data.filter(
            m => String(m.home_team_id) === String(teamId) || String(m.away_team_id) === String(teamId) ||
                 String(m.home_team?.uuid) === String(teamId) || String(m.away_team?.uuid) === String(teamId) ||
                 String(m.home_team?.id) === String(teamId) || String(m.away_team?.id) === String(teamId)
          );
          setMatches(teamMatches);
        }

        // Fetch players for this team
        const pRes = await api.get('/players', { params: { per_page: 500 } });
        if (pRes.data.success) {
          const teamPlayers = pRes.data.data.filter(
            p => String(p.team_id) === String(teamId) || (p.team && String(p.team.uuid) === String(teamId))
          );
          setPlayers(teamPlayers);
        }

      } catch (err) {
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" style={{ borderColor: 'var(--primary)', borderRightColor: 'transparent' }}></div>
        <p style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Memuat detail tim...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: '0 24px' }}>
        <Shield size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Tim Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8, marginBottom: 24 }}>Maaf, tim yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button 
          onClick={() => router.push('/teams')} 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'var(--primary)', color: 'var(--text-inverse)',
            borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} /> Kembali ke Daftar Tim
        </button>
      </div>
    );
  }

  // Calculate statistics from matches
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const upcomingMatches = matches.filter(m => m.status !== 'finished');

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  
  finishedMatches.forEach(m => {
    const isHome = String(m.home_team_id) === String(teamId) || String(m.home_team?.uuid) === String(teamId) || String(m.home_team?.id) === String(teamId);
    const teamScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;
    
    if (teamScore !== null && oppScore !== null) {
      goalsFor += teamScore;
      goalsAgainst += oppScore;
      
      if (teamScore > oppScore) wins++;
      else if (teamScore === oppScore) draws++;
      else losses++;
    }
  });

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
        borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
        transition: 'all 0.2s ease', position: 'relative', bottom: -1,
        whiteSpace: 'nowrap'
      }}
    >
      <Icon size={14} />
      {label}
      {count !== undefined && (
        <span style={{ 
          background: activeTab === id ? 'var(--bg-subtle)' : 'var(--border-light)',
          padding: '2px 8px', borderRadius: 12, fontSize: 10, marginLeft: 4
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 16px 64px', minHeight: '80vh' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Kembali</span>
      </div>

      {/* Team Header Profile Card */}
      <div className="card" style={{ marginBottom: 32, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ 
            width: 72, height: 72, borderRadius: '50%', 
            background: 'var(--bg-subtle)', border: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 8
          }}>
            <img 
              src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt={team.name}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{team.name}</h1>
              {team.sport && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                }}>
                  {team.sport.name}
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginBottom: 16, maxWidth: 800 }}>
              {team.description || 'Ini adalah profil resmi tim yang berlaga dan berkompetisi dalam ekosistem Liga Bojonegoro.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <Users size={14} style={{ color: 'var(--primary)' }} />
                <span>Pelatih / Manajer: <strong style={{ color: 'var(--text-primary)' }}>{team.coach_name || team.contact_person || 'TBA'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} />
                <span>Asal / Kota: <strong style={{ color: 'var(--text-primary)' }}>{team.city || team.address || 'Bojonegoro'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', borderBottom: '1px solid var(--border)', gap: 8, marginBottom: 32, overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none' 
      }}>
        <TabButton id="overview" label="Overview" icon={Activity} />
        <TabButton id="matches" label="Pertandingan" icon={Calendar} count={matches.length} />
        <TabButton id="squad" label="Skuad Pemain" icon={Users} count={players.length} />
        <TabButton id="stats" label="Statistik" icon={BarChart2} />
        <TabButton id="info" label="Profil Lengkap" icon={Shield} />
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 300 }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (() => {
          // 1. Mock Lineup
          const gks = players.filter(p => ['GK', 'Penjaga Gawang'].includes(typeof p.position === 'object' ? p.position?.abbreviation : p.position));
          const dfs = players.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF', 'Bek Tengah', 'Bek Kiri', 'Bek Kanan'].includes(typeof p.position === 'object' ? p.position?.abbreviation : p.position));
          const mfs = players.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM', 'MF', 'Gelandang', 'Anchor'].includes(typeof p.position === 'object' ? p.position?.abbreviation : p.position));
          const fws = players.filter(p => ['ST', 'CF', 'LW', 'RW', 'FW', 'Penyerang', 'Flank', 'Pivot'].includes(typeof p.position === 'object' ? p.position?.abbreviation : p.position));
          
          let lineup = [];
          if (players.length >= 11) {
            lineup.push(gks[0] || players[0]);
            lineup.push(...dfs.slice(0, 4));
            lineup.push(...mfs.slice(0, 5));
            lineup.push(...fws.slice(0, 1));
            while(lineup.length < 11) {
              const p = players.find(p => !lineup.includes(p));
              if (p) lineup.push(p); else break;
            }
          }

          // 2 & 3. Mock Top Scorers and Assists
          const scorers = [...fws, ...mfs, ...players].slice(0, 3).map((p, i) => ({ ...p, stat: 3 - i }));
          const assists = [...mfs, ...fws, ...players].reverse().slice(0, 3).map((p, i) => ({ ...p, stat: 3 - i }));
          
          // 4. Next Match
          const nextMatch = upcomingMatches[0];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                
                {/* LINEUP PITCH */}
                <div className="card" style={{ padding: 24, gridRow: 'span 2' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={18} /> Starting XI (Prediksi)
                  </h3>
                  {lineup.length >= 11 ? (
                    <div style={{
                      position: 'relative', width: '100%', aspectRatio: '3/4', 
                      background: '#0e8748', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {/* Pitch lines - Half Pitch */}
                      <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: '55%', height: '22%', border: '2px solid rgba(255,255,255,0.2)', borderBottom: 'none' }} />
                      <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: '25%', height: '8%', border: '2px solid rgba(255,255,255,0.2)', borderBottom: 'none' }} />
                      <div style={{ position: 'absolute', bottom: '22%', left: '50%', transform: 'translate(-50%, 50%)', width: '20%', aspectRatio: '1/1', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
                      
                      {/* Players */}
                      <div style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[0]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      
                      <div style={{ position: 'absolute', bottom: '26%', left: '15%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[1]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '24%', left: '38%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[2]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '24%', left: '62%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[3]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '26%', left: '85%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[4]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      
                      <div style={{ position: 'absolute', bottom: '52%', left: '30%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[5]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '52%', left: '70%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[6]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '66%', left: '15%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[7]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '68%', left: '50%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[8]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      <div style={{ position: 'absolute', bottom: '66%', left: '85%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[9]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                      
                      <div style={{ position: 'absolute', bottom: '85%', left: '50%', transform: 'translateX(-50%)' }}><PlayerPin player={lineup[10]} getImageUrl={getImageUrl} avatar={avatar} /></div>
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                      <p>Pemain tidak cukup untuk simulasi Lineup (minimal 11).</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* NEXT MATCH */}
                  {nextMatch && (
                    <div className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Pertandingan Berikutnya</h3>
                        <span style={{ fontSize: 12, background: 'var(--primary)', color: 'var(--text-inverse)', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>Akan Datang</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
                          <img src={getImageUrl(nextMatch.home_team?.logo_path) || avatar(nextMatch.home_team?.name)} style={{ width: 48, height: 48, borderRadius: '50%' }} alt="" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{nextMatch.home_team?.name}</span>
                        </div>
                        <div style={{ padding: '0 16px', fontWeight: 800, color: 'var(--text-muted)', fontSize: 14 }}>VS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
                          <img src={getImageUrl(nextMatch.away_team?.logo_path) || avatar(nextMatch.away_team?.name)} style={{ width: 48, height: 48, borderRadius: '50%' }} alt="" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{nextMatch.away_team?.name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* ABOUT TEAM */}
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Tentang Tim</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {team.description || `Tim ${team.name} merupakan tim yang berasal dari ${team.city || 'Bojonegoro'}. Saat ini sedang aktif berpartisipasi dalam kompetisi di Liga Bojonegoro dan dipimpin oleh manajer ${team.coach_name || team.contact_person || 'TBA'}.`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* TOP SCORERS */}
                  <div className="card" style={{ overflow: 'hidden', padding: '24px 0' }}>
                    <div style={{ padding: '0 24px 16px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Top scorers</h3>
                    </div>
                    {scorers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {scorers.map((p, i) => (
                          <Link href={`/players/${p.uuid || p.id}`} key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={getImageUrl(p.photo_path || p.photo) || avatar(p.name)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <img src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} style={{ width: 12, height: 12, borderRadius: '50%' }} alt="" />
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{team.name}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                                {p.stat}
                              </div>
                            </div>
                          </Link>
                        ))}
                        <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
                           <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>All</span>
                        </div>
                      </div>
                    ) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data</div>}
                  </div>

                  {/* TOP ASSISTS */}
                  <div className="card" style={{ overflow: 'hidden', padding: '24px 0' }}>
                    <div style={{ padding: '0 24px 16px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Top assists</h3>
                    </div>
                    {assists.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {assists.map((p, i) => (
                          <Link href={`/players/${p.uuid || p.id}`} key={i} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={getImageUrl(p.photo_path || p.photo) || avatar(p.name)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <img src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} style={{ width: 12, height: 12, borderRadius: '50%' }} alt="" />
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{team.name}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ minWidth: 28, padding: '0 6px', height: 28, borderRadius: 14, background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                                {p.stat}
                              </div>
                            </div>
                          </Link>
                        ))}
                        <div style={{ padding: '16px 24px 0', textAlign: 'center' }}>
                           <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>All</span>
                        </div>
                      </div>
                    ) : <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data</div>}
                  </div>
                </div>
                
              </div>
            </div>
          );
        })()}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Upcoming Matches */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} /> Jadwal Mendatang
              </h3>
              {upcomingMatches.length > 0 ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {upcomingMatches.map((m, i) => {
                    const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                    return (
                      <Link href={`/matches/${m.uuid || m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
                        <div className="match-row" style={{ borderBottom: i < upcomingMatches.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <div className="time-col" style={{ width: 65, textAlign: 'left', paddingRight: 8, marginRight: 8, position: 'relative' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                              {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'TBA'}
                            </div>
                            <div style={{ fontSize: 11, color: isLive ? '#ef4444' : 'var(--text-primary)', marginTop: 2, fontWeight: isLive ? 700 : 500 }}>
                              {isLive ? 'LIVE' : (m.match_date ? new Date(m.match_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '')}
                            </div>
                          </div>
                          <div className="teams-col">
                            <div className="team-home">
                              <span className="team-name">{m.home_team?.name}</span>
                              <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} className="team-logo" alt="" />
                            </div>
                            <div className="score-box">
                              <span className="score-sep" style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 12, fontSize: 10, color: 'var(--text-muted)' }}>vs</span>
                            </div>
                            <div className="team-away">
                              <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} className="team-logo" alt="" />
                              <span className="team-name">{m.away_team?.name}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.2, color: 'var(--text-secondary)' }} />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Belum ada jadwal pertandingan mendatang.</p>
                </div>
              )}
            </div>

            {/* Past Matches */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={20} /> Riwayat Pertandingan
              </h3>
              {finishedMatches.length > 0 ? (
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {finishedMatches.map((m, i) => {
                    const isDraw = m.home_score === m.away_score;
                    const homeWin = m.home_score > m.away_score;
                    const awayWin = m.away_score > m.home_score;
                    const isHome = String(m.home_team_id) === String(teamId) || String(m.home_team?.id) === String(teamId);
                    const resultBadge = isHome 
                      ? (isDraw ? 'D' : (homeWin ? 'W' : 'L'))
                      : (isDraw ? 'D' : (awayWin ? 'W' : 'L'));
                    const badgeColor = resultBadge === 'W' ? '#10b981' : (resultBadge === 'L' ? '#ef4444' : '#94a3b8');

                    return (
                      <Link href={`/matches/${m.uuid || m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
                        <div className="match-row" style={{ borderBottom: i < finishedMatches.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                          <div className="time-col" style={{ width: 65, textAlign: 'left', paddingRight: 8, marginRight: 8, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>
                              {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'TBA'}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 800 }}>
                              {resultBadge}
                            </div>
                          </div>
                          <div className="teams-col">
                            <div className="team-home">
                              <span className={`team-name ${homeWin ? 'winner' : ''}`}>{m.home_team?.name}</span>
                              <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} className="team-logo" alt="" />
                            </div>
                            <div className="score-box" style={{ background: 'var(--bg-subtle)', padding: '4px 12px' }}>
                              <span className="score" style={{ color: homeWin ? 'var(--text-primary)' : (isDraw ? 'var(--text-secondary)' : 'var(--text-muted)') }}>{m.home_score ?? '-'}</span>
                              <span className="score-sep" style={{ padding: '0 4px' }}>-</span>
                              <span className="score" style={{ color: awayWin ? 'var(--text-primary)' : (isDraw ? 'var(--text-secondary)' : 'var(--text-muted)') }}>{m.away_score ?? '-'}</span>
                            </div>
                            <div className="team-away">
                              <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} className="team-logo" alt="" />
                              <span className={`team-name ${awayWin ? 'winner' : ''}`}>{m.away_team?.name}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Trophy size={36} style={{ margin: '0 auto 12px', opacity: 0.2, color: 'var(--text-secondary)' }} />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Belum ada riwayat pertandingan.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SQUAD TAB */}
        {activeTab === 'squad' && (() => {
          const getPositionCategory = (posObj) => {
            const abbr = typeof posObj === 'object' ? posObj?.abbreviation : posObj;
            if (!abbr) return 'Pemain Lainnya';
            if (['GK', 'Penjaga Gawang'].includes(abbr)) return 'Keepers';
            if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF', 'Bek Tengah', 'Bek Kiri', 'Bek Kanan'].includes(abbr)) return 'Defenders';
            if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'MF', 'Gelandang', 'Anchor'].includes(abbr)) return 'Midfielders';
            if (['ST', 'CF', 'LW', 'RW', 'FW', 'Penyerang', 'Flank', 'Pivot'].includes(abbr)) return 'Forwards';
            return typeof posObj === 'object' ? (posObj?.name || posObj?.abbreviation || 'Pemain Lainnya') : posObj;
          };

          const calculateAge = (dob) => {
            if (!dob) return '-';
            const birthDate = new Date(dob);
            if (isNaN(birthDate)) return '-';
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            return age;
          };

          const groupedPlayers = players.reduce((acc, player) => {
            const cat = getPositionCategory(player.position);
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(player);
            return acc;
          }, {});

          const categoryOrder = ['Keepers', 'Defenders', 'Midfielders', 'Forwards', 'Pemain Lainnya'];
          const sortedCategories = Object.keys(groupedPlayers).sort((a, b) => {
            const idxA = categoryOrder.indexOf(a);
            const idxB = categoryOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Coach Section */}
              <div className="card" style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Coach</span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, width: 40, textAlign: 'center' }}>Age</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img src={avatar(team.coach_name || 'Coach')} style={{ width: 44, height: 44, borderRadius: '50%' }} alt="Coach" />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{team.coach_name || team.contact_person || 'TBA'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <img src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} style={{ width: 14, height: 14, borderRadius: '50%' }} alt="" />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{team.name}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--text-primary)', width: 40, textAlign: 'center' }}>-</div>
                </div>
              </div>

              {/* Players Sections */}
              {players.length > 0 ? (
                sortedCategories.map(category => (
                  <div key={category} className="card" style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{category}</span>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, width: 40, textAlign: 'center' }}>Shirt</span>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, width: 40, textAlign: 'center' }}>Age</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {groupedPlayers[category].map((player, idx) => (
                        <Link href={`/players/${player.uuid || player.id}`} key={player.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
                            borderBottom: idx < groupedPlayers[category].length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.2s', cursor: 'pointer'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <img src={getImageUrl(player.photo_path || player.photo) || avatar(player.name)} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt={player.name} />
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{player.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                  <img src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} style={{ width: 14, height: 14, borderRadius: '50%' }} alt="" />
                                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{team.name}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                              <div style={{ fontSize: 15, color: 'var(--text-primary)', width: 40, textAlign: 'center' }}>{player.jersey_number || '-'}</div>
                              <div style={{ fontSize: 15, color: 'var(--text-primary)', width: 40, textAlign: 'center' }}>{calculateAge(player.date_of_birth) || '-'}</div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Belum Ada Pemain</h3>
                  <p>Tim ini belum mendaftarkan pemain ke dalam sistem.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Total Main</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>{finishedMatches.length}</span>
              </div>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Menang</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{wins}</span>
              </div>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Seri</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{draws}</span>
              </div>
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Kalah</span>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#ef4444' }}>{losses}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={32} />
                </div>
                <div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Gol Dicetak</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{goalsFor}</span>
                </div>
              </div>
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={32} />
                </div>
                <div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Kebobolan</span>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{goalsAgainst}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} /> Informasi Profil Tim
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Tim <strong>{team.name}</strong> didirikan dan berkompetisi di {team.city || 'Bojonegoro'}. Tim ini aktif berpartisipasi dalam ajang olahraga resmi yang terdaftar di sistem Liga Bojonegoro.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Nama Lengkap Tim</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{team.name}</span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Cabang Olahraga</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{team.sport?.name || 'Cabang Umum'}</span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Coach / Manajer</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{team.coach_name || team.contact_person || 'TBA'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
