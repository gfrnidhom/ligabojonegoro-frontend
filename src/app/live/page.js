"use client";

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../../api';

export default function LiveMatches() {
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const response = await api.get('/live-matches');
        if (response.data.success) {
          setLiveMatches(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching live matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    
    // Poll every 15 seconds for live matches page
    const interval = setInterval(fetchLiveMatches, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Activity size={32} className="text-gradient-accent" />
        <h1>Live Action Hub</h1>
      </div>
      
      <p className="text-secondary mb-8 max-w-2xl">
        Real-time updates from all ongoing matches across Liga Bojonegoro tournaments. Scores are updated automatically.
      </p>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading live action...</p>
        </div>
      ) : liveMatches.length > 0 ? (
        <div className="grid grid-cols-2">
          {liveMatches.map((match) => (
            <div key={match.id} className="glass match-card">
              <div className="match-header">
                <span>{match.tournament?.name || 'Tournament Match'} • {match.stage || 'Group Stage'}</span>
                <div className="match-status status-live">
                  <div className="live-dot"></div>
                  <span>LIVE</span>
                </div>
              </div>
              
              <div className="match-teams">
                <div className="team">
                  <img 
                    src={match.team_home?.logo_url || 'https://ui-avatars.com/api/?name=' + (match.team_home?.name || 'Home') + '&background=0D8ABC&color=fff'} 
                    alt={match.team_home?.name} 
                    className="team-logo" 
                  />
                  <span className="team-name">{match.team_home?.name || 'Team A'}</span>
                </div>
                
                <div className="match-score">
                  <div className="score-number">{match.home_score ?? 0}</div>
                  <div className="score-divider">-</div>
                  <div className="score-number">{match.away_score ?? 0}</div>
                </div>
                
                <div className="team">
                  <img 
                    src={match.team_away?.logo_url || 'https://ui-avatars.com/api/?name=' + (match.team_away?.name || 'Away') + '&background=ff0844&color=fff'} 
                    alt={match.team_away?.name} 
                    className="team-logo" 
                  />
                  <span className="team-name">{match.team_away?.name || 'Team B'}</span>
                </div>
              </div>
              
              {match.status === 'in_progress' && (
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)] text-center text-sm text-secondary">
                  Match is currently ongoing
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Activity className="empty-icon" />
          <h3>No Live Matches</h3>
          <p className="mt-2 text-secondary">There are currently no matches being played. Check back later!</p>
        </div>
      )}
    </div>
  );
}
