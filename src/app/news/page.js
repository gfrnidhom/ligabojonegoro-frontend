"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../../api';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMins = Math.floor((now - date) / (1000 * 60));
    return `${diffInMins} min ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  }
  return `${Math.floor(diffInHours / 24)} d ago`;
};

const CATEGORIES = ['Semua', 'Liga', 'Turnamen', 'Transfer', 'Lokal'];

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const router = useRouter();

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

  return (
    <div style={{ maxWidth: 768, margin: '0 auto', minHeight: 'calc(100vh - 72px)', paddingBottom: 120 }}>
      {/* Header */}
      <div 
        className="sticky top-0 lg:top-[72px] z-40"
        style={{ 
        padding: '20px 20px 16px', 
        background: 'rgba(242, 242, 242, 0.85)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', 
              border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <ArrowLeft size={18} color="#0f172a" />
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Berita</h1>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: activeCategory === cat ? 'none' : '1px solid #e2e8f0',
                background: activeCategory === cat ? '#0f172a' : '#fff',
                color: activeCategory === cat ? '#fff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 12, color: '#64748b', fontSize: 14, fontWeight: 500 }}>Memuat berita terbaru...</p>
        </div>
      ) : news.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {news.map((item, index) => {
            const isFirst = index === 0;
            const source = item.source || 'Liga Bojonegoro';
            
            if (isFirst) {
              return (
                <Link href={`/news/${item.slug}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '20px 20px 32px', borderBottom: '8px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '62.5%', borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
                    <img 
                      src={getImageUrl(item.image_path)} 
                      alt={item.title} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)' }}>
                      <Flame size={12} fill="currentColor" /> TRENDING
                    </div>
                  </div>
                  
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.35, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                    {item.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    <span style={{ color: '#3b82f6' }}>{source}</span>
                    <span style={{ margin: '0 6px' }}>•</span>
                    <span>{formatTimeAgo(item.published_at || item.created_at)}</span>
                  </div>
                </Link>
              );
            }

            return (
              <Link href={`/news/${item.slug}`} key={item.id} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: 16, padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', width: 104, height: 104, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
                  <img 
                    src={getImageUrl(item.image_path)} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.category || 'Berita'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                    <TrendingUp size={12} style={{ marginRight: 4 }} />
                    {formatTimeAgo(item.published_at || item.created_at)}
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>
      ) : (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
             <TrendingUp size={28} color="#94a3b8" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>Belum ada berita</p>
          <p style={{ fontSize: 14, margin: 0 }}>Kembali lagi nanti untuk informasi terbaru.</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
