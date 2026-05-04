"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, MapPin, Trophy, Users, Calendar } from 'lucide-react';
import api from '../../../api';

export default function TeamDetailPage({ params }) {
  const unwrappedParams = use(params);
  const teamId = unwrappedParams.id;
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches, info

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  const avatar = (name, bg = '3b82f6') => {
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
          const matched = tRes.data.data.find(t => String(t.id) === String(teamId));
          if (matched) {
            setTeam(matched);
          }
        }

        // Fetch matches involving this team
        const mRes = await api.get('/matches', { params: { per_page: 100 } });
        if (mRes.data.success) {
          const teamMatches = mRes.data.data.filter(
            m => String(m.home_team_id) === String(teamId) || String(m.away_team_id) === String(teamId)
          );
          setMatches(teamMatches);
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
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat detail tim...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
        <Shield size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Tim Tidak Ditemukan</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, marginBottom: 18 }}>Maaf, tim yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px 64px' }}>
      {/* Top action bar */}
      <div className="team-action-bar" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%',
            width: 40, height: 40,
            cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Detail Tim</span>
      </div>

      {/* Team Profile Header Card */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 640px) {
          .page-container {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .team-action-bar {
            padding: 12px 16px !important;
            margin-bottom: 0 !important;
          }
          .team-header-profile {
            border-radius: 0 !important;
            border-left: 0 !important;
            border-right: 0 !important;
            padding: 16px !important;
            margin-bottom: 12px !important;
          }
        }
      `}} />
      <div className="card team-header-profile" style={{ marginBottom: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img 
              src={getImageUrl(team.logo_path || team.logo) || avatar(team.name, '3b82f6')} 
              style={{ width: 48, height: 48, objectFit: 'contain' }}
              alt={team.name}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{team.name}</h1>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid',
                background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.25)',
              }}>
                {team.sport?.name || 'Cabang Umum'}
              </span>
            </div>

            <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, marginBottom: 10, maxWidth: 800 }}>
              {team.description || 'Ini adalah tim resmi yang berkompetisi di platform Liga Bojonegoro.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <Users size={14} style={{ color: '#3b82f6' }} />
                <span>Coach / PIC: <strong style={{ color: '#94a3b8' }}>{team.coach_name || team.contact_person || 'TBA'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <MapPin size={14} style={{ color: '#ef4444' }} />
                <span>Asal: <strong style={{ color: '#94a3b8' }}>{team.address || 'Bojonegoro'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('matches')}
          style={{
            padding: '12px 6px', fontSize: 13, fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === 'matches' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'matches' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease', position: 'relative', bottom: -1,
          }}
        >
          Riwayat Pertandingan ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '12px 6px', fontSize: 13, fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === 'info' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'all 0.2s ease', position: 'relative', bottom: -1,
          }}
        >
          Profil Lengkap
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 300 }}>
        {activeTab === 'matches' && (
          <div>
            {matches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matches.map(m => {
                  const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                  const isFinished = m.status === 'finished';
                  const hasScore = isLive || isFinished;
                  return (
                    <div 
                      key={m.id} 
                      className="card"
                      onClick={() => router.push(`/matches/${m.id}`)}
                      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, cursor: 'pointer' }}
                    >
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                            background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                            color: isLive ? '#ef4444' : '#64748b',
                            border: '1px solid',
                            borderColor: isLive ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)',
                            textTransform: 'uppercase'
                          }}>
                            {isLive ? 'LIVE' : m.status || 'Belum Mulai'}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{m.match_date ? new Date(m.match_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal TBA'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{m.home_team?.name}</span>
                          </div>
                          <div style={{ padding: '0 8px', minWidth: 40, textAlign: 'center', fontSize: 15, fontWeight: 800, color: hasScore ? '#3b82f6' : '#64748b' }}>
                            {hasScore ? `${m.home_score} : ${m.away_score}` : 'VS'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{m.away_team?.name}</span>
                            <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%' }} alt="" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Belum ada pertandingan terdaftar untuk tim ini.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>Informasi Profil Tim</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              Tim <strong>{team.name}</strong> didirikan dan berkompetisi di Bojonegoro. Tim ini aktif berpartisipasi dalam ajang olahraga resmi yang terdaftar di sistem Liga Bojonegoro.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Nama Tim</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{team.name}</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Cabang Olahraga</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{team.sport?.name || 'Cabang Umum'}</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Coach / PIC</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{team.coach_name || team.contact_person || 'TBA'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
