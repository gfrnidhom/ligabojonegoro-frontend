"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Trophy, Shield, ArrowLeft } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ tournaments: [], teams: [], players: [] });
  const [searchInput, setSearchInput] = useState(query);

  const avatar = (name, bg = 'f59e0b') => {
    if (!name) return `https://ui-avatars.com/api/?name=S&background=${bg}&color=fff&bold=true`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true`;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [tRes, tmRes, pRes] = await Promise.all([
          api.get('/tournaments').catch(() => ({ data: { success: false } })),
          api.get('/teams').catch(() => ({ data: { success: false } })),
          api.get('/players', { params: { per_page: 500 } }).catch(() => ({ data: { success: false } })),
        ]);
        
        const qLower = query.toLowerCase();
        
        const tournaments = (tRes.data?.success ? tRes.data.data : []).filter(t => 
          t.name.toLowerCase().includes(qLower) || (t.location && t.location.toLowerCase().includes(qLower))
        );
        
        const teams = (tmRes.data?.success ? tmRes.data.data : []).filter(t => 
          t.name.toLowerCase().includes(qLower) || (t.coach_name && t.coach_name.toLowerCase().includes(qLower))
        );
        
        const players = (pRes.data?.success ? pRes.data.data : []).filter(p => 
          p.name.toLowerCase().includes(qLower)
        );

        setResults({ tournaments, teams, players });
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    };
    
    setSearchInput(query);
    fetchAllData();
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if(searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const totalResults = results.tournaments.length + results.teams.length + results.players.length;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px 80px' }}>
      
      {/* Mobile Back Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(245,158,11,0.08)', border: 'none',
            borderRadius: 12, width: 42, height: 42, cursor: 'pointer', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Hasil Pencarian</span>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }} />
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari tim, pemain, turnamen..." 
            style={{
              width: '100%', height: 56, 
              background: 'linear-gradient(145deg, rgba(245,158,11,0.06), rgba(13,17,23,0.9))', 
              border: '1px solid rgba(245,158,11,0.2)', borderRadius: 9999,
              padding: '0 24px 0 48px', color: '#f8fafc', fontSize: 15, fontWeight: 600, outline: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(245,158,11,0.1)'
            }}
          />
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <div className="loader"></div>
          <span style={{ marginTop: 16, color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Mencari "{query}"...</span>
        </div>
      ) : !query ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Mulai Pencarian</h2>
          <p style={{ fontSize: 14 }}>Ketikkan kata kunci untuk mencari turnamen, tim, atau pemain.</p>
        </div>
      ) : totalResults === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Tidak Ada Hasil</h2>
          <p style={{ fontSize: 14 }}>Kami tidak dapat menemukan hasil untuk "{query}". Coba kata kunci lain.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Tournaments Section */}
          {results.tournaments.length > 0 && (
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={18} color="#f59e0b" /> Turnamen ({results.tournaments.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.tournaments.map(t => (
                  <Link href={`/tournaments/${t.uuid || t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.8))',
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                      <img src={getImageUrl(t.logo_path) || avatar(t.name)} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.05)' }} alt="" />
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{t.name}</h4>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.location || 'Bojonegoro'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Teams Section */}
          {results.teams.length > 0 && (
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="#f59e0b" /> Tim ({results.teams.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.teams.map(t => (
                  <Link href={`/teams/${t.uuid || t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.8))',
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                      <img src={getImageUrl(t.logo_path) || avatar(t.name)} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.05)' }} alt="" />
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{t.name}</h4>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.sport?.name || 'Cabang Umum'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Players Section */}
          {results.players.length > 0 && (
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#f59e0b" /> Pemain ({results.players.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.players.map(p => (
                  <Link href={`/players/${p.uuid || p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(13,17,23,0.8))',
                      border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                      <img src={getImageUrl(p.photo_path) || avatar(p.name)} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} alt="" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                        <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.team?.name || '-'}</span>
                      </div>
                      {p.position && (
                         <div style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 10, fontWeight: 800 }}>
                           {p.position}
                         </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
