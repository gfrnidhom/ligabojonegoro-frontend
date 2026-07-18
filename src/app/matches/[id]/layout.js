import { getImageUrl } from '../../../api';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  try {
    const res = await fetch(`${apiUrl}/matches/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const m = data.data;
        const home = m.home_team?.name || 'Home';
        const away = m.away_team?.name || 'Away';
        const score = m.status === 'finished' || m.status === 'live' ? `(${m.home_score} - ${m.away_score})` : '';
        const title = `${home} vs ${away} ${score} | Pertandingan`;
        const description = `Skor langsung, hasil akhir, statistik, formasi tim, dan detail pertandingan antara ${home} melawan ${away} dalam kompetisi ${m.tournament?.name || 'Liga Bojonegoro'}.`;
        const imgPath = getImageUrl(m.tournament?.logo_path || m.home_team?.logo_path || m.away_team?.logo_path || m.tournament?.logo || m.home_team?.logo || m.away_team?.logo) || `${siteUrl}/og-image.png`;

        return {
          title,
          description,
          openGraph: {
            title: `${home} vs ${away} ${score} | Liga Bojonegoro`,
            description,
            url: `${siteUrl}/matches/${id}`,
            siteName: 'Liga Bojonegoro',
            type: 'website',
            images: [
              {
                url: imgPath,
                width: 1200,
                height: 630,
                alt: `${home} vs ${away}`,
                type: 'image/png',
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title: `${home} vs ${away} ${score} | Liga Bojonegoro`,
            description,
            images: [imgPath],
          },
          alternates: {
            canonical: `/matches/${id}`,
          },
        };
      }
    }
  } catch (e) {
    console.error('Error generating metadata for match:', e);
  }

  return {
    title: 'Detail Pertandingan',
    description: 'Detail dan statistik pertandingan resmi Liga Bojonegoro.',
    alternates: {
      canonical: `/matches/${id}`,
    },
  };
}

export default async function MatchDetailLayout({ children, params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

  let jsonLd = null;
  try {
    const res = await fetch(`${apiUrl}/matches/${id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const m = data.data;
        const home = m.home_team?.name || 'Home Team';
        const away = m.away_team?.name || 'Away Team';
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'SportsEvent',
          name: `${home} vs ${away}`,
          description: `Pertandingan ${home} melawan ${away} di ${m.tournament?.name || 'Liga Bojonegoro'}`,
          startDate: m.match_date || m.date || new Date().toISOString(),
          location: {
            '@type': 'Place',
            name: m.venue || m.location || 'Stadion Bojonegoro',
          },
          competitor: [
            {
              '@type': 'SportsTeam',
              name: home,
            },
            {
              '@type': 'SportsTeam',
              name: away,
            },
          ],
          superEvent: m.tournament ? {
            '@type': 'SportsEvent',
            name: m.tournament.name,
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


