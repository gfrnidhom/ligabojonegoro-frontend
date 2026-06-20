export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  try {
    const res = await fetch(`${baseUrl}/players/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        return {
          title: `${data.data.name} | Profil Pemain Liga Bojonegoro`,
          description: `Statistik dan profil lengkap ${data.data.name} dari tim ${data.data.team?.name || '-'} di Liga Bojonegoro.`,
        };
      }
    }
  } catch (e) {}
  
  return {
    title: 'Profil Pemain | Liga Bojonegoro',
    description: 'Profil dan statistik pemain Liga Bojonegoro.',
  };
}

export default function PlayerDetailLayout({ children }) {
  return children;
}
