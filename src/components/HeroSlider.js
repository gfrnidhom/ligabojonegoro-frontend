"use client";

import { useState, useEffect } from 'react';
import { Activity, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
        if (response.data.success && response.data.data.length > 0) {
          setBanners(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
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
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getBannerImageUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1518605368461-1ee7c5320c28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
    return getImageUrl(path);
  };


  // If loading or no banners, return nothing instead of text hero
  if (loading || banners.length === 0) {
    return null;
  }

  return (
    <section className="relative rounded-2xl overflow-hidden mb-0 shadow-xl group" style={{ aspectRatio: '1000 / 300', width: '100%' }}>
      {banners.map((banner, index) => {
        const slideContent = (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('${getBannerImageUrl(banner.image_path)}')`,
            }}
          />
        );
        return (
          <div 
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {banner.url ? (
              <a href={banner.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative cursor-pointer">
                {slideContent}
              </a>
            ) : (
              slideContent
            )}
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.2)] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgba(255,255,255,0.2)]"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.2)] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgba(255,255,255,0.2)]"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-[var(--primary-color)]' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
