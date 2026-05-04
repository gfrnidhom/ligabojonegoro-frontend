"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, MapPin, Search } from 'lucide-react';
import api, { getImageUrl } from '../../api';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!path) return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=200`;
    return getImageUrl(path);
  };


  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Header */}
      <section className="relative glass rounded-3xl overflow-hidden mt-8 p-12 text-center border border-[var(--glass-border)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#4facfe]/10 to-[#00f2fe]/10 blur-3xl -z-10" />
        <Shield size={48} className="mx-auto mb-6 text-[#00f2fe]" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Klub & Tim</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
          Profil klub, skuad, dan statistik lengkap dari tim-tim kebanggaan yang berlaga di Liga Bojonegoro.
        </p>
      </section>

      {/* Content */}
      <section>
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p className="mt-4">Memuat data tim...</p>
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teams.map((team) => (
              <Link href={`/teams/${team.id}`} key={team.id} className="group">
                <div className="glass rounded-2xl p-6 h-full flex flex-col items-center text-center hover:border-[var(--primary-color)] transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-[var(--primary-color)] blur-2xl opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
                    <div className="w-24 h-24 rounded-full bg-[rgba(0,0,0,0.03)] border border-[var(--glass-border)] p-2 relative z-10 mx-auto">
                      <img 
                        src={getTeamLogoUrl(team.logo_path, team.name)} 
                        alt={team.name} 
                        className="w-full h-full object-contain rounded-full" 
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--primary-color)] transition-colors">
                    {team.name}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
                    <MapPin size={14} />
                    <span>{team.city || 'Kota Tidak Diketahui'}</span>
                  </div>
                  
                  {team.sport && (
                    <span className="mt-auto px-3 py-1 bg-[rgba(0,0,0,0.03)] border border-[var(--border-color)] rounded-full text-xs font-semibold">
                      {team.sport.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center text-[var(--text-secondary)] border-dashed border-[var(--border-color)] flex flex-col items-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-xl">Belum ada tim yang terdaftar.</p>
          </div>
        )}
      </section>
    </div>
  );
}
