"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Trophy, Shield, ArrowLeft } from 'lucide-react';
import api, { getImageUrl } from '../../api';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ tournaments: [], teams: [], players: [] });
  const [searchInput, setSearchInput] = useState(query);

  const avatar = (name, bg = '3b82f6') => {
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
    <div className="page-container animate-fade-in" style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px 80px' }}>
      
      {/* Mobile Back Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 12, width: 42, height: 42, cursor: 'pointer', color: '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Hasil Pencarian</span>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari turnamen, tim, atau pemain..." 
            style={{
              width: '100%', height: 56, 
              background: '#ffffff', 
              border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 16,
              padding: '0 24px 0 54px', color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#000000'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'}
          />
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <div className="loader"></div>
          <span style={{ marginTop: 16, color: '#64748b', fontSize: 12, fontWeight: 500 }}>Mencari "{query}"...</span>
        </div>
      ) : !query ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: '#0f172a' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Mulai Pencarian</h2>
          <p style={{ fontSize: 12 }}>Ketikkan kata kunci untuk mencari turnamen, tim, atau pemain.</p>
        </div>
      ) : totalResults === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: '#0f172a' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Tidak Ada Hasil</h2>
          <p style={{ fontSize: 12 }}>Kami tidak dapat menemukan hasil untuk "{query}". Coba kata kunci lain.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Tournaments Section */}
          {results.tournaments.length > 0 && (
            <section>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={18} color="#eab308" /> Turnamen ({results.tournaments.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.tournaments.map(t => (
                  <Link href={`/tournaments/${t.uuid || t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <img src={getImageUrl(t.logo_path) || avatar(t.name, '3b82f6')} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.03)' }} alt="" />
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t.name}</h4>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{t.location || 'Bojonegoro'}</span>
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
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="#10b981" /> Tim ({results.teams.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.teams.map(t => (
                  <Link href={`/teams/${t.uuid || t.id}`} key={t.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <img src={getImageUrl(t.logo_path) || avatar(t.name, '10b981')} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.03)' }} alt="" />
                      <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t.name}</h4>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{t.sport?.name || 'Cabang Umum'}</span>
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
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#6366f1" /> Pemain ({results.players.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {results.players.map(p => (
                  <Link href={`/players/${p.uuid || p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid rgba(0, 0, 0, 0.05)', borderRadius: 16, padding: '16px',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                      <img src={getImageUrl(p.photo_path) || avatar(p.name, '6366f1')} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.03)' }} alt="" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                        <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.team?.name || '-'}</span>
                      </div>
                      {p.position && (
                         <div style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 9, fontWeight: 800 }}>
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0' }}>
        <div className="loader"></div>
        <span style={{ marginTop: 16, color: '#64748b', fontSize: 12, fontWeight: 500 }}>Memuat pencarian...</span>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
