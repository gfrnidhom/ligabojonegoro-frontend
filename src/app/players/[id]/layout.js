import { getImageUrl } from '../../../api';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  try {
    const res = await fetch(`${apiUrl}/players/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const player = data.data;
        const title = `${player.name} | Profil Pemain`;
        const description = `Profil, biodata, rekor gol, assist, dan statistik performa ${player.name} dari tim ${player.team?.name || '-'} di Liga Bojonegoro.`;
        const imgPath = getImageUrl(player.photo_path || player.image_path || player.photo || player.image) || `${siteUrl}/og-image.png`;

        return {
          title,
          description,
          openGraph: {
            title: `${player.name} | Profil Pemain Liga Bojonegoro`,
            description,
            url: `${siteUrl}/players/${id}`,
            siteName: 'Liga Bojonegoro',
            type: 'profile',
            images: [
              {
                url: imgPath,
                width: 800,
                height: 800,
                alt: `${player.name} Foto`,
                type: 'image/png',
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: `${player.name} | Pemain Liga Bojonegoro`,
            description,
            images: [imgPath],
          },
          alternates: {
            canonical: `/players/${id}`,
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating metadata for player:', e);
  }

  return {
    title: 'Profil Pemain',
    description: 'Profil biodata dan statistik pemain di Liga Bojonegoro.',
    alternates: {
      canonical: `/players/${id}`,
    },
  };
}

export default async function PlayerDetailLayout({ children, params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  let jsonLd = null;
  try {
    const res = await fetch(`${apiUrl}/players/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const player = data.data;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: player.name,
          url: `${siteUrl}/players/${id}`,
          image: getImageUrl(player.photo_path || player.image_path || player.photo || player.image) || `${siteUrl}/og-image.png`,
          jobTitle: 'Football Player',
          memberOf: player.team ? {
            '@type': 'SportsTeam',
            name: player.team.name,
          } : undefined,
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


