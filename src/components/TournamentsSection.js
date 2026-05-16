"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowRight, MapPin, Users } from 'lucide-react';
import api from '../api';

export default function TournamentsSection() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get('/tournaments', { params: { per_page: 3 } });
        if (response.data.success) {
          setTournaments(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'completed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <section className="mt-16 delay-300 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-gradient text-3xl flex items-center gap-3">
          <Trophy size={28} className="text-[var(--primary-color)]" />
          Turnamen Pilihan
        </h2>
        <Link href="/tournaments" className="text-gradient-accent flex items-center gap-2 hover:scale-105 transition-transform font-semibold">
          Lihat Semua <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-container min-h-[200px]">
          <div className="loader"></div>
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="glass rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--primary-color)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-color)]/5 rounded-full blur-2xl group-hover:bg-[var(--primary-color)]/10 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-[rgba(0,0,0,0.03)] border border-[var(--border-color)]">
                    <Trophy size={24} className="text-[var(--primary-color)]" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusColor(tournament.status)}`}>
                    {tournament.status || 'Tidak Diketahui'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--primary-color)] transition-colors text-[var(--text-primary)]">
                  {tournament.name}
                </h3>
                
                <div className="flex flex-col gap-2 mb-6 mt-auto">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin size={14} />
                    <span>{tournament.location || 'Banyak Lokasi'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Users size={14} />
                    <span>{tournament.sport?.name || 'Multi-Olahraga'}</span>
                  </div>
                </div>
                
                <Link 
                  href={`/tournaments/${tournament.uuid || tournament.id}`} 
                  className="w-full py-3 rounded-xl bg-[rgba(0,0,0,0.03)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--border-color)] hover:border-transparent text-center font-semibold transition-all"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center text-[var(--text-secondary)]">
          Belum ada turnamen yang tersedia saat ini.
        </div>
      )}
    </section>
  );
}
