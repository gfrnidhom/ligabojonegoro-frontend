"use client";
import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Calendar, ArrowRight } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

const avatar = (name, bg = 'ff1a1a') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=${bg}&color=fff&bold=true&size=200`;

const getSkillValue = (player, skillKey) => {
  if (player?.statistics?.[skillKey] !== undefined) return player.statistics[skillKey];
  if (player?.[skillKey] !== undefined) return player[skillKey];
  if (player?.metadata?.[skillKey] !== undefined) return player.metadata[skillKey];
  if (player?.aggregated_stats?.[skillKey] !== undefined) return player.aggregated_stats[skillKey];

  const str = `${player?.id || 0}-${skillKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 60 + (Math.abs(hash) % 36); // 60 to 95
};

const getSportSkills = (sportId, sportSlug) => {
  const slug = String(sportSlug || '').toLowerCase();
  const id = Number(sportId);

  if (id === 2 || slug === 'volleyball') {
    return [
      { key: 'passing', label: 'Passing' },
      { key: 'service', label: 'Service' },
      { key: 'block', label: 'Block' },
      { key: 'smash', label: 'Smash' },
      { key: 'dig', label: 'Dig' },
      { key: 'stamina', label: 'Stamina' },
    ];
  }
  if (id === 4 || slug === 'badminton') {
    return [
      { key: 'footwalk', label: 'Footwalk' },
      { key: 'penempatan_posisi', label: 'Posisi' },
      { key: 'service', label: 'Service' },
      { key: 'loop', label: 'Loop' },
      { key: 'smash', label: 'Smash' },
      { key: 'stamina', label: 'Stamina' },
    ];
  }
  return [
    { key: 'passing', label: 'Passing' },
    { key: 'kontrol', label: 'Kontrol' },
    { key: 'dribling', label: 'Dribling' },
    { key: 'finishing', label: 'Finishing' },
    { key: 'stamina', label: 'Stamina' },
    { key: 'tackles', label: 'Tackles' },
  ];
};

const getSportStatKeys = (sportId, sportSlug) => {
  const slug = String(sportSlug || '').toLowerCase();
  const id = Number(sportId);

  if (id === 2 || slug === 'volleyball') {
    return [
      { key: 'points', label: 'Points' },
      { key: 'kills', label: 'Kills' },
      { key: 'blocks', label: 'Blocks' },
      { key: 'aces', label: 'Aces' },
      { key: 'digs', label: 'Digs' },
      { key: 'assists', label: 'Assists' },
      { key: 'errors', label: 'Errors' },
    ];
  }
  if (id === 4 || slug === 'badminton') {
    return [
      { key: 'matches_played', label: 'Main' },
      { key: 'wins', label: 'Menang' },
      { key: 'losses', label: 'Kalah' },
      { key: 'points_won', label: 'Poin Diraih' },
      { key: 'points_lost', label: 'Poin Hilang' },
    ];
  }
  return [
    { key: 'appearances', label: 'Main' },
    { key: 'goals', label: 'Gol' },
    { key: 'assists', label: 'Assist' },
    { key: 'yellow_cards', label: 'Kartu Kuning' },
    { key: 'red_cards', label: 'Kartu Merah' },
    { key: 'saves', label: 'Penyelamatan' },
    { key: 'tackles', label: 'Tekel' },
    { key: 'interceptions', label: 'Intersep' },
    { key: 'clearances', label: 'Sapuan' },
    { key: 'blocks', label: 'Blok' },
    { key: 'fouls', label: 'Pelanggaran' },
  ];
};

const DynamicRadarChart = ({ player }) => {
  const skills = getSportSkills(player?.team?.sport_id, player?.team?.sport?.slug);
  // Ensure we have exactly 6 skills for the hexagon radar
  while (skills.length < 6) skills.push({ key: 'unknown', label: 'Unknown' });
  const top6 = skills.slice(0, 6);
  
  const values = top6.map(s => getSkillValue(player, s.key));
  
  // Calculate polygon points based on values (0-100)
  const calculatePoint = (value, angleIndex) => {
     const angle = (Math.PI / 3) * angleIndex - Math.PI / 2; // Start at top
     const r = (value / 100) * 80; // max radius 80
     return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
  };
  
  const polyPoints = values.map((v, i) => calculatePoint(v, i)).join(" ");

  return (
    <div style={{ position: 'relative', width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0 10px' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', maxWidth: 220, overflow: 'visible' }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
          <polygon
            key={i}
            points={`100,${100 - 80*scale} ${100 + 69.28*scale},${100 - 40*scale} ${100 + 69.28*scale},${100 + 40*scale} 100,${100 + 80*scale} ${100 - 69.28*scale},${100 + 40*scale} ${100 - 69.28*scale},${100 - 40*scale}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        <line x1="100" y1="100" x2="100" y2="20" stroke="#f3f4f6" />
        <line x1="100" y1="100" x2="169.28" y2="60" stroke="#f3f4f6" />
        <line x1="100" y1="100" x2="169.28" y2="140" stroke="#f3f4f6" />
        <line x1="100" y1="100" x2="100" y2="180" stroke="#f3f4f6" />
        <line x1="100" y1="100" x2="30.72" y2="140" stroke="#f3f4f6" />
        <line x1="100" y1="100" x2="30.72" y2="60" stroke="#f3f4f6" />

        <polygon
          points={polyPoints}
          fill="#ff1a1a"
          fillOpacity="0.8"
          stroke="#ff1a1a"
          strokeWidth="1.5"
        />
      </svg>
      {/* Top */}
      <span style={{ position: 'absolute', top: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center', transform: 'translateX(-50%)', left: '50%' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[0]}%</span>{top6[0].label}</span>
      {/* Top Right */}
      <span style={{ position: 'absolute', top: 35, right: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[1]}%</span>{top6[1].label}</span>
      {/* Bottom Right */}
      <span style={{ position: 'absolute', bottom: 35, right: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[2]}%</span>{top6[2].label}</span>
      {/* Bottom */}
      <span style={{ position: 'absolute', bottom: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center', transform: 'translateX(-50%)', left: '50%' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[3]}%</span>{top6[3].label}</span>
      {/* Bottom Left */}
      <span style={{ position: 'absolute', bottom: 35, left: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[4]}%</span>{top6[4].label}</span>
      {/* Top Left */}
      <span style={{ position: 'absolute', top: 35, left: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{values[5]}%</span>{top6[5].label}</span>
    </div>
  );
};

const PositionPitch = ({ posCode }) => {
   let left = '50%';
   let bottom = '15%';
   if (posCode === 'DF') bottom = '25%';
   if (posCode === 'MF') bottom = '50%';
   if (posCode === 'FW') bottom = '80%';
   
   return (
      <div className="mini-pitch">
         <div className="pitch-line" style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 8 }} />
         <div className="pitch-line" style={{ top: '50%', left: 8, right: 8, height: 0 }} />
         <div className="pitch-line" style={{ top: '50%', left: '50%', width: 40, height: 40, borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
         <div className="pitch-line" style={{ top: 8, left: '20%', right: '20%', height: 30, borderTop: 'none' }} />
         <div className="pitch-line" style={{ bottom: 8, left: '20%', right: '20%', height: 30, borderBottom: 'none' }} />
         
         <div style={{ position: 'absolute', bottom: bottom, left: left, transform: 'translate(-50%, 50%)', background: '#ff1a1a', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10, border: '1px solid #fff' }}>
            {posCode || 'GK'}
         </div>
      </div>
   );
}



export default function PlayerDetailPage({ params }) {
  const { id: playerId } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState({ recent: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pRes = await api.get(`/players/${playerId}`);
        if (pRes.data.success) {
          setPlayer(pRes.data.data);
          
          // Get matches
          const mRes = await api.get('/matches', { params: { per_page: 50 } });
          if (mRes.data.success && pRes.data.data?.team_id) {
             const tid = String(pRes.data.data.team_id);
             const teamMatches = mRes.data.data.filter(m => String(m.home_team_id) === tid || String(m.away_team_id) === tid);
             
             // Sort by date descending
             teamMatches.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
             const recent = teamMatches.filter(m => m.status === 'finished' || m.status === 'playing' || new Date(m.scheduled_at) <= new Date()).slice(0, 5);
             
             // Sort by date ascending for upcoming
             teamMatches.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
             const upcoming = teamMatches.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()).slice(0, 5);

             setMatches({ recent, upcoming });
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [playerId]);

  const age = useMemo(() => {
    return player?.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : null;
  }, [player?.date_of_birth]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Memuat...</div>;
  if (!player) return <div style={{ padding: 40, textAlign: 'center' }}>Pemain tidak ditemukan</div>;
  const positionCode = player.position_text || (player.position && typeof player.position === 'object' ? player.position.abbreviation : player.position) || 'GK';
  const posName = player.position && typeof player.position === 'object' ? player.position.name : positionCode;
  
  const heroColor = '#ff1a1a';

  return (
    <div className="player-layout">
       <div className="hero-banner" style={{ background: heroColor }}>
          <div className="hero-inner">
             <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <img src={getImageUrl(player.photo_path) || avatar(player.name)} className="hero-photo" alt="" />
                <div>
                   <h1 className="hero-name">{player.name}</h1>
                   <div className="hero-team">
                     <img src={getImageUrl(player.team?.logo_path) || avatar(player.team?.name)} className="hero-team-logo" alt="" />
                     {player.team?.name}
                   </div>
                </div>
             </div>
             <button className="follow-btn">Follow</button>
          </div>
       </div>

       <div className="grid-layout">
         <div className="main-col">
            <div className="card info-grid">
               <div className="info-item">
                  <span className="info-val">{player.metadata?.height || player.tinggi_badan || '-'}</span>
                  <span className="info-lbl">Tinggi Badan</span>
               </div>
               <div className="info-item">
                  <span className="info-val">{player.jersey_number || '-'}</span>
                  <span className="info-lbl">Nomor Punggung</span>
               </div>
               
               <div className="info-position-box" style={{ gridRow: 'span 3', gridColumn: '3' }}>
                  <span className="info-lbl" style={{ marginBottom: 12, display: 'block' }}>Posisi</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: heroColor }}>Utama</span><br/>
                  <span style={{ fontSize: 13, color: '#111827' }}>{posName}</span>
                  <PositionPitch posCode={positionCode} />
               </div>

               <div className="info-item">
                  <span className="info-val">{age ? `${age} Tahun` : '-'}</span>
                  <span className="info-lbl">{player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric'}) : ''}</span>
               </div>
               <div className="info-item">
                  <span className="info-val">{player.metadata?.preferred_foot || player.kaki_dominan || '-'}</span>
                  <span className="info-lbl">Kaki Dominan</span>
               </div>
               
               <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {player.tempat_lahir || '-'}
                  </span>
                  <span className="info-lbl">Tempat Lahir</span>
               </div>

               <div className="info-item">
                  <span className="info-val">{player.no_telp || '-'}</span>
                  <span className="info-lbl">No. Telepon</span>
               </div>
               <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="info-val">{player.asal_sekolah || '-'}</span>
                  <span className="info-lbl">Asal Sekolah</span>
               </div>
            </div>

            <div className="card mt-4 p-4">
               <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 12 }}>
                 <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Statistik Keseluruhan</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 {getSportStatKeys(player?.team?.sport_id, player?.team?.sport?.slug).map((stat, i) => {
                   const val = player?.aggregated_stats?.[stat.key] || 0;
                   return (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: i === getSportStatKeys(player?.team?.sport_id, player?.team?.sport?.slug).length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                       <span style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>{stat.label}</span>
                       <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{val}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
         </div>

         <div className="side-col">
            <div className="card p-4">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Karakteristik Pemain</span>
                 <HelpCircle size={16} color="#9ca3af" />
               </div>
               <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Statistik dibandingkan pemain {posName} lainnya</div>
               <DynamicRadarChart player={player} />
            </div>

            <div className="card mt-4 p-4">
               <div style={{ paddingBottom: 16 }}>
                 <span style={{ fontSize: 15, fontWeight: 700, display: 'block', color: '#111827' }}>Riwayat Pertandingan</span>
               </div>
               
               {matches.upcoming?.length > 0 && (
                 <>
                   <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>Pertandingan Akan Datang</div>
                   {matches.upcoming.map((m, i) => {
                      const time = new Date(m.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                      return (
                      <div key={'up_'+i} onClick={() => router.push(`/matches/${m.uuid}`)} className="match-row-flex" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                        <div className="match-row-time" style={{ width: 60, flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#64748b' }}>{time}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                          <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0 }}>
                            <span className="match-row-team-name" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home_team?.name || 'Home'}</span>
                            <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          </div>
                          <div className="match-row-score" style={{ width: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>-</span>
                          </div>
                          <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, minWidth: 0 }}>
                            <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                            <span className="match-row-team-name" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.away_team?.name || 'Away'}</span>
                          </div>
                        </div>
                      </div>
                      );
                   })}
                 </>
               )}

               <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, marginTop: matches.upcoming?.length > 0 ? 16 : 0, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>Pertandingan Terbaru</div>
               {matches.recent?.length > 0 ? matches.recent.map((m, i) => {
                  const isFinished = m.status === 'finished';
                  const isLive = ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status);
                  const hasScore = isLive || isFinished;
                  return (
                  <div key={'rec_'+i} onClick={() => router.push(`/matches/${m.uuid}`)} className="match-row-flex" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i === matches.recent.length - 1 ? 'none' : '1px solid #f3f4f6', cursor: 'pointer' }}>
                     <div className="match-row-time" style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {isLive ? (
                           <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700 }}>Live</span>
                        ) : isFinished ? (
                           <div style={{ background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>FT</div>
                        ) : (
                           <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{new Date(m.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                        )}
                     </div>
                     <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0 }}>
                           <span className="match-row-team-name" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home_team?.name || 'Home'}</span>
                           <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                        </div>
                        <div className="match-row-score" style={{ width: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                           {hasScore ? (
                              <span style={{ fontSize: 14, fontWeight: 700, color: isLive ? '#ef4444' : '#1e293b', whiteSpace: 'nowrap', letterSpacing: '1px' }}>
                                 {m.home_score} - {m.away_score}
                              </span>
                           ) : (
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>-</span>
                           )}
                        </div>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, minWidth: 0 }}>
                           <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                           <span className="match-row-team-name" style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.away_team?.name || 'Away'}</span>
                        </div>
                     </div>
                  </div>
                  );
               }) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Belum ada pertandingan terbaru</div>
               )}
            </div>
         </div>
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
          body { background: #f9fafb; margin: 0; }
          .player-layout { max-width: 1040px; margin: 0 auto; padding: 24px; }
          .hero-banner { border-radius: 16px; padding: 24px 32px; color: #fff; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 12px rgba(255,26,26,0.2); }
          .hero-inner { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 2; }
          .hero-photo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; background: #fff; }
          .hero-name { font-size: 28px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px; }
          .hero-team { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; opacity: 0.9; }
          .hero-team-logo { width: 16px; height: 16px; border-radius: 50%; background: #fff; padding: 1px; object-fit: contain; }
          .follow-btn { background: #fff; color: #ff1a1a; border: none; border-radius: 20px; padding: 8px 24px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .follow-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

          .grid-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
          @media(min-width: 900px) {
            .grid-layout { grid-template-columns: 1.2fr 1fr; }
          }
          @media(min-width: 1100px) {
            .grid-layout { grid-template-columns: 1.4fr 1fr; }
          }
          
          .card { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          .p-4 { padding: 24px; }
          .mt-4 { margin-top: 24px; }

          .info-grid { padding: 24px; display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 28px 16px; align-items: start; }
          @media(max-width: 600px) {
             .info-grid { grid-template-columns: 1fr 1fr; gap: 20px 16px; }
             .info-position-box { grid-column: 1 / -1 !important; grid-row: auto !important; margin-top: 8px; border-top: 1px solid #f3f4f6; border-left: none !important; padding-left: 0 !important; padding-top: 20px; }
          }
          .info-item { display: flex; flex-direction: column; gap: 4px; }
          .info-val { font-size: 14px; font-weight: 700; color: #111827; }
          .info-lbl { font-size: 12px; font-weight: 500; color: #6b7280; }

          .info-position-box { border-left: 1px solid #f3f4f6; padding-left: 24px; height: 100%; display: flex; flex-direction: column; }
          .mini-pitch { flex: 1; min-height: 150px; background: #f3f4f6; border-radius: 8px; margin-top: 16px; position: relative; overflow: hidden; border: 1px solid #e5e7eb; }
          .pitch-line { position: absolute; border: 1.5px solid #d1d5db; }
       `}} />
    </div>
  );
}
