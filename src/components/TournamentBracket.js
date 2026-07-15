"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Shield, Trophy, Award } from 'lucide-react';
import { getImageUrl } from '../api';

const avatar = (name, bg = '3b82f6') => {
  if (!name) return `https://ui-avatars.com/api/?name=?&background=${bg}&color=fff&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
};

const getAbbr = (name) => {
  if (!name) return 'TBD';
  const words = name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean);
  if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  if (words.length === 2) return (words[0].substring(0, 2) + words[1][0]).toUpperCase();
  return name.substring(0, 3).toUpperCase();
};

function MatchCard({ m, badge }) {
  const homeWinner = m.is_decided && m.winner_team?.id === m.home_team?.id;
  const awayWinner = m.is_decided && m.winner_team?.id === m.away_team?.id;
  const hasScore = m.has_game && m.game;
  
  const homeScore = hasScore ? m.game?.home_score : '-';
  const awayScore = hasScore ? m.game?.away_score : '-';

  const homeAbbr = getAbbr(m.home_team?.name);
  const awayAbbr = getAbbr(m.away_team?.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        className="bracket-match-card"
        style={{
          width: 120,
          background: '#fff',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'default',
        }}
      >
        {/* Logos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', border: '1px solid #f3f4f6' }} alt="" />
          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', border: '1px solid #f3f4f6' }} alt="" />
        </div>

        {/* Info Container */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
          
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
            <span style={{ 
              fontWeight: homeWinner ? 800 : (awayWinner ? 400 : 600), 
              color: awayWinner ? '#9ca3af' : '#374151',
              textDecoration: awayWinner ? 'line-through' : 'none',
              letterSpacing: '0.5px'
            }}>{homeAbbr}</span>
            <span style={{ 
              fontWeight: homeWinner ? 800 : (awayWinner ? 400 : 600),
              color: awayWinner ? '#9ca3af' : '#111827',
              marginTop: 4,
              fontSize: 11
            }}>{homeScore}</span>
          </div>

          {/* Divider */}
          <div style={{ fontSize: 10, color: '#d1d5db', marginBottom: -14 }}>-</div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
            <span style={{ 
              fontWeight: awayWinner ? 800 : (homeWinner ? 400 : 600), 
              color: homeWinner ? '#9ca3af' : '#374151',
              textDecoration: homeWinner ? 'line-through' : 'none',
              letterSpacing: '0.5px'
            }}>{awayAbbr}</span>
            <span style={{ 
              fontWeight: awayWinner ? 800 : (homeWinner ? 400 : 600),
              color: homeWinner ? '#9ca3af' : '#111827',
              marginTop: 4,
              fontSize: 11
            }}>{awayScore}</span>
          </div>

        </div>
      </div>

      {badge && (
        <div style={{ 
          marginTop: 6, 
          fontSize: 8, 
          fontWeight: 800, 
          color: badge === 'FINAL' ? '#b45309' : '#1d4ed8', 
          background: badge === 'FINAL' ? '#fef3c7' : '#dbeafe', 
          padding: '2px 8px', 
          borderRadius: 12,
          letterSpacing: '0.05em'
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}

function SymmetricalConnectors({ leftRounds, rightRounds, leftRefs, rightRefs, centerRefs, containerRef }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    const calculatePaths = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPaths = [];

      const drawPath = (el1, el2, direction) => {
        const r1 = el1.getBoundingClientRect();
        const r2 = el2.getBoundingClientRect();
        let startX, startY, endX, endY, midX;

        if (direction === 'leftToRight') {
          startX = r1.right - containerRect.left;
          startY = r1.top + r1.height / 2 - containerRect.top;
          endX = r2.left - containerRect.left;
          endY = r2.top + r2.height / 2 - containerRect.top;
        } else {
          startX = r1.left - containerRect.left;
          startY = r1.top + r1.height / 2 - containerRect.top;
          endX = r2.right - containerRect.left;
          endY = r2.top + r2.height / 2 - containerRect.top;
        }
        midX = startX + (endX - startX) / 2;
        return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      };

      // Left Bracket Paths
      for (let ri = 0; ri < leftRounds.length - 1; ri++) {
        const currentCards = leftRefs.current[ri];
        const nextCards = leftRefs.current[ri + 1];
        if (!currentCards || !nextCards) continue;
        for (let ni = 0; ni < nextCards.length; ni++) {
          const nextCard = nextCards[ni];
          const pair1 = currentCards[ni * 2];
          const pair2 = currentCards[ni * 2 + 1];
          if (pair1 && nextCard) newPaths.push(drawPath(pair1, nextCard, 'leftToRight'));
          if (pair2 && nextCard) newPaths.push(drawPath(pair2, nextCard, 'leftToRight'));
        }
      }

      // Right Bracket Paths
      for (let ri = 0; ri < rightRounds.length - 1; ri++) {
        const currentCards = rightRefs.current[ri];
        const nextCards = rightRefs.current[ri + 1];
        if (!currentCards || !nextCards) continue;
        for (let ni = 0; ni < nextCards.length; ni++) {
          const nextCard = nextCards[ni];
          const pair1 = currentCards[ni * 2];
          const pair2 = currentCards[ni * 2 + 1];
          if (pair1 && nextCard) newPaths.push(drawPath(pair1, nextCard, 'rightToLeft'));
          if (pair2 && nextCard) newPaths.push(drawPath(pair2, nextCard, 'rightToLeft'));
        }
      }

      // Connect to Center (Final)
      const finalCard = centerRefs.current[0];
      if (finalCard) {
        if (leftRounds.length > 0) {
          const lastLeft = leftRefs.current[leftRounds.length - 1]?.[0];
          if (lastLeft) newPaths.push(drawPath(lastLeft, finalCard, 'leftToRight'));
        }
        if (rightRounds.length > 0) {
          const lastRight = rightRefs.current[rightRounds.length - 1]?.[0];
          if (lastRight) newPaths.push(drawPath(lastRight, finalCard, 'rightToLeft'));
        }
      }

      setPaths(newPaths);
    };

    const timer = setTimeout(calculatePaths, 200);
    window.addEventListener('resize', calculatePaths);
    return () => { clearTimeout(timer); window.removeEventListener('resize', calculatePaths); };
  }, [leftRounds, rightRounds, leftRefs, rightRefs, centerRefs, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#d1d5db" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export default function TournamentBracket({ bracketData }) {
  const containerRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});
  const centerRefs = useRef({});
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

  // --- Data Partitioning ---
  const totalRounds = bracketData.length;
  const prelims = bracketData.slice(0, totalRounds - 1);
  const finalsRound = bracketData[totalRounds - 1]; // Assume last is final/bronze

  const leftRounds = prelims.map(r => ({
    ...r,
    matches: r.matches.slice(0, Math.ceil(r.matches.length / 2))
  }));

  const rightRounds = prelims.map(r => ({
    ...r,
    matches: r.matches.slice(Math.ceil(r.matches.length / 2))
  }));

  const finalMatch = finalsRound?.matches.find(m => m.display_label === 'Final' || m.match_order === 1) || finalsRound?.matches[0];
  const bronzeMatch = finalsRound?.matches.find(m => m.display_label !== 'Final' && m.match_order !== 1 && m !== finalMatch);

  // --- MOBILE: Vertical Stacked ---
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
        {bracketData.map((round, ri) => (
          <div key={round.round}>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {round.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {round.matches.map((m) => (
                <MatchCard key={m.id} m={m} badge={m === finalMatch ? 'FINAL' : (m === bronzeMatch ? 'BRONZE' : null)} />
              ))}
            </div>
          </div>
        ))}
        <style dangerouslySetInnerHTML={{ __html: `
          .bracket-match-card:active { transform: scale(0.98); }
        `}} />
      </div>
    );
  }

  // --- DESKTOP: Symmetrical FotMob Layout ---
  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }} className="hide-scrollbar">
      <div
        ref={containerRef}
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 60, 
          minWidth: 'max-content', 
          padding: '24px 40px 60px', 
          position: 'relative',
          margin: '0 auto'
        }}
      >
        <SymmetricalConnectors 
          leftRounds={leftRounds} 
          rightRounds={rightRounds} 
          leftRefs={leftRefs} 
          rightRefs={rightRefs} 
          centerRefs={centerRefs} 
          containerRef={containerRef} 
        />

        {/* LEFT WING */}
        {leftRounds.map((round, ri) => {
          if (!leftRefs.current[ri]) leftRefs.current[ri] = [];
          return (
            <div key={`left-${round.round}`} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{round.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: 24 }}>
                {round.matches.map((m, mi) => (
                  <div key={m.id} ref={el => leftRefs.current[ri][mi] = el}>
                    <MatchCard m={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* CENTER (Finals) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, padding: '0 20px' }}>
          {/* Champion Trophy Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40, opacity: 0.8 }}>
            <Trophy size={48} color="#d1d5db" strokeWidth={1} style={{ marginBottom: 12 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.15em' }}>CHAMPION</span>
          </div>

          {/* Final Match */}
          {finalMatch && (
            <div ref={el => centerRefs.current[0] = el} style={{ marginBottom: 40 }}>
              <MatchCard m={finalMatch} badge="FINAL" />
            </div>
          )}

          {/* Bronze Match */}
          {bronzeMatch && (
            <div ref={el => centerRefs.current[1] = el}>
              <MatchCard m={bronzeMatch} badge="BRONZE-FINAL" />
            </div>
          )}
        </div>

        {/* RIGHT WING */}
        {[...rightRounds].reverse().map((round, reverseIndex) => {
          // ri is the original index in rightRounds array
          const ri = rightRounds.length - 1 - reverseIndex;
          if (!rightRefs.current[ri]) rightRefs.current[ri] = [];
          return (
            <div key={`right-${round.round}`} style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{round.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: 24 }}>
                {round.matches.map((m, mi) => (
                  <div key={m.id} ref={el => rightRefs.current[ri][mi] = el}>
                    <MatchCard m={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bracket-match-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #d1d5db !important;
        }
      `}} />
    </div>
  );
}
