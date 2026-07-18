import './globals.css';
import { Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ligabojonegoro.id';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Liga Bojonegoro | Skor Langsung, Jadwal & Klasemen Turnamen',
    template: '%s | Liga Bojonegoro',
  },
  description: 'Pusat informasi resmi Liga Bojonegoro. Dapatkan update skor langsung (live score), hasil pertandingan, jadwal turnamen, klasemen terbaru, statistik pemain, dan berita terkini seputar sepak bola dan futsal di Bojonegoro.',
  keywords: [
    'Liga Bojonegoro',
    'Sepak Bola Bojonegoro',
    'Futsal Bojonegoro',
    'Jadwal Liga Bojonegoro',
    'Skor Langsung Bojonegoro',
    'Live Score Bojonegoro',
    'Klasemen Liga Bojonegoro',
    'Turnamen Sepak Bola Bojonegoro',
    'PSSI Bojonegoro',
    'Berita Bola Bojonegoro',
    'Hasil Pertandingan Bojonegoro',
  ],
  authors: [{ name: 'Liga Bojonegoro', url: siteUrl }],
  creator: 'Liga Bojonegoro',
  publisher: 'Liga Bojonegoro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Liga Bojonegoro | Skor Langsung, Jadwal & Klasemen Turnamen',
    description: 'Pusat informasi resmi Liga Bojonegoro. Skor langsung (live score), klasemen, statistik, dan berita turnamen terkini di Bojonegoro.',
    url: siteUrl,
    siteName: 'Liga Bojonegoro',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/favicon.ico',
        width: 800,
        height: 600,
        alt: 'Liga Bojonegoro Logo & Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liga Bojonegoro | Skor Langsung & Jadwal Turnamen',
    description: 'Pusat informasi resmi Liga Bojonegoro. Skor langsung, klasemen, statistik, dan berita turnamen terkini.',
    images: ['/favicon.ico'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Liga Bojonegoro',
        description: 'Pusat informasi resmi turnamen sepak bola dan futsal Liga Bojonegoro.',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Liga Bojonegoro',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/favicon.ico`,
        },
        sameAs: [
          'https://instagram.com/ligabojonegoro',
          'https://facebook.com/ligabojonegoro',
        ],
      },
    ],
  };

  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div className="app-wrapper">
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <main className="main-content">
            {children}
          </main>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
          <Footer />
        </div>
      </body>
    </html>
  );
}

