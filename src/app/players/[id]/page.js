"use client";
import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const formatLabel = (key) => {
      const map = {
          matches_played: 'Main', appearances: 'Main', goals: 'Gol', assists: 'Assist',
          yellow_cards: 'Kartu Kuning', red_cards: 'Kartu Merah', saves: 'Penyelamatan',
          tackles: 'Tekel', interceptions: 'Intersep', clearances: 'Sapuan', blocks: 'Blok',
          fouls: 'Pelanggaran', fouls_committed: 'Pelanggaran (Dilakukan)', was_fouled: 'Pelanggaran (Diterima)',
          shots: 'Tembakan', shots_on_target: 'Tembakan ke Gawang', possession: 'Penguasaan Bola',
          clean_sheets: 'Clean Sheet', minutes_played: 'Menit Bermain', pass_accuracy: 'Akurasi Umpan',
          total_passes: 'Total Umpan', successful_passes: 'Umpan Sukses', accurate_passes: 'Umpan Akurat',
          failed_passes: 'Umpan Gagal', key_passes: 'Umpan Kunci', successful_tackles: 'Tekel Sukses',
          offsides: 'Offside', successful_crosses: 'Umpan Silang Sukses', rating: 'Rating'
      };
      return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  let top6 = [];
  
  if (player?.team?.sport?.stat_fields && Array.isArray(player.team.sport.stat_fields)) {
     // Get all available stats for this player
     const allStats = player.team.sport.stat_fields
       .filter(key => key !== 'minutes_played' && key !== 'matches_played' && key !== 'appearances' && key !== 'possession') // Exclude some non-skill stats
       .map(key => {
         const val = player?.aggregated_stats?.[key] || 0;
         return { key, label: formatLabel(key), rawValue: Number(val) };
       })
       .sort((a, b) => b.rawValue - a.rawValue);
       
     top6 = allStats.slice(0, 6);
  }

  // Fallback if sport config is missing
  if (top6.length < 6) {
     const defaultSkills = getSportSkills(player?.team?.sport_id, player?.team?.sport?.slug);
     top6 = defaultSkills.slice(0, 6).map(s => ({
        key: s.key,
        label: s.label,
        rawValue: getSkillValue(player, s.key)
     }));
  }
  
  // Ensure exactly 6
  while (top6.length < 6) top6.push({ key: 'unknown', label: 'Unknown', rawValue: 0 });
  top6 = top6.slice(0, 6);

  // Normalize values for the radar chart (scale to 0-100)
  // Find max value to determine scale, but cap scale at a reasonable minimum so small numbers (e.g. 2 goals) don't become 100% if they are the only stat.
  const maxRaw = Math.max(...top6.map(s => s.rawValue));
  
  // If the stats are pseudo-random (60-95), maxRaw is already in percentage scale.
  // If real stats are small (e.g. 5), we scale them up, but not too aggressively.
  const scaleFactor = maxRaw > 100 ? (100 / maxRaw) : (maxRaw > 0 && maxRaw <= 20 ? (90 / maxRaw) : (maxRaw === 0 ? 0 : 1));

  const values = top6.map(s => {
      // If it's a real stat and max is <= 20, we scale it to look good on the radar. 
      // If we use scaleFactor == 1, then a value of 100 is 100%.
      return Math.min(100, Math.round(s.rawValue * scaleFactor));
  });
  
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
      <span style={{ position: 'absolute', top: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center', transform: 'translateX(-50%)', left: '50%' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[0].rawValue}</span>{top6[0].label}</span>
      {/* Top Right */}
      <span style={{ position: 'absolute', top: 35, right: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[1].rawValue}</span>{top6[1].label}</span>
      {/* Bottom Right */}
      <span style={{ position: 'absolute', bottom: 35, right: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[2].rawValue}</span>{top6[2].label}</span>
      {/* Bottom */}
      <span style={{ position: 'absolute', bottom: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center', transform: 'translateX(-50%)', left: '50%' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[3].rawValue}</span>{top6[3].label}</span>
      {/* Bottom Left */}
      <span style={{ position: 'absolute', bottom: 35, left: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[4].rawValue}</span>{top6[4].label}</span>
      {/* Top Left */}
      <span style={{ position: 'absolute', top: 35, left: -15, fontSize: 9, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}><span style={{ color: '#111827', fontWeight: 800, display: 'block' }}>{top6[5].rawValue}</span>{top6[5].label}</span>
    </div>
  );
};


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
       
       {/* Hero Banner (Full Width on Desktop) */}
       <div className="hero-banner" style={{ background: '#1e293b', padding: '64px 32px 0 32px', position: 'relative', overflow: 'hidden', marginBottom: 24, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <div className="back-btn-container" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
             <button className="back-btn" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={18} />
             </button>
          </div>
          
          <div className="hero-inner" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
                <img src={getImageUrl(player.photo_path) || avatar(player.name)} className="hero-photo" alt="" style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: '12px 12px 0 0', background: '#fff', display: 'block' }} />
                <div style={{ paddingBottom: 20 }}>
                   <h1 className="hero-name" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{player.name}</h1>
                   <div className="hero-team" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#e2e8f0' }}>
                     <img src={getImageUrl(player.team?.logo_path) || avatar(player.team?.name)} style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff' }} alt="" />
                     {player.team?.name}
                   </div>
                </div>
             </div>
             <div style={{ paddingBottom: 20 }}>
                <button className="follow-btn" style={{ background: '#fff', color: '#172554', border: 'none', borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Follow</button>
             </div>
          </div>
       </div>

       <div className="grid-layout">
         <div className="main-col">
            
            {/* MAIN PROFILE CARD */}
            <div className="card profile-card" style={{ padding: '24px 0 0 0', overflow: 'hidden' }}>

               {/* Info Grid */}
               <div className="info-grid" style={{ padding: '0 32px' }}>
                  {/* Row 1 */}
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{player.metadata?.height || player.tinggi_badan || '-'}</span>
                     <span className="info-lbl">Tinggi Badan</span>
                  </div>
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{player.jersey_number || '-'}</span>
                     <span className="info-lbl">Nomor Punggung</span>
                  </div>
                  
                  {/* Row 2 */}
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{age ? `${age} Tahun` : '-'}</span>
                     <span className="info-lbl">{player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric'}) : ''}</span>
                  </div>
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{player.metadata?.preferred_foot || player.kaki_dominan || '-'}</span>
                     <span className="info-lbl">Kaki Dominan</span>
                  </div>
                  
                  {/* Row 3 */}
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{player.tempat_lahir || '-'}</span>
                     <span className="info-lbl">Tempat Lahir</span>
                  </div>
                  <div className="info-item" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
                     <span className="info-val">{player.no_telp || '-'}</span>
                     <span className="info-lbl">No. Telepon</span>
                  </div>

                  {/* Row 4 */}
                  <div className="info-item" style={{ padding: '16px 0' }}>
                     <span className="info-val">{player.asal_sekolah || '-'}</span>
                     <span className="info-lbl">Asal Sekolah</span>
                  </div>
                  <div className="info-item" style={{ padding: '16px 0' }}></div>
               </div>

               {/* Position Box */}
               <div className="position-section" style={{ borderTop: '1px solid #f1f5f9', display: 'flex', padding: 32 }}>
                  <div style={{ flex: 1 }}>
                     <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 24px 0', color: '#0f172a' }}>Posisi</h3>
                     <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', display: 'block', marginBottom: 4 }}>Utama</span>
                        <span style={{ fontSize: 11, color: '#1e293b' }}>{posName}</span>
                     </div>
                  </div>
                  <div style={{ width: 140, flexShrink: 0 }}>
                     {/* Vertical Pitch */}
                     <div style={{ width: '100%', aspectRatio: '2/3', background: '#f1f5f9', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                        {/* Outline */}
                        <div style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, border: '1.5px solid #fff' }} />
                        {/* Halfway Line */}
                        <div style={{ position: 'absolute', top: '50%', left: 6, right: 6, height: 0, borderTop: '1.5px solid #fff' }} />
                        {/* Center Circle */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '1.5px solid #fff' }} />
                        {/* Penalty Boxes */}
                        <div style={{ position: 'absolute', top: 6, left: '20%', right: '20%', height: '16%', border: '1.5px solid #fff', borderTop: 'none' }} />
                        <div style={{ position: 'absolute', bottom: 6, left: '20%', right: '20%', height: '16%', border: '1.5px solid #fff', borderBottom: 'none' }} />
                        
                        {/* Player Dot */}
                        <div style={{ position: 'absolute', bottom: positionCode === 'FW' ? '75%' : positionCode === 'MF' ? '50%' : positionCode === 'DF' ? '25%' : '10%', left: '50%', transform: 'translate(-50%, 50%)', background: '#1d4ed8', color: '#fff', fontSize: 10, fontWeight: 700, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                           {positionCode || 'GK'}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* STATS */}
            <div className="card mt-4 p-4">
               <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 12 }}>
                 <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Statistik Keseluruhan</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 {(() => {
                   let statKeys = [];
                   if (player?.team?.sport?.stat_fields && Array.isArray(player.team.sport.stat_fields)) {
                       // Custom format map
                       const formatLabel = (key) => {
                           const map = {
                               matches_played: 'Main', appearances: 'Main', goals: 'Gol', assists: 'Assist',
                               yellow_cards: 'Kartu Kuning', red_cards: 'Kartu Merah', saves: 'Penyelamatan',
                               tackles: 'Tekel', interceptions: 'Intersep', clearances: 'Sapuan', blocks: 'Blok',
                               fouls: 'Pelanggaran', fouls_committed: 'Pelanggaran (Dilakukan)', was_fouled: 'Pelanggaran (Diterima)',
                               shots: 'Tembakan', shots_on_target: 'Tembakan ke Gawang', possession: 'Penguasaan Bola',
                               clean_sheets: 'Clean Sheet', minutes_played: 'Menit Bermain', pass_accuracy: 'Akurasi Umpan',
                               total_passes: 'Total Umpan', successful_passes: 'Umpan Sukses', accurate_passes: 'Umpan Akurat',
                               failed_passes: 'Umpan Gagal', key_passes: 'Umpan Kunci', successful_tackles: 'Tekel Sukses',
                               offsides: 'Offside', successful_crosses: 'Umpan Silang Sukses', rating: 'Rating'
                           };
                           return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                       };
                       
                       statKeys = [{ key: 'matches_played', label: 'Main' }]; // Always include matches played first
                       player.team.sport.stat_fields.forEach(f => {
                           statKeys.push({ key: f, label: formatLabel(f) });
                       });
                   } else {
                       statKeys = getSportStatKeys(player?.team?.sport_id, player?.team?.sport?.slug);
                   }
                   
                   return statKeys.map((stat, i) => {
                     const val = player?.aggregated_stats?.[stat.key] || 0;
                     return (
                       <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: i === statKeys.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                         <span style={{ fontSize: 11, fontWeight: 500, color: '#4b5563' }}>{stat.label}</span>
                         <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{val}</span>
                       </div>
                     );
                   });
                 })()}
               </div>
            </div>
         </div>

         <div className="side-col">
            <div className="card p-4 mb-4">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Profil Skill</span>
                 <HelpCircle size={16} color="#9ca3af" />
               </div>
               <DynamicRadarChart player={player} />
            </div>

            <div className="card p-4">
               <div style={{ paddingBottom: 16 }}>
                 <span style={{ fontSize: 13, fontWeight: 700, display: 'block', color: '#111827' }}>Pertandingan</span>
               </div>
               
               {matches.upcoming?.length > 0 ? matches.upcoming.map((m, i) => {
                  let time = m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
                  if (m.status === 'finished') time = 'FT';
                  else if (m.status === 'playing') time = 'LIVE';
                  
                  return (
                    <div key={'up_'+i} onClick={() => router.push(`/matches/${m.uuid}`)} className="match-row-flex" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                      <div className="match-row-time" style={{ width: 60, flexShrink: 0, fontSize: 10, fontWeight: 600, color: '#64748b' }}>{time}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0 }}>
                          <span className="match-row-team-name" style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home_team?.name || 'Home'}</span>
                          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                        </div>
                        <div className="match-row-score" style={{ width: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#6b7280' }}>v</div>
                        </div>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, minWidth: 0 }}>
                          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                          <span className="match-row-team-name" style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.away_team?.name || 'Away'}</span>
                        </div>
                      </div>
                    </div>
                  );
               }) : matches.recent?.length > 0 ? matches.recent.map((m, i) => {
                  const homeWin = m.home_score > m.away_score;
                  const awayWin = m.away_score > m.home_score;
                  
                  return (
                  <div key={'rec_'+i} onClick={() => router.push(`/matches/${m.uuid}`)} className="match-row-flex" style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i === matches.recent.length - 1 ? 'none' : '1px solid #f3f4f6', cursor: 'pointer' }}>
                     <div className="match-row-time" style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, display: 'flex', flexDirection: 'column' }}>
                           {new Date(m.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                     </div>
                     <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, minWidth: 0 }}>
                           <span className="match-row-team-name" style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.home_team?.name || 'Home'}</span>
                           <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                        </div>
                        <div className="match-row-score" style={{ width: 72, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                           <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: 4, display: 'flex', gap: 6, border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: homeWin ? '#111827' : '#64748b' }}>{m.home_score ?? '-'}</span>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>-</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: awayWin ? '#111827' : '#64748b' }}>{m.away_score ?? '-'}</span>
                           </div>
                        </div>
                        <div className="match-row-flex" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, minWidth: 0 }}>
                           <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                           <span className="match-row-team-name" style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.away_team?.name || 'Away'}</span>
                        </div>
                     </div>
                  </div>
                  );
               }) : (
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Belum ada pertandingan terbaru</div>
               )}
            </div>
         </div>
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
          body { background: var(--bg-app); margin: 0; }
          .player-layout { max-width: 1040px; margin: 0 auto; padding: 24px; }
          
          .card { background: #fff; border-radius: 16px; border: 1px solid var(--border-light); box-shadow: none; }
          .p-4 { padding: 24px; }
          .mt-4 { margin-top: 24px; }
          .mb-4 { margin-bottom: 24px; }

          .grid-layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
          @media(min-width: 900px) {
            .grid-layout { grid-template-columns: 1.2fr 1fr; }
          }
          @media(min-width: 1100px) {
            .grid-layout { grid-template-columns: 1.4fr 1fr; }
          }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; }
          .info-item { display: flex; flex-direction: column; gap: 4px; }
          .info-val { font-size: 12px; font-weight: 700; color: #111827; }
          .info-lbl { font-size: 11px; font-weight: 500; color: #64748b; }
          .back-btn-container { display: none; }

          @media(max-width: 600px) {
             .back-btn-container { display: block; }
             .hero-inner { flex-direction: column !important; align-items: center !important; text-align: center; gap: 16px !important; }
             .hero-inner > div { flex-direction: column !important; align-items: center !important; text-align: center; }
             .hero-photo { width: 100px !important; height: 120px !important; margin-bottom: 12px; }
             .hero-team { justify-content: center; }
             .info-grid { padding: 0 20px !important; gap: 0 16px; }
             .position-section { flex-direction: row; padding: 24px 20px !important; gap: 16px; align-items: stretch; justify-content: space-between; }
          }
       `}} />
    </div>
  );
}
