import { getImageUrl } from '../../../api';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  try {
    const res = await fetch(`${apiUrl}/tournaments/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const t = data.data;
        const title = `${t.name} | Turnamen`;
        const description = t.description || `Klasemen terbaru, jadwal pertandingan, hasil lengkap, dan daftar tim turnamen ${t.name} di Liga Bojonegoro.`;
        const imgPath = getImageUrl(t.logo || t.banner || t.image) || `${siteUrl}/favicon.ico`;

        return {
          title,
          description,
          openGraph: {
            title: `${t.name} | Turnamen Liga Bojonegoro`,
            description,
            url: `${siteUrl}/tournaments/${id}`,
            siteName: 'Liga Bojonegoro',
            type: 'website',
            images: [
              {
                url: imgPath,
                width: 1200,
                height: 630,
                alt: `${t.name} Logo`,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: `${t.name} | Turnamen Liga Bojonegoro`,
            description,
            images: [imgPath],
          },
          alternates: {
            canonical: `/tournaments/${id}`,
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating metadata for tournament:', e);
  }

  return {
    title: 'Detail Turnamen',
    description: 'Informasi lengkap, klasemen, dan jadwal pertandingan turnamen Liga Bojonegoro.',
    alternates: {
      canonical: `/tournaments/${id}`,
    },
  };
}

export default async function TournamentDetailLayout({ children, params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  let jsonLd = null;
  try {
    const res = await fetch(`${apiUrl}/tournaments/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const t = data.data;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: t.name,
          description: t.description || `Turnamen ${t.name} Liga Bojonegoro`,
          url: `${siteUrl}/tournaments/${id}`,
          image: getImageUrl(t.logo || t.banner || t.image) || `${siteUrl}/favicon.ico`,
          organizer: {
            '@type': 'Organization',
            name: 'Liga Bojonegoro',
            url: siteUrl,
          },
        };
      }
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

