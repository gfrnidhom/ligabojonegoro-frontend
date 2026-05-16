export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${baseUrl}/tournaments/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        return {
          title: `${data.data.name} | Turnamen Liga Bojonegoro`,
          description: `Klasemen, jadwal, dan informasi lengkap tentang turnamen ${data.data.name}.`,
        };
      }
    }
  } catch (e) {}
  
  return {
    title: 'Detail Turnamen | Liga Bojonegoro',
    description: 'Informasi lengkap turnamen Liga Bojonegoro.',
  };
}

export default function TournamentDetailLayout({ children }) {
  return children;
}
