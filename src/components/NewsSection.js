"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, ArrowRight, Calendar } from 'lucide-react';
import api from '../api';

export default function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get('/news', { params: { per_page: 3 } });
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
    <section className="mt-16 delay-200 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-gradient text-3xl flex items-center gap-3">
          <Newspaper size={28} className="text-[var(--primary-color)]" />
          Berita Terbaru
        </h2>
        <Link href="/news" className="text-gradient-accent flex items-center gap-2 hover:scale-105 transition-transform font-semibold">
          Lihat Semua <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-container min-h-[200px]">
          <div className="loader"></div>
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link href={`/news/${item.slug}`} key={item.id} className="group">
              <div className="glass rounded-2xl overflow-hidden h-full flex flex-col hover:border-[var(--primary-color)] transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-48 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${getImageUrl(item.image_path)}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] to-transparent opacity-80" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-3">
                    <Calendar size={14} />
                    <span>{formatDate(item.published_at)}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--primary-color)] transition-colors line-clamp-2 text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] line-clamp-3 text-sm mb-4 flex-grow">
                    {item.excerpt || item.content?.substring(0, 100).replace(/(<([^>]+)>)/gi, "") + '...'}
                  </p>
                  <div className="mt-auto text-[var(--accent-color)] text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Baca Selengkapnya <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center text-[var(--text-secondary)]">
          Belum ada berita yang diterbitkan.
        </div>
      )}
    </section>
  );
}
