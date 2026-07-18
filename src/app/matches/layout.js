export const metadata = {
  title: 'Jadwal & Hasil Pertandingan',
  description: 'Jadwal lengkap, hasil akhir, live score, dan riwayat pertandingan turnamen sepak bola serta futsal Liga Bojonegoro.',
  openGraph: {
    title: 'Jadwal & Hasil Pertandingan | Liga Bojonegoro',
    description: 'Jadwal lengkap, hasil akhir, live score, dan riwayat pertandingan turnamen sepak bola serta futsal Liga Bojonegoro.',
  },
  alternates: {
    canonical: '/matches',
  },
};

export default function MatchesIndexLayout({ children }) {
  return children;
}
