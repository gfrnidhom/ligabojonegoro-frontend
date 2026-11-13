"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Newspaper } from 'lucide-react';
import api, { getImageUrl } from '../../api';

// "3 jam lalu" untuk berita baru, tanggal lengkap untuk berita lama
const formatNewsDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Ringkasan teks polos dari konten (bisa berisi HTML)
const makeExcerpt = (content, max = 160) => {
  if (!content) return '';
  const text = String(content)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

function NewsImage({ item, style }) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(item.image_path);
  if (!src || failed) {
    return (
      <div style={{ ...style, background: '#eef0f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Newspaper size={28} color="#94a3b8" />
      </div>
    );
  }
  return <img src={src} alt={item.title} onError={() => setFailed(true)} style={{ ...style, objectFit: 'cover' }} />;
}

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await api.get('/news');
        if (response.data.success) {
          const items = [...(response.data.data || [])].sort(
            (a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
          );
          setNews(items);
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const [featured, ...rest] = news;

  return (
    <div className="news-page" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px 96px', minHeight: 'calc(100vh - 72px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.push('/')}
          aria-label="Kembali ke beranda"
          style={{
            width: 36, height: 36, borderRadius: '50%', background: '#ffffff',
            border: '1px solid #eef0f3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0
          }}
        >
          <ArrowLeft size={18} color="#0f172a" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Berita</h1>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>Memuat berita terbaru...</p>
        </div>
      ) : news.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', border: '1px solid #eef0f3', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Newspaper size={28} color="#94a3b8" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>
            {error ? 'Gagal memuat berita' : 'Belum ada berita'}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            {error ? 'Periksa koneksi Anda lalu muat ulang halaman.' : 'Kembali lagi nanti untuk informasi terbaru.'}
          </p>
        </div>
      ) : (
        <>
          {/* Berita utama */}
          <Link href={`/news/${featured.slug}`} className="news-featured news-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="news-featured-img">
              <NewsImage item={featured} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div className="news-featured-body">
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#0f172a', lineHeight: 1.3, margin: '0 0 12px 0', letterSpacing: '-0.01em' }}>
                {featured.title}
              </h2>
              {makeExcerpt(featured.content) && (
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  {makeExcerpt(featured.content, 220)}
                </p>
              )}
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {featured.source || 'Liga Bojonegoro'} · {formatNewsDate(featured.published_at || featured.created_at)}
              </div>
            </div>
          </Link>

          {/* Berita lainnya */}
          {rest.length > 0 && (
            <div className="news-grid">
              {rest.map(item => (
                <Link key={item.id} href={`/news/${item.slug}`} className="news-card news-grid-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="news-grid-img">
                    <NewsImage item={item} style={{ width: '100%', height: '100%', display: 'block' }} />
                  </div>
                  <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.4, margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </h3>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 'auto' }}>
                      {item.source || 'Liga Bojonegoro'} · {formatNewsDate(item.published_at || item.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .news-card {
          background: #ffffff;
          border: 1px solid #eef0f3;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .news-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .news-featured { display: grid; grid-template-columns: 3fr 2fr; margin-bottom: 16px; }
        .news-featured-img { aspect-ratio: 16 / 9; min-height: 100%; }
        .news-featured-body { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
        .news-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .news-grid-item { display: flex; flex-direction: column; }
        .news-grid-img { aspect-ratio: 16 / 9; background: #eef0f3; }
        @media (max-width: 1024px) {
          .news-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
          .news-page { margin: 16px auto !important; padding: 0 12px 96px !important; }
          .news-featured { grid-template-columns: 1fr; }
          .news-featured-img { min-height: 0; }
          .news-featured-body { padding: 16px; }
          .news-featured-body h2 { font-size: 19px !important; }
          .news-grid { grid-template-columns: 1fr; gap: 12px; }
          .news-grid-item { flex-direction: row; }
          .news-grid-img { width: 112px; flex-shrink: 0; aspect-ratio: auto; min-height: 96px; }
          .news-grid-item h3 { font-size: 14px !important; }
        }
      `}} />
    </div>
  );
}
