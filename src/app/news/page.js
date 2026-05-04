"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, Calendar, Search } from 'lucide-react';
import api from '../../api';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get('/news');
        if (response.data.success) {
          setNews(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000';
    return `${baseUrl}/storage/${path}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Header */}
      <section className="relative glass rounded-3xl overflow-hidden mt-8 p-12 text-center border border-[var(--glass-border)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-color)]/10 to-[var(--secondary-color)]/10 blur-3xl -z-10" />
        <Newspaper size={48} className="mx-auto mb-6 text-[var(--primary-color)]" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Berita Terbaru</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
          Dapatkan pembaruan terkini, pengumuman, dan artikel eksklusif dari Liga Bojonegoro.
        </p>
      </section>

      {/* Content */}
      <section>
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p className="mt-4">Memuat berita...</p>
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Link href={`/news/${item.slug}`} key={item.id} className="group">
                <div className="glass rounded-2xl overflow-hidden h-full flex flex-col hover:border-[var(--primary-color)] transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative h-56 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url('${getImageUrl(item.image_path)}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-80" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-4 bg-[rgba(0,0,0,0.03)] w-max px-3 py-1 rounded-full border border-[var(--border-color)]">
                      <Calendar size={14} />
                      <span>{formatDate(item.published_at)}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--primary-color)] transition-colors leading-tight text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] line-clamp-3 text-sm mb-6 flex-grow">
                      {item.excerpt || item.content?.substring(0, 120).replace(/(<([^>]+)>)/gi, "") + '...'}
                    </p>
                    <div className="mt-auto text-[var(--primary-color)] text-sm font-semibold flex items-center gap-2">
                      Baca Selengkapnya <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-16 text-center text-[var(--text-secondary)] border-dashed border-[var(--border-color)] flex flex-col items-center">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-xl">Belum ada berita yang diterbitkan.</p>
          </div>
        )}
      </section>
    </div>
  );
}
