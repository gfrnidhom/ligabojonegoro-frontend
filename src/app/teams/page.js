"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, MapPin, Search, ChevronRight } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get('/teams');
        if (response.data.success) {
          setTeams(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const getTeamLogoUrl = (path, name) => {
    if (!path) return `https://ui-avatars.com/api/?name=${name}&background=000000&color=fff&size=200`;
    return getImageUrl(path);
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (team.city && team.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '24px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Shield size={32} color="var(--text-primary)" />
            Klub & Tim
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
            Jelajahi profil, skuad, dan statistik lengkap dari tim-tim Liga Bojonegoro.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', pointerEvents: 'none' }}>
            <Search size={18} color="var(--text-muted)" />
          </div>
          <input
            type="text"
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
            placeholder="Cari nama klub atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '20px' 
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border-light)', marginBottom: '16px' }} />
                <div style={{ height: '20px', width: '60%', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '12px' }} />
                <div style={{ height: '14px', width: '40%', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '24px' }} />
                <div style={{ height: '1px', width: '100%', background: 'var(--border-light)', margin: 'auto 0 16px 0' }} />
                <div style={{ height: '24px', width: '80px', background: 'var(--border-light)', borderRadius: '12px', alignSelf: 'flex-start' }} />
              </div>
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '20px' 
          }}>
            {filteredTeams.map((team) => (
              <Link href={`/teams/${team.uuid || team.id}`} key={team.id} style={{ display: 'block', textDecoration: 'none' }}>
                <div 
                  className="card" 
                  style={{ 
                    padding: '24px 24px 16px', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div style={{ 
                    width: '90px', 
                    height: '90px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border)', 
                    padding: '8px', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={getTeamLogoUrl(team.logo_path, team.name)} 
                      alt={team.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${team.name}&background=000000&color=fff&size=200`;
                      }}
                    />
                  </div>
                  
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)', 
                    marginBottom: '6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {team.name}
                  </h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    color: 'var(--text-secondary)',
                    marginBottom: '24px'
                  }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>{team.city || 'Kota Tidak Diketahui'}</span>
                  </div>
                  
                  <div style={{ 
                    marginTop: 'auto', 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    borderTop: '1px solid var(--border)', 
                    paddingTop: '16px' 
                  }}>
                    {team.sport ? (
                      <span style={{ 
                        padding: '4px 12px', 
                        background: 'var(--bg-subtle)', 
                        color: 'var(--text-secondary)', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: '600' 
                      }}>
                        {team.sport.name}
                      </span>
                    ) : (
                      <span style={{ 
                        padding: '4px 12px', 
                        background: 'transparent', 
                        color: 'transparent', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        userSelect: 'none'
                      }}>
                        Sport
                      </span>
                    )}
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: 'var(--primary)'
                    }}>
                      Profil <ChevronRight size={14} style={{ marginLeft: '2px' }} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card" style={{ 
            padding: '64px 24px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '300px'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'var(--bg-subtle)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '24px' 
            }}>
              <Search size={28} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Tim tidak ditemukan
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
              Maaf, kami tidak dapat menemukan tim yang sesuai dengan pencarian "{searchQuery}". Coba gunakan kata kunci lain.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              style={{ 
                padding: '10px 24px', 
                background: 'var(--primary)', 
                color: 'var(--text-inverse)', 
                borderRadius: '8px', 
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
