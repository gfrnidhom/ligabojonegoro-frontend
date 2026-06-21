"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Filter, Search, ChevronRight, Clock, Trophy, Maximize2 } from 'lucide-react';
import api, { getImageUrl } from '../../api';
import MatchDetailPanel from '../../components/MatchDetailPanel';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, live, scheduled, finished
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=T&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mRes, tRes] = await Promise.all([
          api.get('/matches', { params: { per_page: 500 } }), // Get more for the index
          api.get('/tournaments'),
        ]);
        if (mRes.data.success) {
          // Sort by date, newest first or live first
          const sorted = (mRes.data.data || []).sort((a, b) => {
            const isALive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout'].includes(a.status);
            const isBLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout'].includes(b.status);
            if (isALive && !isBLive) return -1;
            if (!isALive && isBLive) return 1;
            return new Date(b.scheduled_at) - new Date(a.scheduled_at);
          });
          setMatches(sorted);
        }
        if (tRes.data.success) setTournaments(tRes.data.data || []);
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMatches = matches.filter(m => {
    // Status
    if (statusFilter === 'live' && !['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status)) return false;
    if (statusFilter === 'scheduled' && m.status !== 'scheduled') return false;
    if (statusFilter === 'finished' && m.status !== 'finished') return false;
    
    // Tournament
    if (tournamentFilter && String(m.tournament_id) !== tournamentFilter && String(m.tournament?.uuid) !== tournamentFilter) return false;
    
    // Date
    if (dateFilter) {
      if (!m.scheduled_at) return false;
      const mDate = new Date(m.scheduled_at).toLocaleDateString('en-CA');
      if (mDate !== dateFilter) return false;
    }
    
    return true;
  });

  // Group by date
  const groupedMatches = filteredMatches.reduce((acc, m) => {
    const dateStr = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum Ditentukan';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(m);
    return acc;
  }, {});

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1320, margin: '24px auto', padding: '0 16px 64px' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(12, 18, 30, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: 20, padding: '32px 28px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        <CalendarIcon size={40} style={{ color: '#3b82f6', marginBottom: 12 }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>Jadwal & Hasil</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 600 }}>
          Lihat seluruh jadwal pertandingan mendatang dan hasil pertandingan yang telah selesai dari berbagai turnamen.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16, padding: '16px 20px',
      }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-select-dark"
        >
          <option value="all">Semua Status</option>
          <option value="live">Sedang Berlangsung (LIVE)</option>
          <option value="scheduled">Jadwal Mendatang</option>
          <option value="finished">Selesai</option>
        </select>
        
        <select
          value={tournamentFilter}
          onChange={e => setTournamentFilter(e.target.value)}
          className="form-select-dark"
        >
          <option value="">Semua Turnamen</option>
          {tournaments.map(t => <option key={t.id} value={String(t.uuid || t.id)}>{t.name}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '0 12px' }}>
          <CalendarIcon size={14} color="#94a3b8" />
          <input 
            type="date" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ 
              background: 'transparent', border: 'none', color: '#f1f5f9', 
              padding: '11px 0', outline: 'none', fontSize: 11, fontFamily: 'inherit'
            }}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Batal</button>
          )}
        </div>
      </div>

      {/* Results & Detail Split Layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loader"></div>
              <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 11, fontWeight: 500 }}>Memuat pertandingan...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div style={{ padding: '64px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Filter size={40} style={{ color: '#475569', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Tidak Ada Pertandingan</h3>
              <p style={{ color: '#94a3b8', fontSize: 12 }}>Coba sesuaikan filter Anda untuk melihat hasil lainnya.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {Object.entries(groupedMatches).map(([dateLabel, dayMatches]) => (
                <div key={dateLabel}>
                  <h2 style={{ 
                    fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12,
                    borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <div style={{ width: 4, height: 16, background: '#3b82f6', borderRadius: 2 }} />
                    {dateLabel}
                  </h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {dayMatches.map(m => {
                      const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                      const isFinished = m.status === 'finished';
                      const hasScore = isLive || isFinished;
                      const time = m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBA';
                      const isSelected = selectedMatchId === (m.uuid || m.id);
                      
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                              router.push(`/matches/${m.uuid || m.id}`);
                            } else {
                              setSelectedMatchId(m.uuid || m.id);
                            }
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                            borderRadius: 20,
                            padding: '20px 16px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isSelected ? '0 8px 32px rgba(59, 130, 246, 0.25), inset 0 0 0 1px rgba(59, 130, 246, 0.2)' : '0 4px 16px rgba(0,0,0,0.2)',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, width: '100%' }}>
                            {isLive ? (
                              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em', animation: 'pulseGlow 2s infinite' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
                                LIVE
                              </div>
                            ) : isFinished ? (
                              <div style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                SELESAI
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>
                                {time}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} alt="" />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', textAlign: 'center', lineHeight: 1.3 }}>{m.home_team?.name}</span>
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
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{m.home_score}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>-</span>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{m.away_score}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>VS</span>
                                )}
                              </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 56, height: 56, position: 'relative', marginBottom: 12 }}>
                                <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name, 'ef4444')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} alt="" />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc', textAlign: 'center', lineHeight: 1.3 }}>{m.away_team?.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <aside style={{ width: 440, flexShrink: 0 }} className="hidden lg:block">
          <div style={{ position: 'sticky', top: 88, maxHeight: 'calc(100vh - 104px)', overflowY: 'auto', paddingRight: 4, paddingBottom: 24 }} className="sidebar-scroll">
            {selectedMatchId ? (
              <div className="animate-slide-right">
                <MatchDetailPanel matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
              </div>
            ) : (
              <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', padding: '40px 24px', textAlign: 'center' }}>
                <Trophy size={48} style={{ color: '#475569', margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Pilih Pertandingan</h3>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>Klik salah satu pertandingan di daftar untuk melihat detail lengkap, statistik, dan susunan pemain di sini.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .form-select-dark {
          padding: 11px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          color: #f1f5f9; font-size: 11px; font-weight: 500; outline: none;
          font-family: inherit; min-width: 180px; cursor: pointer;
          flex: 1 1 auto;
        }
        .form-select-dark option { background: #0f172a; color: #f1f5f9; }
        
        @media (max-width: 640px) {
          .page-container { margin: 0 !important; padding: 0 12px 40px !important; max-width: 100% !important; }
        }
      `}} />
    </div>
  );
}
