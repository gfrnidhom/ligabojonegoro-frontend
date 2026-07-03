"use client";

import React from 'react';
import { Shield, Clock, Calendar } from 'lucide-react';
import { getImageUrl } from '../api';

const avatar = (name, bg = '3b82f6') => {
  if (!name) return `https://ui-avatars.com/api/?name=?&background=${bg}&color=fff&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
};

export default function TournamentBracket({ bracketData }) {
  if (!bracketData || bracketData.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Belum Ada Bagan Knockout</h3>
        <p style={{ fontSize: 13 }}>Bagan fase gugur akan ditampilkan setelah babak grup selesai atau admin membuat bracket.</p>
      </div>
    );
  }

  const getStatusBadge = (match) => {
    if (!match.has_game) return null;
    const status = match.game?.status;
    const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(status);
    const isFinished = status === 'finished';

    if (isLive) {
      return (
        <span style={{ 
          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
          border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 9, fontWeight: 800, 
          padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.05em'
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></span>
          LIVE
        </span>
      );
    }
    
    if (isFinished) {
      return (
        <span style={{ 
          background: 'var(--border-light)', color: 'var(--text-secondary)', 
          fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, letterSpacing: '0.05em'
        }}>
          FT
        </span>
      );
    }

    // Scheduled
    if (match.game?.scheduled_at) {
      const time = new Date(match.game.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return (
        <span style={{ 
          background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', 
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          <Clock size={10} /> {time}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="hide-scrollbar" style={{ overflowX: 'auto', paddingBottom: 32, paddingTop: 16 }}>
      <div style={{ display: 'flex', gap: 40, minWidth: 'max-content', padding: '0 16px' }}>
        {bracketData.map((round) => (
          <div key={round.round} style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Round Header */}
            <div style={{ 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
              color: 'white',
              padding: '12px 16px',
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.5px' }}>
                {round.label}
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>
                {round.matches.length} Match
              </div>
            </div>
            
            {/* Matches Container */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', 
              justifyContent: 'space-around', flex: 1, gap: 24 
            }}>
              {round.matches.map((m) => {
                const homeWinner = m.is_decided && m.winner_team?.id === m.home_team?.id;
                const awayWinner = m.is_decided && m.winner_team?.id === m.away_team?.id;
                const hasScore = m.has_game && m.game;

                return (
                  <div key={m.id} style={{ 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border)',
                    borderRadius: 16, 
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                  >
                    {/* Match Label Bar */}
                    <div style={{ 
                      background: 'var(--bg-card)', 
                      padding: '8px 14px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {m.display_label}
                      </span>
                      {getStatusBadge(m)}
                    </div>

                    {/* Home Team */}
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '12px 14px',
                      background: homeWinner ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {m.home_team ? (
                            <img src={getImageUrl(m.home_team.logo_path) || avatar(m.home_team.name)} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                          ) : (
                            <span style={{ fontSize: 10, color: '#cbd5e1' }}>?</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: homeWinner ? 800 : 600, 
                            color: homeWinner ? 'var(--text-primary)' : (m.home_team ? 'var(--text-primary)' : 'var(--text-muted)'),
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {m.home_team?.name || 'TBD'}
                          </span>
                          {!m.home_team && m.home_source && (
                            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.home_source.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                      {hasScore && (
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: homeWinner ? 900 : 600, 
                          color: homeWinner ? '#10b981' : 'var(--text-secondary)',
                          marginLeft: 8
                        }}>
                          {m.game.home_score}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '12px 14px',
                      background: awayWinner ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {m.away_team ? (
                            <img src={getImageUrl(m.away_team.logo_path) || avatar(m.away_team.name)} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                          ) : (
                            <span style={{ fontSize: 10, color: '#cbd5e1' }}>?</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: awayWinner ? 800 : 600, 
                            color: awayWinner ? 'var(--text-primary)' : (m.away_team ? 'var(--text-primary)' : 'var(--text-muted)'),
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {m.away_team?.name || 'TBD'}
                          </span>
                          {!m.away_team && m.away_source && (
                            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.away_source.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                      {hasScore && (
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: awayWinner ? 900 : 600, 
                          color: awayWinner ? '#10b981' : 'var(--text-secondary)',
                          marginLeft: 8
                        }}>
                          {m.game.away_score}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
