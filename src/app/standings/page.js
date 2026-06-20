"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ChevronDown, BarChart3, Search } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function StandingsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const avatar = (name, bg = '3b82f6') => {
    if (!name) return `https://ui-avatars.com/api/?name=T&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments');
        if (res.data.success) {
          setTournaments(res.data.data);
          // Auto-select first tournament
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

    const fetchStandings = async () => {
      try {
        setLoadingStandings(true);
        const res = await api.get(`/standings/${selectedTournament.uuid || selectedTournament.id}`);
        if (res.data.success) {
          setStandings(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
        setStandings(null);
      } finally {
        setLoadingStandings(false);
      }
    };
    fetchStandings();
  }, [selectedTournament]);

  // Get dynamic labels from scoring_info
  const scoringInfo = standings?.scoring_info || {};
  const goalsLabel = scoringInfo.goals_label || { for: 'GF', against: 'GA', diff: 'GD' };

  // Map labels to Indonesian for legend
  const goalsLabelMap = {
    'GF': 'Gol Memasukkan', 'GA': 'Gol Kemasukan', 'GD': 'Selisih Gol',
    'SW': 'Set Menang', 'SL': 'Set Kalah', 'SD': 'Selisih Set',
    'PW': 'Partai Menang', 'PL': 'Partai Kalah', 'PD': 'Selisih Partai',
  };

  const renderTable = (rows, title) => (
    <div style={{ marginBottom: 24 }}>
      {title && (
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: '#3b82f6' }} />
          {title}
        </h3>
      )}
      <div style={{
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Tim</th>
                <th style={thStyle}>M</th>
                <th style={thStyle}>M</th>
                <th style={thStyle}>S</th>
                <th style={thStyle}>K</th>
                <th style={thStyle}>{goalsLabel.for}</th>
                <th style={thStyle}>{goalsLabel.against}</th>
                <th style={thStyle}>{goalsLabel.diff}</th>
                <th style={{ ...thStyle, color: '#3b82f6' }}>Poin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const pos = row.position || idx + 1;
                const isTop = pos <= 2;
                const gd = (row.goals_for || 0) - (row.goals_against || 0);
                return (
                  <tr
                    key={row.team?.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{
                      ...tdStyle, fontWeight: 800,
                      color: isTop ? '#10b981' : '#f1f5f9',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isTop ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isTop ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}`,
                        fontSize: 12,
                      }}>
                        {pos}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>
                      <Link href={`/teams/${row.team?.uuid || row.team?.id}`} style={{
                        display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                      }}>
                        <img
                          src={getImageUrl(row.team?.logo_path) || avatar(row.team?.name)}
                          style={{ width: 26, height: 26, borderRadius: '50%' }}
                          alt={row.team?.name || ''}
                        />
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>{row.team?.name}</span>
                      </Link>
                    </td>
                    <td style={tdStyle}>{row.played || 0}</td>
                    <td style={{ ...tdStyle, color: '#10b981' }}>{row.won || 0}</td>
                    <td style={tdStyle}>{row.drawn || 0}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{row.lost || 0}</td>
                    <td style={tdStyle}>{row.goals_for || 0}</td>
                    <td style={tdStyle}>{row.goals_against || 0}</td>
                    <td style={{
                      ...tdStyle, fontWeight: 700,
                      color: gd > 0 ? '#10b981' : gd < 0 ? '#ef4444' : '#94a3b8',
                    }}>
                      {gd > 0 ? '+' : ''}{gd}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#3b82f6', fontSize: 15 }}>{row.points || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px 64px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(54, 43, 31, 0.95) 0%, rgba(26, 21, 16, 0.95) 100%)',
        border: '1px solid rgba(133, 98, 62, 0.25)',
        borderRadius: 20, padding: '32px 28px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(204,162,107,0.08) 0%, transparent 70%)' }} />
        <BarChart3 size={40} style={{ color: '#cca26b', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>Klasemen</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 600 }}>
          Pantau peringkat, poin, dan statistik terkini dari seluruh tim yang berkompetisi di turnamen Liga Bojonegoro.
        </p>
      </div>

      {/* Tournament Selector */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24,
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {tournaments.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTournament(t)}
            style={{
              padding: '9px 18px', fontSize: 12, fontWeight: 700, borderRadius: 24,
              border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              background: selectedTournament?.id === t.id ? 'rgba(204, 162, 107, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedTournament?.id === t.id ? '#cca26b' : '#94a3b8',
              borderColor: selectedTournament?.id === t.id ? '#cca26b' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat turnamen...</p>
        </div>
      ) : !selectedTournament ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
          <Trophy size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Belum ada turnamen tersedia.</p>
        </div>
      ) : loadingStandings ? (
        <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat klasemen...</p>
        </div>
      ) : !standings ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
          <BarChart3 size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Klasemen belum tersedia untuk turnamen ini.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Klasemen akan muncul setelah pertandingan dimulai.</p>
        </div>
      ) : standings.type === 'grouped' ? (
        <div>
          {standings.groups?.map((group, gi) => (
            renderTable(group.standings || [], group.group?.name || `Grup ${gi + 1}`)
          ))}
        </div>
      ) : (
        renderTable(standings.standings || [], null)
      )}

      {/* Legend */}
      {standings && (
        <div style={{
          marginTop: 16,
          display: 'flex', flexWrap: 'wrap', gap: 20,
          fontSize: 11, color: '#64748b', fontWeight: 500,
        }}>
          <span>M = Main</span>
          <span style={{ color: '#10b981' }}>M = Menang</span>
          <span>S = Seri</span>
          <span style={{ color: '#ef4444' }}>K = Kalah</span>
          <span>{goalsLabel.for} = {goalsLabelMap[goalsLabel.for] || goalsLabel.for}</span>
          <span>{goalsLabel.against} = {goalsLabelMap[goalsLabel.against] || goalsLabel.against}</span>
          <span>{goalsLabel.diff} = {goalsLabelMap[goalsLabel.diff] || goalsLabel.diff}</span>
          {scoringInfo.point_system === 'scaled' && scoringInfo.point_rules && (
            <span style={{ color: '#cca26b', fontWeight: 600 }}>
              Sistem poin: {scoringInfo.point_rules.filter(r => r.condition === 'win').map(r => {
                const detail = r.opponent_score !== undefined ? `(lawan ${r.opponent_score} set)` : '';
                return `Menang ${detail} = ${r.points}pt`;
              }).join(', ')}
            </span>
          )}
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

const thStyle = {
  padding: '12px 10px',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 10px',
  fontSize: 13,
  color: '#94a3b8',
  textAlign: 'center',
  fontWeight: 500,
};
