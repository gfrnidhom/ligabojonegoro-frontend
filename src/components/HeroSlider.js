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


  // If loading or no banners, show default hero
  if (loading || banners.length === 0) {
    return (
      <section className="hero">
        <div className="hero-badge bg-[rgba(14,165,233,0.1)] border-[rgba(14,165,233,0.2)]">
          <Activity size={16} />
          <span>Pertandingan Langsung</span>
        </div>
        <h1 className="hero-title text-[var(--text-primary)]">
          Destinasi Utama <br />
          <span className="text-gradient">Olahraga Bojonegoro</span>
        </h1>
        <p className="hero-subtitle">
          Ikuti pertandingan langsung, klasemen turnamen, dan statistik pemain dari platform resmi Liga Bojonegoro.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/live" className="btn btn-primary text-white">
            Lihat Pertandingan Langsung <ArrowRight size={18} />
          </Link>
          <Link href="/tournaments" className="btn btn-outline bg-transparent border-[var(--border-color)]">
            Jelajahi Turnamen
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl group" style={{ height: '400px' }}>
      {banners.map((banner, index) => (
        <div 
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('${getBannerImageUrl(banner.image_path)}')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[rgba(15,23,42,0.6)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(15,23,42,0.9)] to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            {banner.type === 'game' && banner.game && (
              <div className="mb-4 inline-flex items-center gap-2 bg-[rgba(225,29,72,0.8)] border border-[var(--accent-color)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Pertandingan Pilihan
              </div>
            )}
            
            <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-2xl text-white">
              {banner.title || 'Liga Bojonegoro Action'}
            </h2>
            
            {banner.type === 'game' && banner.game && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.2)] backdrop-blur-md px-4 py-2 rounded-lg text-white">
                  <span className="font-semibold">{banner.game.home_team?.name || 'Tuan Rumah'}</span>
                  <span className="text-white/80">vs</span>
                  <span className="font-semibold">{banner.game.away_team?.name || 'Tamu'}</span>
                </div>
              </div>
            )}
            
            {banner.url && (
              <div>
                <a href={banner.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex text-white border-0">
                  Eksplor <ArrowRight size={18} />
                </a>
              </div>
            )}
          </div>
        </div>
      ))}

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
