"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, MapPin, Trophy, Users, Calendar, BarChart2, Activity, Target } from 'lucide-react';
import api from '../../../api';
import Link from 'next/link';

export default function TeamDetailPage({ params }) {
  const unwrappedParams = use(params);
  const teamId = unwrappedParams.id;
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches, squad, stats, info

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
        padding: '14px 16px', fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
        color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
        borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
        transition: 'all 0.2s ease', position: 'relative', bottom: -1,
        whiteSpace: 'nowrap'
      }}
    >
      <Icon size={18} />
      {label}
      {count !== undefined && (
        <span style={{ 
          background: activeTab === id ? 'var(--bg-subtle)' : 'var(--border-light)',
          padding: '2px 8px', borderRadius: 12, fontSize: 11, marginLeft: 4
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
            borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: 'var(--text-primary)',
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
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Kembali</span>
      </div>

      {/* Team Header Profile Card */}
      <div className="card" style={{ marginBottom: 32, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: '50%', 
            background: 'var(--bg-subtle)', border: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 12
          }}>
            <img 
              src={getImageUrl(team.logo_path || team.logo) || avatar(team.name)} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt={team.name}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{team.name}</h1>
              {team.sport && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                  background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                }}>
                  {team.sport.name}
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, maxWidth: 800 }}>
              {team.description || 'Ini adalah profil resmi tim yang berlaga dan berkompetisi dalam ekosistem Liga Bojonegoro.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                <span>Pelatih / Manajer: <strong style={{ color: 'var(--text-primary)' }}>{team.coach_name || team.contact_person || 'TBA'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
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
        <TabButton id="matches" label="Pertandingan" icon={Calendar} count={matches.length} />
        <TabButton id="squad" label="Skuad Pemain" icon={Users} count={players.length} />
        <TabButton id="stats" label="Statistik" icon={BarChart2} />
        <TabButton id="info" label="Profil Lengkap" icon={Shield} />
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 300 }}>
        
        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Upcoming Matches */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} /> Jadwal Mendatang
              </h3>
              {upcomingMatches.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {upcomingMatches.map(m => {
                    const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                    return (
                      <Link href={`/matches/${m.uuid || m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12 }}>
                            <span style={{
                              fontWeight: 700, padding: '4px 8px', borderRadius: 6,
                              background: isLive ? 'rgba(239,68,68,0.1)' : 'var(--bg-subtle)',
                              color: isLive ? '#ef4444' : 'var(--text-secondary)',
                            }}>
                              {isLive ? 'LIVE' : (m.status === 'scheduled' ? 'Akan Datang' : m.status || 'Belum Mulai')}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal TBA'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
                              <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2 }}>{m.home_team?.name}</span>
                            </div>
                            <div style={{ padding: '0 16px', fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
                              <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2 }}>{m.away_team?.name}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Tidak ada jadwal mendatang.</p>
                </div>
              )}
            </div>

            {/* Past Matches */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={20} /> Riwayat Pertandingan
              </h3>
              {finishedMatches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {finishedMatches.map(m => {
                    const isHome = String(m.home_team_id) === String(teamId) || String(m.home_team?.id) === String(teamId);
                    const teamScore = isHome ? m.home_score : m.away_score;
                    const oppScore = isHome ? m.away_score : m.home_score;
                    let resultColor = 'var(--text-muted)';
                    let resultText = 'D';
                    
                    if (teamScore > oppScore) { resultColor = '#10b981'; resultText = 'M'; }
                    else if (teamScore < oppScore) { resultColor = '#ef4444'; resultText = 'K'; }

                    return (
                      <Link href={`/matches/${m.uuid || m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ 
                          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                          flexWrap: 'wrap', gap: 16, cursor: 'pointer', transition: 'background 0.2s' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 150 }}>
                            <div style={{ 
                              width: 32, height: 32, borderRadius: 8, background: resultColor, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14
                            }}>
                              {resultText}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {m.home_team?.name} <span style={{ color: 'var(--primary)', margin: '0 4px' }}>{m.home_score} - {m.away_score}</span> {m.away_team?.name}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal TBA'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>VS</span>
                            <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <BarChart2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Belum ada riwayat pertandingan.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SQUAD TAB */}
        {activeTab === 'squad' && (
          <div>
            {players.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {players.map(player => (
                  <Link href={`/players/${player.uuid || player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ 
                      padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' 
                    }}>
                      <div style={{ 
                        width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-subtle)', 
                        marginBottom: 16, overflow: 'hidden'
                      }}>
                        <img 
                          src={getImageUrl(player.photo_path || player.photo) || avatar(player.name)} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          alt={player.name}
                        />
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{player.name}</h4>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '2px 10px', borderRadius: 12 }}>
                        {player.position || 'Pemain'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Belum Ada Pemain</h3>
                <p>Tim ini belum mendaftarkan pemain ke dalam sistem.</p>
              </div>
            )}
          </div>
        )}

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
