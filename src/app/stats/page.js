"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, BarChart3, Award, Users, Star, Flame, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function StatsInfographicsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  
  const [standings, setStandings] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=L&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments');
        if (res.data.success) {
          setTournaments(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedTournament(res.data.data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch Standings
        try {
          const sRes = await api.get(`/standings/${selectedTournament.uuid || selectedTournament.id}`);
          if (sRes.data.success) {
            setStandings(sRes.data.data);
          } else {
            setStandings(null);
          }
        } catch (e) {
          setStandings(null);
        }

        // Fetch Player Stats
        try {
          const pRes = await api.get('/player-stats', { params: { tournament_id: selectedTournament.uuid || selectedTournament.id, limit: 10 } });
          if (pRes.data.success) {
            setPlayerStats(pRes.data.data.top_scorers || []);
          } else {
            setPlayerStats([]);
          }
        } catch (e) {
          setPlayerStats([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedTournament]);

  // Derive "Tim Terbaik" from standings (top 3 overall)
  let bestTeams = [];
  if (standings) {
    if (standings.type === 'grouped_phases') {
      // Just grab the top team from each group across all phases
      const allTopTeams = (standings.phases || []).flatMap(p => (p.groups || []).map(g => g.standings?.[0])).filter(Boolean);
      bestTeams = allTopTeams.sort((a, b) => b.points - a.points).slice(0, 3);
    } else if (standings.type === 'grouped') {
      // Just grab the top team from each group
      const allTopTeams = (standings.groups || []).map(g => g.standings?.[0]).filter(Boolean);
      bestTeams = allTopTeams.sort((a, b) => b.points - a.points).slice(0, 3);
    } else {
      bestTeams = (standings.standings || []).slice(0, 3);
    }
  }

  const topScorers = [...playerStats].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists).filter(s => s.assists > 0).slice(0, 5);

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px 64px' }}>
      
      {/* Header Infographic Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(5, 10, 20, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 24, padding: '40px 32px',
        marginBottom: 32, position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ position: 'absolute', top: -100, right: -50, width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%)', filter: 'blur(40px)' }} />
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
            <TrendingUp size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 27, fontWeight: 900, color: '#f8fafc', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Infografis & Statistik</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
              Pusat data Klasemen, Tim Terbaik, dan Pemain Terbaik Liga Bojonegoro.
            </p>
          </div>
        </div>

        {/* Tournament Pills */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {tournaments.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTournament(t)}
              style={{
                padding: '8px 20px', fontSize: 11, fontWeight: 700, borderRadius: 24,
                border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: selectedTournament?.id === t.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedTournament?.id === t.id ? '#60a5fa' : '#cbd5e1',
                borderColor: selectedTournament?.id === t.id ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: selectedTournament?.id === t.id ? '0 0 20px rgba(59,130,246,0.2)' : 'none',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 16, color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>Menyusun Infografis...</p>
        </div>
      ) : !selectedTournament ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: '#64748b' }}>
          <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Belum ada data turnamen.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          
          {/* TOP ROW: BEST TEAMS & STANDINGS SUMMARY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            
            {/* Widget: Tim Terbaik (Top 3) */}
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', 
              overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={20} style={{ color: '#10b981' }} />
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>Klub & Tim Terbaik</h2>
                </div>
                <Link href="/standings" style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Lihat Klasemen <ChevronRight size={14} /></Link>
              </div>
              
              <div style={{ padding: '24px', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, minHeight: 240, position: 'relative' }}>
                {bestTeams.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 11, alignSelf: 'center' }}>Belum ada data tim.</p>
                ) : (
                  <>
                    {/* Rank 2 */}
                    {bestTeams[1] && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 2 }}>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                          <img src={getImageUrl(bestTeams[1].team?.logo_path) || avatar(bestTeams[1].team?.name)} style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #94a3b8', background: '#0f172a', padding: 2 }} alt="" />
                          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#94a3b8', color: '#0f172a', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>2</div>
                        </div>
                        <div style={{ background: 'linear-gradient(180deg, rgba(148,163,184,0.15) 0%, rgba(148,163,184,0.05) 100%)', width: '100%', height: 80, borderTopLeftRadius: 12, borderTopRightRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', border: '1px solid rgba(148,163,184,0.2)', borderBottom: 'none' }}>
                           <span style={{ fontSize: 10, fontWeight: 800, color: '#e2e8f0', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{bestTeams[1].team?.name}</span>
                           <span style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6', marginTop: 'auto' }}>{bestTeams[1].points} <span style={{ fontSize: 9, color: '#64748b' }}>Pts</span></span>
                        </div>
                      </div>
                    )}
                    
                    {/* Rank 1 */}
                    {bestTeams[0] && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36%', zIndex: 3 }}>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                          <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}><Trophy size={20} color="#eab308" /></div>
                          <img src={getImageUrl(bestTeams[0].team?.logo_path) || avatar(bestTeams[0].team?.name)} style={{ width: 72, height: 72, borderRadius: '50%', border: '4px solid #eab308', background: '#0f172a', padding: 2, boxShadow: '0 0 20px rgba(234,179,8,0.3)' }} alt="" />
                          <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', background: '#eab308', color: '#0f172a', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>1</div>
                        </div>
                        <div style={{ background: 'linear-gradient(180deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.05) 100%)', width: '100%', height: 110, borderTopLeftRadius: 12, borderTopRightRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', border: '1px solid rgba(234,179,8,0.3)', borderBottom: 'none' }}>
                           <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{bestTeams[0].team?.name}</span>
                           <span style={{ fontSize: 17, fontWeight: 900, color: '#eab308', marginTop: 'auto' }}>{bestTeams[0].points} <span style={{ fontSize: 9, color: '#cca26b' }}>Pts</span></span>
                        </div>
                      </div>
                    )}

                    {/* Rank 3 */}
                    {bestTeams[2] && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 1 }}>
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                          <img src={getImageUrl(bestTeams[2].team?.logo_path) || avatar(bestTeams[2].team?.name)} style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #b45309', background: '#0f172a', padding: 2 }} alt="" />
                          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#b45309', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>3</div>
                        </div>
                        <div style={{ background: 'linear-gradient(180deg, rgba(180,83,9,0.2) 0%, rgba(180,83,9,0.05) 100%)', width: '100%', height: 60, borderTopLeftRadius: 12, borderTopRightRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px', border: '1px solid rgba(180,83,9,0.3)', borderBottom: 'none' }}>
                           <span style={{ fontSize: 9, fontWeight: 800, color: '#e2e8f0', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{bestTeams[2].team?.name}</span>
                           <span style={{ fontSize: 12, fontWeight: 900, color: '#fb923c', marginTop: 'auto' }}>{bestTeams[2].points} <span style={{ fontSize: 9, color: '#64748b' }}>Pts</span></span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Widget: Klasemen Singkat */}
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', 
              overflow: 'hidden', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart3 size={20} style={{ color: '#3b82f6' }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>Klasemen Top 5</h2>
              </div>
              <div style={{ padding: '0', flex: 1, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 320 }}>
                  <thead>
                    <tr style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px 16px', width: 40 }}>Pos</th>
                      <th style={{ padding: '12px 8px' }}>Tim</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>M</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>SG</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#3b82f6' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(standings?.type === 'grouped' ? (standings.groups?.[0]?.standings || []) : (standings?.standings || [])).slice(0, 5).map((row, idx) => (
                       <tr key={row.team?.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: 11 }}>
                         <td style={{ padding: '12px 16px', fontWeight: 800, color: idx === 0 ? '#10b981' : '#f1f5f9' }}>{idx + 1}</td>
                         <td style={{ padding: '12px 8px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <img src={getImageUrl(row.team?.logo_path) || avatar(row.team?.name)} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
                             <span style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{row.team?.name}</span>
                           </div>
                         </td>
                         <td style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8' }}>{row.played || 0}</td>
                         <td style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8' }}>{(row.goals_for || 0) - (row.goals_against || 0)}</td>
                         <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>{row.points || 0}</td>
                       </tr>
                    ))}
                    {(!standings || ((standings?.type === 'grouped' ? (standings.groups?.[0]?.standings || []) : (standings?.standings || [])).length === 0)) && (
                      <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>Belum ada data klasemen.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <Link href="/standings" style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Lihat Seluruh Klasemen →</Link>
              </div>
            </div>
            
          </div>

          {/* BOTTOM ROW: PLAYER STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            
            {/* Top Scorer Widget */}
            <div style={{ 
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', 
              overflow: 'hidden', backdropFilter: 'blur(12px)', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, transform: 'translate(20%, -20%)' }}><Flame size={180} /></div>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={20} style={{ color: '#eab308' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>Top Skor</h2>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>Pencetak Gol Terbanyak</p>
                </div>
              </div>
              
              <div style={{ padding: '16px 24px', position: 'relative', zIndex: 2 }}>
                {topScorers.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 11, textAlign: 'center', padding: '32px 0' }}>Belum ada data gol.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topScorers.map((stat, idx) => (
                      <Link 
                        href={`/players/${stat.player.uuid || stat.player.id}`} 
                        key={stat.player.id}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 16, background: idx === 0 ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.02)',
                          padding: '12px 16px', borderRadius: 16, border: `1px solid ${idx === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.03)'}`,
                          textDecoration: 'none', transition: 'transform 0.2s, background 0.2s'
                        }}
                        className="hover-card"
                      >
                        <div style={{ fontSize: 14, fontWeight: 900, color: idx === 0 ? '#eab308' : '#64748b', width: 20, textAlign: 'center' }}>{idx + 1}</div>
                        <img src={avatar(stat.player.name)} style={{ width: 44, height: 44, borderRadius: '50%', border: idx === 0 ? '2px solid #eab308' : 'none' }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? '#f8fafc' : '#e2e8f0' }}>{stat.player.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={10} /> {stat.player.team || 'Tim'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: idx === 0 ? '#eab308' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#0f172a' : '#f1f5f9', width: 40, height: 40, borderRadius: 12 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{stat.goals}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Assist Widget */}
            <div style={{ 
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', 
              overflow: 'hidden', backdropFilter: 'blur(12px)', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, transform: 'translate(20%, -20%)' }}><Star size={180} /></div>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={20} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>Top Assist</h2>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>Pemberi Umpan Terbanyak</p>
                </div>
              </div>
              
              <div style={{ padding: '16px 24px', position: 'relative', zIndex: 2 }}>
                {topAssists.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: 11, textAlign: 'center', padding: '32px 0' }}>Belum ada data assist.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topAssists.map((stat, idx) => (
                      <Link 
                        href={`/players/${stat.player.uuid || stat.player.id}`} 
                        key={stat.player.id}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 16, background: idx === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                          padding: '12px 16px', borderRadius: 16, border: `1px solid ${idx === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)'}`,
                          textDecoration: 'none', transition: 'transform 0.2s, background 0.2s'
                        }}
                        className="hover-card"
                      >
                        <div style={{ fontSize: 14, fontWeight: 900, color: idx === 0 ? '#3b82f6' : '#64748b', width: 20, textAlign: 'center' }}>{idx + 1}</div>
                        <img src={avatar(stat.player.name)} style={{ width: 44, height: 44, borderRadius: '50%', border: idx === 0 ? '2px solid #3b82f6' : 'none' }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? '#f8fafc' : '#e2e8f0' }}>{stat.player.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={10} /> {stat.player.team || 'Tim'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: idx === 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#0f172a' : '#f1f5f9', width: 40, height: 40, borderRadius: 12 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{stat.assists}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
