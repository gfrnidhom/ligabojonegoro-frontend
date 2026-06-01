"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Calendar, Award, TrendingUp, Target, Zap, Clock, Activity, ChevronRight, Shirt } from 'lucide-react';
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
      <div className="stat-card-icon" style={{ background: `${color}12` }}>
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
  const rc = won ? '#10b981' : lost ? '#ef4444' : '#64748b';
  const rl = won ? 'M' : lost ? 'K' : draw ? 'S' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
      onClick={() => router.push(`/matches/${m.uuid || m.id}`)}
      className="match-row-item"
    >
      {hasScore && (
        <div className="match-result-badge" style={{ background: `${rc}12`, color: rc }}>{rl}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="match-team-line">
          <img src={getImageUrl(m.home_team?.logo_path) || avatar(m.home_team?.name)} className="match-team-logo" alt="" />
          <span style={{ flex: 1, fontWeight: hasScore && m.home_score > m.away_score ? 700 : 500, color: hasScore && m.home_score > m.away_score ? '#f8fafc' : '#94a3b8' }}>{m.home_team?.name}</span>
          <span style={{ fontWeight: 800, color: hasScore && m.home_score > m.away_score ? '#f8fafc' : '#475569', width: 18, textAlign: 'right' }}>{hasScore ? m.home_score : '-'}</span>
        </div>
        <div className="match-team-line">
          <img src={getImageUrl(m.away_team?.logo_path) || avatar(m.away_team?.name)} className="match-team-logo" alt="" />
          <span style={{ flex: 1, fontWeight: hasScore && m.away_score > m.home_score ? 700 : 500, color: hasScore && m.away_score > m.home_score ? '#f8fafc' : '#94a3b8' }}>{m.away_team?.name}</span>
          <span style={{ fontWeight: 800, color: hasScore && m.away_score > m.home_score ? '#f8fafc' : '#475569', width: 18, textAlign: 'right' }}>{hasScore ? m.away_score : '-'}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
        {isLive ? (
          <span className="live-badge"><span className="live-dot-anim" /> LIVE</span>
        ) : isFinished ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>FT</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
            {m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
          </span>
        )}
        <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
          {(m.match_date || m.scheduled_at) ? new Date(m.match_date || m.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: '#333', flexShrink: 0 }} />
    </motion.div>
  );
}

// ─── Main Page ───
export default function PlayerDetailPage({ params }) {
  const { id: playerId } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stats');

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
      <div className="loader" /><p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13 }}>Memuat profil...</p>
    </div>
  );

  if (!player) return (
    <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
      <User size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Pemain Tidak Ditemukan</h2>
      <button onClick={() => router.back()} style={{ marginTop: 16, background: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#f59e0b', fontWeight: 700, cursor: 'pointer' }}>
        <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Kembali
      </button>
    </div>
  );

  const pc = posColors[player.position] || '#f59e0b';
  const age = player.date_of_birth ? Math.floor((Date.now() - new Date(player.date_of_birth)) / 31557600000) : null;
  const rating = stats?.rating || '7.0';

  const statItems = [];
  if (stats) {
    if (stats.goals !== undefined) statItems.push({ label: 'Gol', value: stats.goals, icon: Target, color: '#ef4444' });
    if (stats.assists !== undefined) statItems.push({ label: 'Assist', value: stats.assists, icon: TrendingUp, color: '#3b82f6' });
    if (stats.matches_played !== undefined) statItems.push({ label: 'Tampil', value: stats.matches_played, icon: Activity, color: '#10b981' });
    if (stats.yellow_cards !== undefined) statItems.push({ label: 'K. Kuning', value: stats.yellow_cards, icon: Award, color: '#eab308' });
    if (stats.red_cards !== undefined) statItems.push({ label: 'K. Merah', value: stats.red_cards, icon: Zap, color: '#ef4444' });
    if (stats.minutes_played !== undefined) statItems.push({ label: 'Menit', value: stats.minutes_played, icon: Clock, color: '#8b5cf6' });
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
              {player.position && <span className="hero-badge" style={{ background: `${pc}20`, color: pc }}>{posLabels[player.position] || player.position}</span>}
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
            <div key={i} className="hero-info-item" style={{ borderRight: i < infoItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span className="hero-info-label">{it.label}</span>
              <span className="hero-info-value">{it.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="player-tabs">
        {[{ id: 'stats', l: 'Statistik' }, { id: 'matches', l: 'Pertandingan' }].map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} className={`player-tab ${tab === s.id ? 'active' : ''}`}>{s.l}</button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="player-content">
        {tab === 'stats' && (
          <div className="stats-grid">
            {statItems.length > 0 ? statItems.map((s, i) => (
              <StatCard key={i} icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i} />
            )) : (
              <div className="empty-card"><Activity size={28} style={{ color: '#475569' }} /><p>Belum ada statistik.</p></div>
            )}
          </div>
        )}
        {tab === 'matches' && (
          <div className="matches-list-card">
            {matches.length > 0 ? matches.map((m, i) => (
              <MatchRow key={m.id} m={m} player={player} idx={i} router={router} />
            )) : (
              <div className="empty-card"><Calendar size={28} style={{ color: '#475569' }} /><p>Belum ada pertandingan.</p></div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .player-page { max-width: 900px; margin: 0 auto; padding-bottom: 80px; }

        /* ── Hero ── */
        .player-hero { position: relative; overflow: hidden; padding-bottom: 24px; }
        .hero-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, var(--pc, #f59e0b)12 0%, rgba(13,17,23,0.96) 65%, #0d1117 100%); pointer-events: none; }
        .hero-orb { position: absolute; top: -80px; right: -60px; width: 280px; height: 280px; background: radial-gradient(circle, var(--pc, #f59e0b)10, transparent 60%); pointer-events: none; }
        .hero-jersey-num { position: absolute; right: 20px; top: 10px; font-size: 100px; font-weight: 900; color: rgba(255,255,255,0.02); line-height: 1; pointer-events: none; }
        .hero-back { position: relative; z-index: 5; padding: 16px 16px 0; }
        .hero-back-btn { background: rgba(0,0,0,0.25); border: none; backdrop-filter: blur(8px); border-radius: 12px; width: 42px; height: 42px; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .hero-back-btn:hover { background: rgba(245,158,11,0.15); }

        .hero-content { position: relative; z-index: 5; padding: 16px 20px 0; display: flex; gap: 18px; align-items: flex-end; }
        .hero-photo-wrap { position: relative; flex-shrink: 0; }
        .hero-photo { width: 100px; height: 100px; border-radius: 20px; object-fit: cover; box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.06); display: block; }
        .hero-rating { position: absolute; top: -6px; left: -6px; background: linear-gradient(135deg, #fbbf24, var(--pc, #f59e0b)); color: #0a0a0a; font-size: 13px; font-weight: 900; width: 36px; height: 28px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(13,17,23,0.9); box-shadow: 0 4px 14px rgba(245,158,11,0.4); }
        .hero-info { flex: 1; min-width: 0; padding-bottom: 4px; }
        .hero-name { font-size: 24px; font-weight: 900; color: #fff; line-height: 1.1; margin: 0 0 8px; letter-spacing: -0.02em; text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
        .hero-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .hero-badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; transition: all 0.2s; }
        .hero-badge-num { background: rgba(255,255,255,0.06); color: #e2e8f0; }
        .hero-badge-team { background: rgba(245,158,11,0.06); color: #d4a26a; text-decoration: none; }
        .hero-badge-team:hover { background: rgba(245,158,11,0.12); }
        .hero-badge-logo { width: 14px; height: 14px; border-radius: 3px; object-fit: contain; }

        .hero-info-bar { position: relative; z-index: 5; display: flex; margin: 20px 16px 0; background: rgba(255,255,255,0.02); border-radius: 12px; overflow: hidden; }
        .hero-info-item { flex: 1; padding: 12px 8px; text-align: center; }
        .hero-info-label { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
        .hero-info-value { display: block; font-size: 13px; font-weight: 700; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── Tabs ── */
        .player-tabs { display: flex; margin: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.04); position: sticky; top: 0; z-index: 20; background: rgba(13,17,23,0.96); backdrop-filter: blur(12px); }
        .player-tab { flex: 1; padding: 14px 0; font-size: 13px; font-weight: 700; color: #64748b; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em; }
        .player-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }

        /* ── Content ── */
        .player-content { padding: 16px 16px 0; }

        /* ── Stats Grid ── */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .stat-card { position: relative; overflow: hidden; background: linear-gradient(145deg, rgba(245,158,11,0.05), rgba(13,17,23,0.94)); border-radius: 16px; padding: 18px 12px 14px; text-align: center; box-shadow: inset 0 1px 0 rgba(245,158,11,0.05); transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(245,158,11,0.08); }
        .stat-card-accent { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 2px; border-radius: 1px; opacity: 0.5; }
        .stat-card-icon { width: 38px; height: 38px; border-radius: 12px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
        .stat-card-value { font-size: 28px; font-weight: 900; color: #f8fafc; font-variant-numeric: tabular-nums; line-height: 1; }
        .stat-card-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }

        /* ── Matches List ── */
        .matches-list-card { background: linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.92)); border-radius: 14px; overflow: hidden; box-shadow: inset 0 1px 0 rgba(245,158,11,0.04); }
        .match-row-item { display: flex; align-items: center; gap: 10px; padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.15s; }
        .match-row-item:last-child { border-bottom: none; }
        .match-row-item:hover { background: rgba(245,158,11,0.03); }
        .match-result-badge { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
        .match-team-line { display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 3px; }
        .match-team-line:last-child { margin-bottom: 0; }
        .match-team-logo { width: 16px; height: 16px; object-fit: contain; border-radius: 3px; flex-shrink: 0; }
        .live-badge { background: rgba(239,68,68,0.12); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 800; color: #ef4444; display: inline-flex; align-items: center; gap: 4px; }
        .live-dot-anim { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; animation: blink 1.2s infinite; }

        .empty-card { background: linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.92)); border-radius: 14px; padding: 40px 20px; text-align: center; grid-column: 1 / -1; }
        .empty-card p { font-size: 13px; color: #64748b; font-weight: 600; margin: 10px 0 0; }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .player-page { max-width: 900px; }
          .hero-content { padding: 20px 32px 0; gap: 24px; }
          .hero-photo { width: 130px; height: 130px; border-radius: 24px; }
          .hero-rating { width: 42px; height: 32px; font-size: 15px; }
          .hero-name { font-size: 32px; }
          .hero-info-bar { margin: 24px 32px 0; }
          .hero-info-value { font-size: 14px; }
          .hero-jersey-num { font-size: 140px; right: 32px; }
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
