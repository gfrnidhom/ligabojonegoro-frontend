import './globals.css';
import { Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'Liga Bojonegoro | Skor Langsung & Jadwal Pertandingan',
  description: 'Skor langsung, hasil pertandingan, klasemen, dan jadwal turnamen Liga Bojonegoro.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-wrapper">
          <Navbar />
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
