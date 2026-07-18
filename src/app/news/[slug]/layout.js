import { getImageUrl } from '../../../api';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || params?.slug;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  try {
    let news = null;
    const singleRes = await fetch(`${apiUrl}/news/${slug}`, { next: { revalidate: 60 } }).catch(() => null);
    if (singleRes?.ok) {
      const singleData = await singleRes.json();
      news = singleData.data;
    }
    if (!news) {
      const listRes = await fetch(`${apiUrl}/news`, { next: { revalidate: 60 } });
      if (listRes.ok) {
        const listData = await listRes.json();
        news = listData.data?.find((n) => n.slug === slug);
      }
    }

    if (news) {
      const title = `${news.title} | Berita`;
      const description = news.excerpt || news.content?.slice(0, 160) || `Baca liputan dan berita lengkap tentang ${news.title} di turnamen Liga Bojonegoro.`;
      const imgPath = getImageUrl(news.image || news.thumbnail) || `${siteUrl}/favicon.ico`;

      return {
        title,
        description,
        openGraph: {
          title: `${news.title} | Berita Liga Bojonegoro`,
          description,
          url: `${siteUrl}/news/${slug}`,
          siteName: 'Liga Bojonegoro',
          type: 'article',
          publishedTime: news.created_at || news.date,
          modifiedTime: news.updated_at || news.created_at || news.date,
          authors: ['Liga Bojonegoro'],
          images: [
            {
              url: imgPath,
              width: 1200,
              height: 630,
              alt: news.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${news.title} | Berita Liga Bojonegoro`,
          description,
          images: [imgPath],
        },
        alternates: {
          canonical: `/news/${slug}`,
        },
      };
    }
  } catch (e) {
    console.error('Failed to generate metadata for news', e);
  }

  return {
    title: 'Berita & Artikel',
    description: 'Berita terbaru, wawancara, dan liputan seputar turnamen Liga Bojonegoro.',
    alternates: {
      canonical: `/news/${slug}`,
    },
  };
}

export default async function NewsDetailLayout({ children, params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || params?.slug;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  let jsonLd = null;
  try {
    let news = null;
    const singleRes = await fetch(`${apiUrl}/news/${slug}`, { next: { revalidate: 3600 } }).catch(() => null);
    if (singleRes?.ok) {
      const singleData = await singleRes.json();
      news = singleData.data;
    }
    if (!news) {
      const listRes = await fetch(`${apiUrl}/news`, { next: { revalidate: 3600 } });
      if (listRes.ok) {
        const listData = await listRes.json();
        news = listData.data?.find((n) => n.slug === slug);
      }
    }

    if (news) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: news.title,
        description: news.excerpt || news.content?.slice(0, 160) || news.title,
        image: [getImageUrl(news.image || news.thumbnail) || `${siteUrl}/favicon.ico`],
        datePublished: news.created_at || news.date || new Date().toISOString(),
        dateModified: news.updated_at || news.created_at || news.date || new Date().toISOString(),
        author: [
          {
            '@type': 'Organization',
            name: 'Liga Bojonegoro',
            url: siteUrl,
          },
        ],
        publisher: {
          '@type': 'Organization',
          name: 'Liga Bojonegoro',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/favicon.ico`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/news/${slug}`,
        },
      };
    }
  } catch (e) {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

