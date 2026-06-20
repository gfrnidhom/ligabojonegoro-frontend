"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

export default function NewsDetailPage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const router = useRouter();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        // First try to fetch all news and find by slug, 
        // since we might not have a dedicated /news/{slug} endpoint
        const response = await api.get('/news');
        if (response.data.success) {
          const found = response.data.data.find(n => n.slug === slug);
          if (found) {
            // We can also fetch the exact detail if the endpoint exists: api.get(`/news/${found.id}`)
            setNews(found);
          }
        }
      } catch (error) {
        console.error('Error fetching news detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchNewsDetail();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news?.title,
        text: news?.excerpt || 'Berita Liga Bojonegoro',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link berhasil disalin!');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Memuat berita...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Berita Tidak Ditemukan</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Berita yang Anda cari mungkin telah dihapus atau URL tidak valid.</p>
        <button onClick={() => router.push('/news')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Berita
        </button>
      </div>
    );
  }

  const coverImage = getImageUrl(news.image_path) || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  return (
    <article className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 120px' }}>
      
      {/* Navigation */}
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={() => router.push('/news')}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, 
            color: '#6b7280', fontSize: 14, fontWeight: 600, 
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 0', transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
        >
          <ArrowLeft size={16} /> Kembali ke Berita
        </button>
      </div>

      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        {news.is_published === 0 && (
          <span style={{ 
            display: 'inline-block', padding: '4px 12px', background: 'rgba(245,158,11,0.15)', 
            color: '#f59e0b', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 16 
          }}>
            DRAFT
          </span>
        )}
        
        <h1 style={{ 
          fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: '#111827', 
          lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.02em' 
        }}>
          {news.title}
        </h1>
        
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, 
          color: '#6b7280', fontSize: 13, fontWeight: 500,
          borderBottom: '1px solid #e5e7eb', paddingBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} />
            <span>{formatDate(news.published_at || news.created_at)}</span>
          </div>
          {news.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={16} />
              <span>{news.author}</span>
            </div>
          )}
          <button 
            onClick={handleShare}
            style={{ 
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20,
              padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Share2 size={14} /> Bagikan
          </button>
        </div>
      </header>

      {/* Cover Image */}
      <div style={{ 
        width: '100%', aspectRatio: '16/9', borderRadius: 24, overflow: 'hidden',
        marginBottom: 40, background: '#f1f5f9', border: '1px solid #e5e7eb'
      }}>
        <img 
          src={coverImage} 
          alt={news.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>

      {/* Content */}
      <div 
        className="prose prose-lg max-w-none"
        style={{ color: '#374151', lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: news.content }} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        .prose p { margin-bottom: 1.5em; }
        .prose h2 { color: #111827; font-weight: 700; margin-top: 2em; margin-bottom: 0.8em; font-size: 1.5em; letter-spacing: -0.01em; }
        .prose h3 { color: #1f2937; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.6em; font-size: 1.25em; letter-spacing: -0.01em; }
        .prose a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .prose a:hover { text-decoration: underline; color: #1d4ed8; }
        .prose ul, .prose ol { padding-left: 1.5em; margin-bottom: 1.5em; }
        .prose li { margin-bottom: 0.5em; }
        .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; color: #6b7280; font-style: italic; background: #f8fafc; padding: 1em; border-radius: 0 8px 8px 0; }
        .prose img { border-radius: 12px; margin: 2em 0; max-width: 100%; height: auto; border: 1px solid #e5e7eb; }
      `}} />

    </article>
  );
}
