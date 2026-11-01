"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api, { getImageUrl } from '../api';

export default function HeroSlider({ banners: propBanners }) {
  const [internalBanners, setInternalBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(propBanners === undefined);

  useEffect(() => {
    if (propBanners !== undefined) return;

    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners');
        if (response.data?.success && Array.isArray(response.data.data)) {
          setInternalBanners(response.data.data);
        } else {
          setInternalBanners([]);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        setInternalBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [propBanners]);

  const rawBanners = propBanners !== undefined ? propBanners : internalBanners;
  // Pastikan hanya banner yang memiliki data gambar yang valid
  const banners = (rawBanners || []).filter(b => b && (b.image_path || b.image || b.banner_path));

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const nextSlide = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getBannerImageUrl = (banner) => {
    const path = banner?.image_path || banner?.image || banner?.banner_path;
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return getImageUrl(path) || '';
  };

  // Jika tidak ada data banner, jangan render apapun agar tidak blank
  if (banners.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative rounded-2xl overflow-hidden shadow-lg group select-none transition-all duration-300"
      style={{ aspectRatio: '3 / 1', width: '100%', background: '#0f172a' }}
    >
      {banners.map((banner, index) => {
        const imgUrl = getBannerImageUrl(banner);
        const targetUrl = banner.url || (banner.game_id ? `/matches/${banner.game_id}` : null);

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
              targetUrl.startsWith('http') ? (
                <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative cursor-pointer">
                  {slideContent}
                </a>
              ) : (
                <Link href={targetUrl} className="block w-full h-full relative cursor-pointer">
                  {slideContent}
                </Link>
              )
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
