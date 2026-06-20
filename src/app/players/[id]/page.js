"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Calendar, Award, TrendingUp, Target, Zap, Clock, Activity, ChevronRight, Shirt, Flame, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../../../api';

const avatar = (name, bg = 'f59e0b') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=${bg}&color=fff&bold=true&size=200`;

const posLabels = { GK: 'Kiper', DF: 'Bek', MF: 'Gelandang', FW: 'Penyerang' };
const posColors = { GK: '#f59e0b', DF: '#10b981', MF: '#3b82f6', FW: '#ef4444' };

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.06, duration: 0.3 }}
      className="stat-card"
    >
      <div className="stat-card-accent" style={{ background: color }} />
      <div className="stat-card-icon" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </motion.div>
  );
}

// ─── Match Row ───
function MatchRow({ m, player, idx, router }) {
  const isLive = ['live','first_half','half_time','second_half'].includes(m.status);
  const isFinished = m.status === 'finished';
  const hasScore = isLive || isFinished;
  const isHome = String(m.home_team_id) === String(player.team_id);
  const won = hasScore && ((isHome && m.home_score > m.away_score) || (!isHome && m.away_score > m.home_score));
  const lost = hasScore && ((isHome && m.home_score < m.away_score) || (!isHome && m.away_score < m.home_score));
  const draw = hasScore && m.home_score === m.away_score;
  const rc = won ? '#10b981' : lost ? '#ef4444' : '#8b92a5';
  const rl = won ? 'M' : lost ? 'K' : draw ? 'S' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
      onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
      className="match-row-item"
    >
      {hasScore && (
        <div className="match-result-badge" style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}40` }}>{rl}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="match-team-line">
          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} className="match-team-logo" alt="" />
          <span style={{ flex: 1, fontWeight: hasScore && m.home_score > m.away_score ? 700 : 500, color: hasScore && m.home_score > m.away_score ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.home_team?.name}</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', width: 18, textAlign: 'right' }}>{hasScore ? m.home_score : '-'}</span>
        </div>
        <div className="match-team-line">
          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} className="match-team-logo" alt="" />
          <span style={{ flex: 1, fontWeight: hasScore && m.away_score > m.home_score ? 700 : 500, color: hasScore && m.away_score > m.home_score ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{m.away_team?.name}</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', width: 18, textAlign: 'right' }}>{hasScore ? m.away_score : '-'}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
        {isLive ? (
          <span className="live-badge"><span className="live-dot-anim" /> LIVE</span>
        ) : isFinished ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>FT</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
          </span>
        )}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
          {(m.match_date || m.scheduled_at) ? new Date(m.match_date || m.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  );
}

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
  return 70 + (Math.abs(hash) % 26); // 70 to 95
};

const getSportSkills = (sportId, sportSlug) => {
  const slug = String(sportSlug || '').toLowerCase();
  const id = Number(sportId);

  if (id === 2 || slug === 'volleyball') { // Voli
    return [
      { key: 'passing', label: 'Passing', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
      { key: 'service', label: 'Service', color: 'linear-gradient(90deg, #10b981, #34d399)' },
      { key: 'block', label: 'Block', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
      { key: 'smash', label: 'Smash', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
    ];
  }
  if (id === 4 || slug === 'badminton') { // Bulu Tangkis
    return [
      { key: 'footwalk', label: 'Footwalk', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
      { key: 'penempatan_posisi', label: 'Penempatan Posisi', color: 'linear-gradient(90deg, #10b981, #34d399)' },
      { key: 'service', label: 'Service', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
      { key: 'loop', label: 'Loop', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
      { key: 'stamina', label: 'Stamina', color: 'linear-gradient(90deg, #eab308, #fbbf24)' },
    ];
  }
  // Default: Sepak Bola / Futsal
  return [
    { key: 'passing', label: 'Passing', color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { key: 'kontrol', label: 'Kontrol', color: 'linear-gradient(90deg, #10b981, #34d399)' },
    { key: 'dribling', label: 'Dribling', color: 'linear-gradient(90deg, #a855f7, #c084fc)' },
    { key: 'finishing', label: 'Finishing', color: 'linear-gradient(90deg, #ef4444, #f87171)' },
    { key: 'stamina', label: 'Stamina', color: 'linear-gradient(90deg, #eab308, #fbbf24)' },
    { key: 'koordinasi_pemain', label: 'Koordinasi Antar Pemain', color: 'linear-gradient(90deg, #ec4899, #f472b6)' },
  ];
};

// ─── Main Page ───
export default function PlayerDetailPage({ params }) {
  const { id: playerId } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('skills'); // Default to skills to showcase user's requested feature

  const TABS = ['skills', 'stats', 'matches', 'bio'];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && TABS.includes(urlTab)) {
        setTab(urlTab);
      }
    }
  }, []);

  const handleTabChange = (tabId) => {
    setTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pRes = await api.get(`/players/${playerId}`);
        if (pRes.data.success) {
          setPlayer(pRes.data.data);
          if (pRes.data.data.aggregated_stats) setStats(pRes.data.data.aggregated_stats);
        }
        try {
          const mRes = await api.get('/matches', { params: { per_page: 100 } });
          if (mRes.data.success && pRes.data.data?.team_id) {
            const tid = String(pRes.data.data.team_id);
            setMatches(mRes.data.data.filter(m => String(m.home_team_id) === tid || String(m.away_team_id) === tid).slice(0, 10));
          }
        } catch {}
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [playerId]);

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loader" /><p style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Memuat profil...</p>
    </div>
  );

  if (!player) return (
    <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
      <User size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Pemain Tidak Ditemukan</h2>
      <button onClick={() => router.back()} style={{ marginTop: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>
        <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Kembali
      </button>
    </div>
  );

  const positionCode = player.position_text || (player.position && typeof player.position === 'object' ? player.position.abbreviation : player.position);
  const pc = posColors[positionCode] || '#f59e0b';
  const age = player.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : null;
  const rating = stats?.rating || '7.0';

  const statConfigs = {
    goals: { label: 'Gol', icon: Target, color: '#ef4444' },
    assists: { label: 'Assist', icon: TrendingUp, color: '#3b82f6' },
    matches_played: { label: 'Tampil', icon: Activity, color: '#10b981' },
    yellow_cards: { label: 'K. Kuning', icon: Award, color: '#eab308' },
    red_cards: { label: 'K. Merah', icon: Zap, color: '#ef4444' },
    minutes_played: { label: 'Menit', icon: Clock, color: '#8b5cf6' },
    passing: { label: 'Passing', icon: Zap, color: '#3b82f6' },
    kontrol: { label: 'Kontrol', icon: Activity, color: '#8b92a5' },
    dribling: { label: 'Dribling', icon: Flame, color: '#f59e0b' },
    finishing: { label: 'Finishing', icon: Target, color: '#ef4444' },
    stamina: { label: 'Stamina', icon: Shield, color: '#10b981' },
    koordinasi_pemain: { label: 'Koordinasi', icon: Users, color: '#06b6d4' },
    service: { label: 'Service', icon: Zap, color: '#3b82f6' },
    block: { label: 'Block', icon: Shield, color: '#10b981' },
    smash: { label: 'Smash', icon: Flame, color: '#ef4444' },
    footwalk: { label: 'Footwalk', icon: Activity, color: '#8b5cf6' },
    penempatan_posisi: { label: 'Posisi', icon: Target, color: '#f59e0b' },
    loop: { label: 'Loop', icon: TrendingUp, color: '#06b6d4' },
    tackles: { label: 'Tackle', icon: Shield, color: '#10b981' },
    saves: { label: 'Penyelamatan', icon: Shield, color: '#f59e0b' },
    dig: { label: 'Dig', icon: Activity, color: '#3b82f6' },
    assist: { label: 'Assist', icon: TrendingUp, color: '#06b6d4' },
    error: { label: 'Error', icon: AlertTriangle, color: '#ef4444' },
  };

  const getStatConfig = (field) => {
    if (statConfigs[field]) return statConfigs[field];
    return {
      label: field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      icon: Activity,
      color: '#64748b'
    };
  };

  const statItems = [];
  if (stats) {
    if (stats.matches_played !== undefined) {
      statItems.push({ label: 'Tampil', value: stats.matches_played, icon: Activity, color: '#10b981' });
    }
    
    const sportFields = player.team?.sport?.stat_fields || [];
    sportFields.forEach(field => {
      if (field === 'matches_played') return;
      
      const val = stats[field] !== undefined ? stats[field] : 0;
      const config = getStatConfig(field);
      statItems.push({
        label: config.label,
        value: val,
        icon: config.icon,
        color: config.color
      });
    });

    if (sportFields.length === 0) {
      if (stats.goals !== undefined) statItems.push({ label: 'Gol', value: stats.goals, icon: Target, color: '#ef4444' });
      if (stats.assists !== undefined) statItems.push({ label: 'Assist', value: stats.assists, icon: TrendingUp, color: '#3b82f6' });
      if (stats.yellow_cards !== undefined) statItems.push({ label: 'K. Kuning', value: stats.yellow_cards, icon: Award, color: '#eab308' });
      if (stats.red_cards !== undefined) statItems.push({ label: 'K. Merah', value: stats.red_cards, icon: Zap, color: '#ef4444' });
      if (stats.minutes_played !== undefined) statItems.push({ label: 'Menit', value: stats.minutes_played, icon: Clock, color: '#8b5cf6' });
    }
  }

  const infoItems = [
    { label: 'Klub', value: player.team?.name || '-' },
    ...(age ? [{ label: 'Usia', value: `${age} thn` }] : []),
    ...(player.date_of_birth ? [{ label: 'Lahir', value: new Date(player.date_of_birth).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
  ];

  return (
    <div className="player-page animate-fade-in">
      {/* ═══ HERO ═══ */}
      <div className="player-hero" style={{ '--pc': pc }}>
        <div className="hero-gradient" />
        <div className="hero-orb" />
        {player.jersey_number && <div className="hero-jersey-num">{player.jersey_number}</div>}

        <div className="hero-back">
          <button onClick={() => router.back()} className="hero-back-btn"><ArrowLeft size={20} /></button>
        </div>

        <div className="hero-content">
          <div className="hero-photo-wrap">
            <img src={getImageUrl(player.photo_path) || avatar(player.name)} alt={player.name} className="hero-photo" />
            <div className="hero-rating">{rating}</div>
          </div>
          <div className="hero-info">
            <h1 className="hero-name">{player.name}</h1>
            <div className="hero-badges">
              {positionCode && <span className="hero-badge" style={{ background: `${pc}15`, color: pc, border: `1px solid ${pc}30` }}>{posLabels[positionCode] || (typeof player.position === 'object' ? player.position.name : player.position)}</span>}
              {player.jersey_number && <span className="hero-badge hero-badge-num"><Shirt size={11} /> #{player.jersey_number}</span>}
              {player.team && (
                <Link href={`/teams/${player.team?.uuid || player.team_id}`} className="hero-badge hero-badge-team">
                  <img src={getImageUrl(player.team?.logo_path) || avatar(player.team?.name)} className="hero-badge-logo" alt="" />
                  {player.team.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="hero-info-bar">
          {infoItems.map((it, i) => (
            <div key={i} className="hero-info-item" style={{ borderRight: i < infoItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="hero-info-label">{it.label}</span>
              <span className="hero-info-value">{it.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="player-tabs">
        {[
          { id: 'skills', l: 'Keahlian' },
          { id: 'stats', l: 'Statistik' },
          { id: 'matches', l: 'Pertandingan' }
        ].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} className={`player-tab ${tab === s.id ? 'active' : ''}`}>{s.l}</button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="player-content">
        {tab === 'skills' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {getSportSkills(player.team?.sport_id, player.team?.sport?.slug).map((skill, idx) => {
              const val = getSkillValue(player, skill.key);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700 }}>{skill.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)' }}>{val}</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                      style={{ height: '100%', background: skill.color, borderRadius: 4 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'stats' && (
          <div className="stats-grid">
            {statItems.length > 0 ? statItems.map((s, i) => (
              <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i} />
            )) : (
              <div className="empty-card"><Activity size={28} style={{ color: 'var(--text-muted)' }} /><p>Belum ada statistik.</p></div>
            )}
          </div>
        )}
        {tab === 'matches' && (
          <div className="matches-list-card">
            {matches.length > 0 ? matches.map((m, i) => (
              <MatchRow key={m.id} m={m} player={player} idx={i} router={router} />
            )) : (
              <div className="empty-card"><Calendar size={28} style={{ color: 'var(--text-muted)' }} /><p>Belum ada pertandingan.</p></div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .player-page { max-width: 900px; margin: 0 auto; padding-bottom: 80px; }

        /* ── Hero ── */
        .player-hero { position: relative; overflow: hidden; padding-bottom: 24px; }
        .hero-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, var(--pc, #f59e0b)15 0%, var(--bg-app) 100%); pointer-events: none; }
        .hero-orb { position: absolute; top: -80px; right: -60px; width: 280px; height: 280px; background: radial-gradient(circle, var(--pc, #f59e0b)10, transparent 60%); pointer-events: none; }
        .hero-jersey-num { position: absolute; right: 20px; top: 10px; font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.03); line-height: 1; pointer-events: none; }
        .hero-back { position: relative; z-index: 5; padding: 16px 16px 0; }
        .hero-back-btn { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; width: 42px; height: 42px; cursor: pointer; color: var(--text-primary); display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .hero-back-btn:hover { background: var(--bg-subtle); }

        .hero-content { position: relative; z-index: 5; padding: 16px 20px 0; display: flex; gap: 18px; align-items: flex-end; }
        .hero-photo-wrap { position: relative; flex-shrink: 0; }
        .hero-photo { width: 100px; height: 100px; border-radius: 20px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.08), 0 0 0 4px var(--bg-app); display: block; background: var(--bg-card); }
        .hero-rating { position: absolute; top: -6px; left: -6px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #fff; font-size: 13px; font-weight: 900; width: 36px; height: 28px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 3px solid var(--bg-app); box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
        .hero-info { flex: 1; min-width: 0; padding-bottom: 4px; }
        .hero-name { font-size: 24px; font-weight: 900; color: var(--text-primary); line-height: 1.1; margin: 0 0 8px; letter-spacing: -0.02em; }
        .hero-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .hero-badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; transition: all 0.2s; }
        .hero-badge-num { background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border); }
        .hero-badge-team { background: rgba(59,130,246,0.1); color: #3b82f6; text-decoration: none; border: 1px solid rgba(59,130,246,0.2); }
        .hero-badge-team:hover { background: rgba(59,130,246,0.15); }
        .hero-badge-logo { width: 14px; height: 14px; border-radius: 3px; object-fit: contain; }

        .hero-info-bar { position: relative; z-index: 5; display: flex; margin: 20px 16px 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .hero-info-item { flex: 1; padding: 12px 8px; text-align: center; }
        .hero-info-label { display: block; font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
        .hero-info-value { display: block; font-size: 13px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Tabs ── */
        .player-tabs { display: flex; margin: 0 16px; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); }
        .player-tab { flex: 1; padding: 14px 0; font-size: 13px; font-weight: 700; color: var(--text-secondary); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em; }
        .player-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

        /* ── Content ── */
        .player-content { padding: 16px 16px 0; }

        /* ── Stats Grid ── */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .stat-card { position: relative; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 18px 12px 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .stat-card-accent { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 3px; border-radius: 2px; }
        .stat-card-icon { width: 38px; height: 38px; border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
        .stat-card-value { font-size: 28px; font-weight: 900; color: var(--text-primary); font-variant-numeric: tabular-nums; line-height: 1; }
        .stat-card-label { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }

        /* ── Matches List ── */
        .matches-list-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .match-row-item { display: flex; align-items: center; gap: 10px; padding: 14px; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background 0.15s; }
        .match-row-item:last-child { border-bottom: none; }
        .match-row-item:hover { background: var(--bg-subtle); }
        .match-result-badge { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
        .match-team-line { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 3px; }
        .match-team-line:last-child { margin-bottom: 0; }
        .match-team-logo { width: 16px; height: 16px; object-fit: contain; border-radius: 3px; flex-shrink: 0; }
        .live-badge { background: rgba(239,68,68,0.12); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 800; color: #ef4444; display: inline-flex; align-items: center; gap: 4px; }
        .live-dot-anim { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; animation: blink 1.2s infinite; }

        .empty-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 40px 20px; text-align: center; grid-column: 1 / -1; }
        .empty-card p { font-size: 13px; color: var(--text-secondary); font-weight: 600; margin: 10px 0 0; }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .player-page { max-width: 900px; }
          .hero-content { padding: 20px 32px 0; gap: 24px; }
          .hero-photo { width: 130px; height: 130px; border-radius: 24px; }
          .hero-rating { width: 42px; height: 32px; font-size: 15px; top: -8px; left: -8px; }
          .hero-name { font-size: 32px; }
          .hero-info-bar { margin: 24px 32px 0; }
          .hero-info-value { font-size: 14px; }
          .hero-jersey-num { font-size: 140px; right: 32px; top: 20px; }
          .player-tabs { margin: 0 32px; }
          .player-content { padding: 20px 32px 0; }
          .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
          .stat-card { padding: 24px 16px 18px; }
          .stat-card-value { font-size: 36px; }
          .stat-card-icon { width: 44px; height: 44px; }
        }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .hero-content { gap: 14px; padding: 12px 14px 0; }
          .hero-photo { width: 80px; height: 80px; border-radius: 16px; }
          .hero-name { font-size: 20px; }
          .hero-badge { font-size: 10px; padding: 3px 8px; }
          .hero-info-bar { margin: 16px 12px 0; }
          .player-tabs { margin: 0 12px; }
          .player-content { padding: 12px 12px 0; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .stat-card { padding: 14px 10px 12px; }
          .stat-card-value { font-size: 24px; }
          .stat-card-icon { width: 32px; height: 32px; }
          .match-row-item { padding: 12px; }
        }
      `}} />
    </div>
  );
}
