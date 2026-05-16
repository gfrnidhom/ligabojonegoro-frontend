"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, ChevronDown } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');

  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=P&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=200`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pRes, tRes] = await Promise.all([
          api.get('/players', { params: { per_page: 200 } }),
          api.get('/teams'),
        ]);
        if (pRes.data.success) setPlayers(pRes.data.data);
        if (tRes.data.success) setTeams(tRes.data.data);
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = players.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchTeam = !teamFilter || String(p.team_id) === teamFilter;
    const matchPos = !posFilter || p.position === posFilter;
    return matchSearch && matchTeam && matchPos;
  });

  const positions = [...new Set(players.map(p => p.position).filter(Boolean))];
  const posLabels = { GK: 'Kiper', DF: 'Bek', MF: 'Gelandang', FW: 'Penyerang' };

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px 64px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(12, 18, 30, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: 20,
        padding: '32px 28px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        <Users size={40} style={{ color: '#3b82f6', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>Daftar Pemain</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 600 }}>
          Temukan profil, statistik, dan informasi lengkap seluruh pemain yang terdaftar di Liga Bojonegoro.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16, padding: '16px 20px',
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama pemain..."
            style={{
              width: '100%', padding: '11px 14px 11px 40px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, color: '#f1f5f9', fontSize: 13, fontWeight: 500,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        <select
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
          style={{
            padding: '11px 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
            color: '#f1f5f9', fontSize: 13, fontWeight: 500, outline: 'none',
            fontFamily: 'inherit', minWidth: 180, cursor: 'pointer',
          }}
        >
          <option value="">Semua Tim</option>
          {teams.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
        <select
          value={posFilter}
          onChange={e => setPosFilter(e.target.value)}
          style={{
            padding: '11px 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
            color: '#f1f5f9', fontSize: 13, fontWeight: 500, outline: 'none',
            fontFamily: 'inherit', minWidth: 160, cursor: 'pointer',
          }}
        >
          <option value="">Semua Posisi</option>
          {positions.map(pos => <option key={pos} value={pos}>{posLabels[pos] || pos}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 16 }}>
        {filtered.length} pemain ditemukan
      </div>

      {/* Players Grid */}
      {loading ? (
        <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat data pemain...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(player => {
            const posColor = { GK: '#f59e0b', DF: '#10b981', MF: '#3b82f6', FW: '#ef4444' }[player.position] || '#64748b';
            return (
              <Link href={`/players/${player.uuid || player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 16, padding: '20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={getImageUrl(player.photo_path) || avatar(player.name)}
                      alt={player.name}
                      style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }}
                    />
                    {player.jersey_number && (
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        background: '#0f172a', border: '2px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '1px 6px',
                        fontSize: 11, fontWeight: 800, color: '#f1f5f9',
                      }}>
                        {player.jersey_number}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {player.team && (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                          {player.team.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Position badge */}
                  {player.position && (
                    <div style={{
                      padding: '4px 10px', borderRadius: 8,
                      background: `${posColor}15`, border: `1px solid ${posColor}30`,
                      fontSize: 11, fontWeight: 700, color: posColor,
                      flexShrink: 0,
                    }}>
                      {posLabels[player.position] || player.position}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Tidak ada pemain ditemukan.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Coba ubah filter pencarian Anda.</p>
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
        select option {
          background: #1e293b;
          color: #f1f5f9;
        }
      `}} />
    </div>
  );
}
