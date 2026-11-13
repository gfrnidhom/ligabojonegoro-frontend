"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Check, Newspaper } from 'lucide-react';
import api, { getImageUrl } from '../../../api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const looksLikeHtml = (text) => /<\/?(p|br|div|h[1-6]|ul|ol|li|strong|em|a|img|blockquote)\b/i.test(text || '');

// Isi berita dari admin bisa berupa HTML atau teks biasa dengan baris baru.
function ArticleBody({ content }) {
  if (!content) return null;
  if (looksLikeHtml(content)) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  const paragraphs = String(content)
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);
  return (
    <div className="article-body">
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function NewsImage({ item, style }) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(item?.image_path);
  if (!src || failed) {
    return (
      <div style={{ ...style, background: '#eef0f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Newspaper size={28} color="#94a3b8" />
      </div>
    );
  }
  return <img src={src} alt={item.title} onError={() => setFailed(true)} style={{ ...style, objectFit: 'cover' }} />;
}

export default function NewsDetailPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();

  const [news, setNews] = useState(null);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const [detailRes, listRes] = await Promise.allSettled([
          api.get(`/news/${slug}`),
          api.get('/news'),
        ]);
        const list = listRes.status === 'fulfilled' && listRes.value.data?.success ? (listRes.value.data.data || []) : [];
        let item = detailRes.status === 'fulfilled' && detailRes.value.data?.success ? detailRes.value.data.data : null;
        if (!item) item = list.find(n => n.slug === slug) || null;
        if (cancelled) return;
        if (!item && detailRes.status === 'rejected' && listRes.status === 'rejected') setError(true);
        setNews(item);
        setOthers(
          list
            .filter(n => n.slug !== slug)
            .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
            .slice(0, 5)
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: news?.title, url }); } catch { /* dibatalkan */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard tidak tersedia */ }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader"></div>
        <p style={{ marginTop: 14, color: '#64748b', fontSize: 13 }}>Memuat berita...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          {error ? 'Gagal memuat berita' : 'Berita tidak ditemukan'}
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
          {error ? 'Periksa koneksi Anda lalu muat ulang halaman.' : 'Berita yang Anda cari mungkin telah dihapus atau tautannya tidak valid.'}
        </p>
        <button onClick={() => router.push('/news')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Kembali ke Berita
        </button>
      </div>
    );
  }

  const isDraft = news.is_published === 0 || news.is_published === false || news.is_published === 'False';

  return (
    <div className="news-detail-page" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 16px 96px' }}>
      <div className="news-detail-grid">
        {/* Artikel */}
        <article className="news-detail-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '20px 28px 0' }} className="article-pad">
            <button
              onClick={() => router.push('/news')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #eef0f3', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Berita
            </button>
            <button
              onClick={handleShare}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #eef0f3', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: copied ? '#16a34a' : '#0f172a', cursor: 'pointer' }}
            >
              {copied ? <><Check size={15} /> Link disalin</> : <><Share2 size={15} /> Bagikan</>}
            </button>
          </div>

          <header className="article-pad" style={{ padding: '24px 28px 20px' }}>
            {isDraft && (
              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#fef3c7', color: '#b45309', borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                DRAFT
              </span>
            )}
            <h1 className="article-title" style={{ fontSize: 32, fontWeight: 600, color: '#0f172a', lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.015em' }}>
              {news.title}
            </h1>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {news.author || news.source || 'Liga Bojonegoro'} · {formatDate(news.published_at || news.created_at)}
            </div>
          </header>

          <div className="article-cover">
            <NewsImage item={news} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          <div className="article-pad" style={{ padding: '28px 28px 36px' }}>
            <ArticleBody content={news.content} />
          </div>
        </article>

        {/* Berita lainnya */}
        {others.length > 0 && (
          <aside className="news-detail-card news-detail-aside">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0, padding: '18px 18px 8px' }}>Berita Lainnya</h2>
            {others.map(item => (
              <Link key={item.id} href={`/news/${item.slug}`} className="other-news-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 88, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <NewsImage item={item} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{formatShortDate(item.published_at || item.created_at)}</div>
                </div>
              </Link>
            ))}
          </aside>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .news-detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
        .news-detail-card { background: #fff; border: 1px solid #eef0f3; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .news-detail-aside { position: sticky; top: 88px; padding-bottom: 8px; }
        .article-cover { aspect-ratio: 16 / 9; background: #eef0f3; }
        .other-news-item { display: flex; gap: 12px; padding: 12px 18px; border-top: 1px solid #f1f5f9; transition: background 0.15s; }
        .other-news-item:hover { background: #f8fafc; }
        .article-body { color: #1e293b; font-size: 16px; line-height: 1.8; }
        .article-body p { margin: 0 0 1.2em; }
        .article-body p:last-child { margin-bottom: 0; }
        .article-body h2 { color: #0f172a; font-weight: 600; margin: 1.8em 0 0.6em; font-size: 1.35em; }
        .article-body h3 { color: #0f172a; font-weight: 600; margin: 1.5em 0 0.5em; font-size: 1.15em; }
        .article-body a { color: #2563eb; text-decoration: underline; }
        .article-body ul, .article-body ol { padding-left: 1.5em; margin: 0 0 1.2em; }
        .article-body li { margin-bottom: 0.4em; }
        .article-body blockquote { border-left: 3px solid #cbd5e1; margin: 1.5em 0; padding: 0.2em 0 0.2em 1em; color: #475569; }
        .article-body img { border-radius: 12px; margin: 1.5em 0; max-width: 100%; height: auto; }
        @media (max-width: 960px) {
          .news-detail-grid { grid-template-columns: 1fr; }
          .news-detail-aside { position: static; }
        }
        @media (max-width: 640px) {
          .news-detail-page { margin: 12px auto !important; padding: 0 12px 96px !important; }
          .article-pad { padding-left: 16px !important; padding-right: 16px !important; }
          .article-title { font-size: 23px !important; }
          .article-body { font-size: 15px; line-height: 1.75; }
        }
      `}} />
    </div>
  );
}
