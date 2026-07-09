"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Shield, Clock, Trophy } from 'lucide-react';
import { getImageUrl } from '../api';

const avatar = (name, bg = '3b82f6') => {
  if (!name) return `https://ui-avatars.com/api/?name=?&background=${bg}&color=fff&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
};

const ROUND_COLORS = [
  { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', glow: 'rgba(99,102,241,0.15)' },
  { bg: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59,130,246,0.15)' },
  { bg: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', glow: 'rgba(14,165,233,0.15)' },
  { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,158,11,0.15)' },
  { bg: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.15)' },
];

function MatchCard({ m, accentColor }) {
  const homeWinner = m.is_decided && m.winner_team?.id === m.home_team?.id;
  const awayWinner = m.is_decided && m.winner_team?.id === m.away_team?.id;
  const hasScore = m.has_game && m.game;
  const isLive = hasScore && ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.game?.status);
  const isFinished = hasScore && m.game?.status === 'finished';

  const statusBadge = (() => {
    if (!m.has_game) return null;
    if (isLive) {
      return (
        <span style={{
          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
          fontSize: 8, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
          display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.05em'
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulseDot 1.5s infinite' }} />
          LIVE
        </span>
      );
    }
    if (isFinished) {
      return (
        <span style={{
          background: 'rgba(16,185,129,0.08)', color: '#10b981',
          fontSize: 8, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em'
        }}>
          Selesai
        </span>
      );
    }
    if (m.game?.scheduled_at) {
      const time = new Date(m.game.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return (
        <span style={{
          background: 'rgba(59,130,246,0.06)', color: '#3b82f6',
          fontSize: 8, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          <Clock size={9} /> {time}
        </span>
      );
    }
    return null;
  })();

  const TeamRow = ({ team, source, isWinner, score }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 12, overflow: 'hidden',
        background: '#fff', border: `1.5px solid ${isWinner ? '#10b981' : 'var(--border-light)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: isWinner ? '0 0 0 3px rgba(16,185,129,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
      }}>
        {team ? (
          <img src={getImageUrl(team.logo_path) || avatar(team.name)} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
        ) : (
          <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>?</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 12, fontWeight: isWinner ? 800 : 600,
          color: team ? (isWinner ? '#10b981' : 'var(--text-primary)') : 'var(--text-muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
        }}>
          {team?.name || 'TBD'}
        </span>
        {!team && source && (
          <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic' }}>
            {source.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      <div style={{
        fontSize: 16, fontWeight: isWinner ? 900 : 500,
        color: isWinner ? '#10b981' : 'var(--text-muted)',
        minWidth: 20, textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {hasScore ? score : ''}
      </div>
    </div>
  );

  return (
    <div
      className="bracket-match-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        border: 'none',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 3,
        background: accentColor || 'var(--primary)',
        borderRadius: '0 0 3px 3px',
        opacity: 0.6,
      }} />

      {/* Match label + status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {m.display_label}
        </span>
        {statusBadge}
      </div>

      <TeamRow team={m.home_team} source={m.home_source} isWinner={homeWinner} score={m.game?.home_score} />

      {/* VS divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
        <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VS</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
      </div>

      <TeamRow team={m.away_team} source={m.away_source} isWinner={awayWinner} score={m.game?.away_score} />
    </div>
  );
}

function BracketConnectors({ rounds, roundRefs, containerRef }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    const calculatePaths = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPaths = [];

      for (let ri = 0; ri < rounds.length - 1; ri++) {
        const currentCards = roundRefs.current[ri];
        const nextCards = roundRefs.current[ri + 1];
        if (!currentCards || !nextCards) continue;

        for (let ni = 0; ni < nextCards.length; ni++) {
          const nextCard = nextCards[ni];
          if (!nextCard) continue;

          const pair1 = currentCards[ni * 2];
          const pair2 = currentCards[ni * 2 + 1];

          if (pair1 && nextCard) {
            const r1 = pair1.getBoundingClientRect();
            const rn = nextCard.getBoundingClientRect();
            const startX = r1.right - containerRect.left;
            const startY = r1.top + r1.height / 2 - containerRect.top;
            const endX = rn.left - containerRect.left;
            const endY = rn.top + rn.height / 2 - containerRect.top;
            const midX = startX + (endX - startX) / 2;
            newPaths.push(`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
          }

          if (pair2 && nextCard) {
            const r2 = pair2.getBoundingClientRect();
            const rn = nextCard.getBoundingClientRect();
            const startX = r2.right - containerRect.left;
            const startY = r2.top + r2.height / 2 - containerRect.top;
            const endX = rn.left - containerRect.left;
            const endY = rn.top + rn.height / 2 - containerRect.top;
            const midX = startX + (endX - startX) / 2;
            newPaths.push(`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
          }
        }
      }
      setPaths(newPaths);
    };

    const timer = setTimeout(calculatePaths, 200);
    window.addEventListener('resize', calculatePaths);
    return () => { clearTimeout(timer); window.removeEventListener('resize', calculatePaths); };
  }, [rounds, roundRefs, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--border)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--border)" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="url(#connGrad)" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function TournamentBracket({ bracketData }) {
  const containerRef = useRef(null);
  const roundRefs = useRef({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!bracketData || bracketData.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Belum Ada Bagan Knockout</h3>
        <p style={{ fontSize: 13 }}>Bagan fase gugur akan ditampilkan setelah babak grup selesai atau admin membuat bracket.</p>
      </div>
    );
  }

  const totalRounds = bracketData.length;

  // ─── MOBILE: Vertical stacked layout ───
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '8px 0' }}>
        {bracketData.map((round, ri) => {
          const isFinal = ri === totalRounds - 1 && round.matches.length === 1;
          const rc = isFinal
            ? { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,158,11,0.2)' }
            : ROUND_COLORS[ri % ROUND_COLORS.length];

          return (
            <div key={round.round}>
              {/* Round Header */}
              <div style={{
                background: rc.bg,
                padding: '12px 20px',
                borderRadius: 18,
                margin: '0 4px 14px',
                boxShadow: `0 6px 24px ${rc.glow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {isFinal && <Trophy size={18} color="#fff" />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                    {round.label}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {round.matches.length} Pertandingan
                  </div>
                </div>
              </div>

              {/* Matches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px' }}>
                {round.matches.map((m) => (
                  <MatchCard key={m.id} m={m} accentColor={rc.bg.includes('#f59e0b') ? '#f59e0b' : undefined} />
                ))}
              </div>

              {/* Connector: dotted line + circle */}
              {ri < totalRounds - 1 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 0',
                  gap: 0,
                }}>
                  <div style={{
                    width: 2, height: 16,
                    background: `linear-gradient(180deg, transparent, var(--text-muted))`,
                    opacity: 0.3,
                  }} />
                  <div style={{
                    width: 8, height: 8,
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--primary)',
                    boxShadow: '0 0 0 4px rgba(59,130,246,0.1)',
                  }} />
                  <div style={{
                    width: 2, height: 16,
                    background: `linear-gradient(180deg, var(--text-muted), transparent)`,
                    opacity: 0.3,
                  }} />
                </div>
              )}
            </div>
          );
        })}

        <style dangerouslySetInnerHTML={{ __html: `
          .bracket-match-card:active {
            transform: scale(0.98) !important;
          }
          @keyframes pulseDot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}} />
      </div>
    );
  }

  // ─── DESKTOP: Horizontal bracket layout ───
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className="hide-scrollbar"
        style={{ overflowX: 'auto', paddingBottom: 32, paddingTop: 8, position: 'relative' }}
      >
        <div style={{ display: 'flex', gap: 48, minWidth: 'max-content', padding: '0 16px', position: 'relative' }}>

          <BracketConnectors rounds={bracketData} roundRefs={roundRefs} containerRef={containerRef} />

          {bracketData.map((round, ri) => {
            const isFinal = ri === totalRounds - 1 && round.matches.length === 1;
            const rc = isFinal
              ? { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,158,11,0.2)' }
              : ROUND_COLORS[ri % ROUND_COLORS.length];

            if (!roundRefs.current[ri]) roundRefs.current[ri] = [];

            return (
              <div key={round.round} style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                {/* Round Header */}
                <div style={{
                  textAlign: 'center',
                  background: rc.bg,
                  padding: '12px 20px',
                  borderRadius: 18,
                  boxShadow: `0 6px 24px ${rc.glow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  {isFinal && <Trophy size={18} color="#fff" />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                      {round.label}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      {round.matches.length} Pertandingan
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-around', flex: 1, gap: 16,
                }}>
                  {round.matches.map((m, mi) => (
                    <div
                      key={m.id}
                      ref={el => {
                        if (!roundRefs.current[ri]) roundRefs.current[ri] = [];
                        roundRefs.current[ri][mi] = el;
                      }}
                    >
                      <MatchCard m={m} accentColor={rc.bg.includes('#f59e0b') ? '#f59e0b' : undefined} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bracket-match-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.04) !important;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}} />
    </div>
  );
}
