export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';
  try {
    const res = await fetch(`${baseUrl}/teams/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        return {
          title: `${data.data.name} | Tim Liga Bojonegoro`,
          description: `Profil tim ${data.data.name}, daftar pemain, dan statistik di Liga Bojonegoro.`,
        };
      }
    }
  } catch (e) {}
  
  return {
    title: 'Profil Tim | Liga Bojonegoro',
    description: 'Profil dan daftar pemain tim Liga Bojonegoro.',
  };
}

export default function TeamDetailLayout({ children }) {
  return children;
}
