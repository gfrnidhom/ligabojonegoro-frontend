"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { getImageUrl } from '../api';

export default function TournamentBracket({ matches }) {
  // Sort matches into rounds (8, 4, 2, 1)
  const knockoutRounds = [16, 8, 4, 2, 1];
  const roundsData = knockoutRounds.map(r => {
    return {
      round: r,
      label: r === 8 ? 'Quarter Finals' : r === 4 ? 'Semi Finals' : r === 2 ? 'Final' : r === 1 ? '3rd Place' : `Round of ${r}`,
      matches: matches.filter(m => m.round === r).sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    };
  }).filter(rd => rd.matches.length > 0);

  if (roundsData.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
        <Shield size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
        <p>Belum ada data bagan fase gugur.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
      <div style={{ display: 'flex', gap: 40, minWidth: roundsData.length * 280 }}>
        {roundsData.map((rd, rdIdx) => (
          <div key={rd.round} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ 
              textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#94a3b8', 
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 
            }}>
              {rd.label}
            </div>
            
            <div style={{ 
              display: 'flex', flexDirection: 'column', 
              justifyContent: 'space-around', flex: 1, gap: 20 
            }}>
              {rd.matches.map((m) => (
                <div key={m.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: 12, position: 'relative', width: 240
                }}>
                  {/* Home Team */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <img src={getImageUrl(m.home_team?.logo_path)} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                      <span style={{ 
                        fontSize: 10, fontWeight: m.home_score > m.away_score ? 800 : 500, 
                        color: m.home_score > m.away_score ? '#f8fafc' : '#94a3b8',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {m.home_team?.name || 'TBD'}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#eab308' }}>
                      {m.status === 'finished' ? m.home_score : '-'}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <img src={getImageUrl(m.away_team?.logo_path)} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                      <span style={{ 
                        fontSize: 10, fontWeight: m.away_score > m.home_score ? 800 : 500, 
                        color: m.away_score > m.home_score ? '#f8fafc' : '#94a3b8',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {m.away_team?.name || 'TBD'}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#eab308' }}>
                      {m.status === 'finished' ? m.away_score : '-'}
                    </span>
                  </div>

                  {/* Connector lines logic could go here for a more complex SVG bracket */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
