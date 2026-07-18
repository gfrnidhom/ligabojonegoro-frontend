import { getImageUrl } from '../../../api';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  try {
    const res = await fetch(`${apiUrl}/teams/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const team = data.data;
        const title = `${team.name} | Profil Tim`;
        const description = `Profil lengkap klub ${team.name}, daftar pemain skuad terbaru, rekor pertandingan, dan statistik performa di turnamen Liga Bojonegoro.`;
        const imgPath = getImageUrl(team.logo || team.image) || `${siteUrl}/favicon.ico`;

        return {
          title,
          description,
          openGraph: {
            title: `${team.name} | Tim Liga Bojonegoro`,
            description,
            url: `${siteUrl}/teams/${id}`,
            siteName: 'Liga Bojonegoro',
            type: 'website',
            images: [
              {
                url: imgPath,
                width: 800,
                height: 800,
                alt: `${team.name} Logo`,
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: `${team.name} | Tim Liga Bojonegoro`,
            description,
            images: [imgPath],
          },
          alternates: {
            canonical: `/teams/${id}`,
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating metadata for team:', e);
  }

  return {
    title: 'Profil Tim',
    description: 'Profil resmi, skuad pemain, dan statistik tim Liga Bojonegoro.',
    alternates: {
      canonical: `/teams/${id}`,
    },
  };
}

export default async function TeamDetailLayout({ children, params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  let jsonLd = null;
  try {
    const res = await fetch(`${apiUrl}/teams/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const team = data.data;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'SportsTeam',
          name: team.name,
          url: `${siteUrl}/teams/${id}`,
          logo: getImageUrl(team.logo || team.image) || `${siteUrl}/favicon.ico`,
          sport: 'Football',
          memberOf: {
            '@type': 'SportsOrganization',
            name: 'Liga Bojonegoro',
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

