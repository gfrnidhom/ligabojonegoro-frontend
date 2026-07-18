export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/search?*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
