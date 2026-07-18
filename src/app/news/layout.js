export const metadata = {
  title: 'Berita Terkini & Artikel Seputar Turnamen',
  description: 'Baca berita terbaru, liputan pertandingan, wawancara pemain, dan artikel olahraga resmi dari Liga Bojonegoro.',
  openGraph: {
    title: 'Berita Terkini & Artikel Seputar Turnamen | Liga Bojonegoro',
    description: 'Baca berita terbaru, liputan pertandingan, wawancara pemain, dan artikel olahraga resmi dari Liga Bojonegoro.',
  },
  alternates: {
    canonical: '/news',
  },
};

export default function NewsIndexLayout({ children }) {
  return children;
}
