"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, MapPin, Users, Search } from 'lucide-react';
import api from '../../api';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await api.get('/tournaments');
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
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Header */}
      <section className="relative glass rounded-3xl overflow-hidden mt-8 p-12 text-center border border-[var(--glass-border)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-color)]/10 to-[var(--primary-color)]/10 blur-3xl -z-10" />
        <Trophy size={48} className="mx-auto mb-6 text-[var(--accent-color)]" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Turnamen Resmi</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
          Jelajahi seluruh turnamen yang sedang berjalan, akan datang, dan yang telah selesai di Liga Bojonegoro.
        </p>
      </section>

      {/* Content */}
      <section>
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p className="mt-4">Memuat data turnamen...</p>
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="glass rounded-2xl p-8 relative overflow-hidden group hover:border-[var(--primary-color)] transition-all transform hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-color)]/5 rounded-full blur-3xl group-hover:bg-[var(--primary-color)]/15 transition-colors duration-500"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 rounded-2xl bg-[rgba(0,0,0,0.03)] border border-[var(--border-color)]">
                      <Trophy size={28} className="text-[var(--primary-color)]" />
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(tournament.status)} shadow-lg`}>
                      {tournament.status || 'Unknown'}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-[var(--primary-color)] transition-colors leading-tight text-[var(--text-primary)]">
                    {tournament.name}
                  </h3>
                  
                  <div className="flex flex-col gap-3 mb-8 mt-auto">
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <MapPin size={16} className="text-[var(--primary-color)]" />
                      <span className="font-medium">{tournament.location || 'Multiple Venues'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <Users size={16} className="text-[var(--accent-color)]" />
                      <span className="font-medium">{tournament.sport?.name || 'Multi-Sport'}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/tournaments/${tournament.uuid || tournament.id}`} 
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[rgba(0,0,0,0.03)] to-[rgba(0,0,0,0.01)] hover:from-[var(--primary-color)] hover:to-[var(--secondary-color)] hover:text-white border border-[var(--border-color)] hover:border-transparent text-center font-bold transition-all shadow-[var(--shadow-card)]"
                  >
                    Lihat Detail Turnamen
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center text-[var(--text-secondary)] border-dashed border-[var(--border-color)] flex flex-col items-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-xl">Belum ada turnamen yang tersedia.</p>
          </div>
        )}
      </section>
    </div>
  );
}
