"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Calendar, Award, TrendingUp, Target, Star } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

export default function PlayerDetailPage({ params }) {
  const unwrappedParams = use(params);
  const playerId = unwrappedParams.id;
  const router = useRouter();

  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=P&background=${bg}&color=fff&bold=true&size=200`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=200`;
  };

  const posLabels = { GK: 'Kiper', DF: 'Bek', MF: 'Gelandang', FW: 'Penyerang' };
  const posColors = { GK: '#f59e0b', DF: '#10b981', MF: '#3b82f6', FW: '#ef4444' };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch player details
        const pRes = await api.get(`/players/${playerId}`);
        if (pRes.data.success) {
          setPlayer(pRes.data.data);
          if (pRes.data.data.aggregated_stats) {
            setStats(pRes.data.data.aggregated_stats);
          }
        }

        // Fetch matches involving this player's team
        try {
          const mRes = await api.get('/matches', { params: { per_page: 100 } });
          if (mRes.data.success && pRes.data.data?.team_id) {
            const teamId = pRes.data.data.team_id;
            const teamMatches = mRes.data.data.filter(
              m => String(m.home_team_id) === String(teamId) || String(m.away_team_id) === String(teamId)
            );
            setMatches(teamMatches.slice(0, 10));
          }
        } catch (err) {
          console.log('No matches data');
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat profil pemain...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <User size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Pemain Tidak Ditemukan</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, marginBottom: 18 }}>
          Maaf, pemain yang Anda cari tidak tersedia.
        </p>
        <button onClick={() => router.push('/players')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Pemain
        </button>
      </div>
    );
  }

  const posColor = posColors[player.position] || '#64748b';
  const age = player.date_of_birth
    ? Math.floor((new Date() - new Date(player.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const statCards = [];
  if (stats) {
    if (stats.goals !== undefined) statCards.push({ label: 'Gol', value: stats.goals, icon: Target, color: '#ef4444' });
    if (stats.assists !== undefined) statCards.push({ label: 'Assist', value: stats.assists, icon: TrendingUp, color: '#3b82f6' });
    if (stats.yellow_cards !== undefined) statCards.push({ label: 'Kartu Kuning', value: stats.yellow_cards, icon: Award, color: '#f59e0b' });
    if (stats.red_cards !== undefined) statCards.push({ label: 'Kartu Merah', value: stats.red_cards, icon: Award, color: '#ef4444' });
    if (stats.minutes_played !== undefined) statCards.push({ label: 'Menit', value: stats.minutes_played, icon: Star, color: '#8b5cf6' });
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 900, margin: '24px auto', padding: '0 16px 64px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Profil Pemain</span>
      </div>

      {/* Player Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(12, 18, 30, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: 20, padding: '28px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 240, height: 240,
          background: `radial-gradient(circle, ${posColor}10 0%, transparent 70%)`,
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          {/* Photo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={getImageUrl(player.photo_path) || avatar(player.name)}
              alt={player.name}
              style={{
                width: 100, height: 100, borderRadius: 20,
                objectFit: 'cover', border: `3px solid ${posColor}40`,
              }}
            />
            {player.jersey_number && (
              <div style={{
                position: 'absolute', bottom: -6, right: -6,
                background: posColor, borderRadius: 10, padding: '3px 10px',
                fontSize: 16, fontWeight: 800, color: '#fff',
                boxShadow: `0 4px 12px ${posColor}40`,
              }}>
                #{player.jersey_number}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 6 }}>
              {player.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {player.position && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: `${posColor}15`, border: `1px solid ${posColor}30`,
                  fontSize: 12, fontWeight: 700, color: posColor,
                }}>
                  {posLabels[player.position] || player.position}
                </span>
              )}
              {player.team && (
                <Link href={`/teams/${player.team?.uuid || player.team_id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 12, fontWeight: 600, color: '#94a3b8',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                  <Shield size={12} />
                  {player.team.name}
                </Link>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {age && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>{age} tahun</span>
                </div>
              )}
              {player.date_of_birth && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Lahir: <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                    {new Date(player.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 14 }}>Statistik Pemain</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {statCards.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 16, padding: '20px 16px', textAlign: 'center',
                transition: 'all 0.2s ease',
              }}>
                <s.icon size={20} style={{ color: s.color, margin: '0 auto 8px' }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Team Matches */}
      {matches.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', marginBottom: 14 }}>Pertandingan Tim Terbaru</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(m => {
              const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout'].includes(m.status);
              const isFinished = m.status === 'finished';
              const hasScore = isLive || isFinished;
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
                  style={{
                    display: 'flex', alignItems: 'stretch',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: 14,
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  className="hover-card"
                >
                  {/* Time / Status */}
                  <div style={{ width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {isLive ? (
                      <>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>LIVE</span>
                      </>
                    ) : isFinished ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>FT</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        {m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>
                       {m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
                    </span>
                  </div>

                  {/* Teams */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, paddingLeft: 12, minWidth: 0, borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0, borderRadius: 4 }} alt="" />
                      <span style={{ fontSize: 13, fontWeight: hasScore && m.home_score > m.away_score ? 700 : 500, color: hasScore && m.home_score > m.away_score ? '#f1f5f9' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.home_team?.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0, borderRadius: 4 }} alt="" />
                      <span style={{ fontSize: 13, fontWeight: hasScore && m.away_score > m.home_score ? 700 : 500, color: hasScore && m.away_score > m.home_score ? '#f1f5f9' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.away_team?.name}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, width: 30, flexShrink: 0, marginLeft: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: hasScore && m.home_score > m.away_score ? '#eab308' : '#94a3b8', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{hasScore ? m.home_score : '-'}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: hasScore && m.away_score > m.home_score ? '#f1f5f9' : '#94a3b8', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{hasScore ? m.away_score : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 640px) {
          .page-container {
            margin: 0 !important;
            padding: 0 12px 40px !important;
            max-width: 100% !important;
          }
        }
      `}} />
    </div>
  );
}
