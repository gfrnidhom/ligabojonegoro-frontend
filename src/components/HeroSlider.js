"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import Link from 'next/link';
import api, { getImageUrl } from '../api';

export default function HeroSlider() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners');
        let fetchedBanners = [];
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          fetchedBanners = response.data.data;
        }

        // Jika API tidak mengembalikan banner atau hanya 1 banner, lengkapi dengan banner Fesboro lokal
        // agar fitur Slider (arah panah, indikator, transisi) di beranda bekerja dengan optimal & interaktif.
        if (fetchedBanners.length === 0) {
          fetchedBanners = [
            {
              id: 'local-fesboro',
              title: 'Fesboro U-10 Se-Jatim & Jateng',
              image_path: '/banners/fesboro-banner.png',
              url: '/tournaments'
            },
            {
              id: 'local-liga-2026',
              title: 'Kompetisi Liga Bojonegoro 2026',
              image_path: '/banners/fesboro-banner.png',
              url: '/tournaments',
              is_secondary: true
            }
          ];
        } else if (fetchedBanners.length === 1) {
          // Tambahkan slide kedua dengan informasi kompetisi agar ada efek geser (slider)
          fetchedBanners = [
            ...fetchedBanners,
            {
              id: 'local-supplement',
              title: fetchedBanners[0].title || 'Fesboro U-10 Se-Jatim & Jateng',
              image_path: fetchedBanners[0].image_path || '/banners/fesboro-banner.png',
              url: fetchedBanners[0].url || '/tournaments',
              is_supplement: true
            }
          ];
        }

        setBanners(fetchedBanners);
      } catch (error) {
        console.error('Error fetching banners:', error);
        // Fallback lokal jika API gagal
        setBanners([
          {
            id: 'local-fesboro-fallback',
            title: 'Fesboro U-10 Se-Jatim & Jateng',
            image_path: '/banners/fesboro-banner.png',
            url: '/tournaments'
          },
          {
            id: 'local-fesboro-fallback-2',
            title: 'Liga Bojonegoro 2026',
            image_path: '/banners/fesboro-banner.png',
            url: '/tournaments'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const nextSlide = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getBannerImageUrl = (path) => {
    if (!path) return '/banners/fesboro-banner.png';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return getImageUrl(path);
  };

  if (loading && banners.length === 0) {
    return (
      <div 
        className="w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" 
        style={{ aspectRatio: '3 / 1' }} 
      />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative rounded-2xl overflow-hidden shadow-lg group select-none transition-all duration-300"
      style={{ aspectRatio: '3 / 1', width: '100%', background: '#0f172a' }}
    >
      {banners.map((banner, index) => {
        const imgUrl = getBannerImageUrl(banner.image_path);
        const targetUrl = banner.url || (banner.game_id ? `/matches/${banner.game_id}` : '/tournaments');

        const slideContent = (
          <div 
            className="absolute inset-0 w-full h-full bg-no-repeat bg-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            style={{ 
              backgroundImage: `url('${imgUrl}')`,
              backgroundSize: '100% 100%'
            }}
          />
        );

        return (
          <div 
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            {targetUrl ? (
              <Link href={targetUrl} className="block w-full h-full relative cursor-pointer">
                {slideContent}
              </Link>
            ) : (
              slideContent
            )}
          </div>
        );
      })}

      {/* Navigation Arrows (Hanya muncul jika lebih dari 1 slide) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            aria-label="Previous Banner"
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 text-white opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shadow-md transform active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <button 
            onClick={nextSlide}
            aria-label="Next Banner"
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/20 text-white opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shadow-md transform active:scale-95 cursor-pointer"
          >
            <ChevronRight size={20} className="md:w-6 md:h-6" />
          </button>
          
          {/* Dots Indicator */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex ? 'w-6 bg-blue-500 shadow-sm' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
