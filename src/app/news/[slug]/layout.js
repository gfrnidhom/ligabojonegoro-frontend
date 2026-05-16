export async function generateMetadata({ params }) {
  // We extract slug from params. Because this is a Server Component layout, 
  // we can fetch data directly or just set a generic title.
  // For dynamic data we should use native fetch.
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  
  try {
    const res = await fetch(`${baseUrl}/news`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const news = data.data?.find(n => n.slug === params.slug);
      if (news) {
        return {
          title: `${news.title} | Berita Liga Bojonegoro`,
          description: news.excerpt || `Baca berita lengkap tentang ${news.title} di Liga Bojonegoro.`,
        };
      }
    }
  } catch (e) {
    console.error('Failed to generate metadata for news', e);
  }
  
  return {
    title: 'Berita Liga Bojonegoro',
    description: 'Berita terbaru seputar turnamen Liga Bojonegoro.',
  };
}

export default function NewsDetailLayout({ children }) {
  return children;
}
