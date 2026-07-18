export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1';

  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'always', priority: 1.0 },
    { url: `${baseUrl}/live`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/standings`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/matches`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/tournaments`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/teams`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/players`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/stats`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  const dynamicRoutes = [];

  try {
    const [tournamentsRes, teamsRes, newsRes] = await Promise.all([
      fetch(`${apiUrl}/tournaments`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${apiUrl}/teams`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${apiUrl}/news`, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    if (tournamentsRes?.ok) {
      const data = await tournamentsRes.json();
      if (Array.isArray(data.data)) {
        data.data.forEach((t) => {
          dynamicRoutes.push({
            url: `${baseUrl}/tournaments/${t.id}`,
            lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        });
      }
    }

    if (teamsRes?.ok) {
      const data = await teamsRes.json();
      if (Array.isArray(data.data)) {
        data.data.forEach((t) => {
          dynamicRoutes.push({
            url: `${baseUrl}/teams/${t.id}`,
            lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });
      }
    }

    if (newsRes?.ok) {
      const data = await newsRes.json();
      if (Array.isArray(data.data)) {
        data.data.forEach((n) => {
          if (n.slug) {
            dynamicRoutes.push({
              url: `${baseUrl}/news/${n.slug}`,
              lastModified: n.updated_at ? new Date(n.updated_at) : new Date(),
              changeFrequency: 'monthly',
              priority: 0.7,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to generate dynamic sitemap routes:', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
