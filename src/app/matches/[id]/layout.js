export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${baseUrl}/matches/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const m = data.data;
        const home = m.home_team?.name || 'Home';
        const away = m.away_team?.name || 'Away';
        const score = m.status === 'finished' || m.status === 'live' ? `(${m.home_score} - ${m.away_score})` : '';
        return {
          title: `${home} vs ${away} ${score} | Liga Bojonegoro`,
          description: `Live score, statistik, dan detail pertandingan antara ${home} melawan ${away} di turnamen ${m.tournament?.name || 'Liga Bojonegoro'}.`,
        };
      }
    }
  } catch (e) {}
  
  return {
    title: 'Detail Pertandingan | Liga Bojonegoro',
    description: 'Detail dan statistik pertandingan Liga Bojonegoro.',
  };
}

export default function MatchDetailLayout({ children }) {
  return children;
}
