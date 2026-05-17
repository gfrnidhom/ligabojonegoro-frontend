"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home as HomeIcon, Flame, Calendar, CheckCircle, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [liveCount, setLiveCount] = useState(0);

  const currentFilter = searchParams.get('filter') || 'all';

  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const res = await api.get('/matches', { params: { per_page: 100 } });
        if (res.data.success) {
          const count = res.data.data.filter(m => 
            ['live', 'first_half', 'half_time', 'second_half', 'extra_time_1', 'extra_time_ht', 'extra_time_2', 'penalty_shootout', 'ongoing'].includes(m.status)
          ).length;
          setLiveCount(count);
        }
      } catch (e) {
        console.error('Error fetching live count for BottomNav:', e);
      }
    };

    fetchLiveCount();
    const interval = setInterval(fetchLiveCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'all', label: 'Semua', icon: HomeIcon, path: '/', filter: 'all' },
    { id: 'live', label: 'LIVE', icon: Flame, path: '/', filter: 'live', isLive: true },
    { id: 'scheduled', label: 'Mendatang', icon: Calendar, path: '/', filter: 'scheduled' },
    { id: 'finished', label: 'Selesai', icon: CheckCircle, path: '/', filter: 'finished' },
    { id: 'leagues', label: 'Liga', icon: Trophy, path: '/tournaments' },
  ];

  const handleNav = (item) => {
    if (item.path === '/') {
      router.push(`/?filter=${item.filter}`);
    } else {
      router.push(item.path);
    }
  };

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-[100] h-[72px] max-w-md mx-auto bg-[#11131a]/95 backdrop-blur-xl border border-white/5 lg:hidden px-2 flex items-center overflow-x-auto hide-scrollbar" 
      style={{ borderRadius: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(234,179,8,0.05)', scrollbarWidth: 'none' }}
    >
      {navItems.map((item) => {
        const isActive = (item.path === '/' && pathname === '/' && currentFilter === item.filter) || 
                         (item.path !== '/' && pathname.startsWith(item.path));
        
        const color = isActive 
          ? (item.isLive ? '#ef4444' : '#fbbf24') 
          : '#8b92a5';
        
        const bgColor = isActive 
          ? (item.isLive ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)') 
          : 'transparent';
        
        const borderColor = isActive 
          ? (item.isLive ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)') 
          : 'transparent';

        return (
          <button
            key={item.id}
            onClick={() => handleNav(item)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2, 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              flex: 1, 
              height: '100%', 
              justifyContent: 'center' 
            }}
          >
            <div style={{
              padding: '6px 14px', borderRadius: 20,
              background: bgColor,
              border: `1px solid ${borderColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', position: 'relative'
            }}>
              <item.icon size={18} color={color} style={{ fill: isActive && item.id !== 'scheduled' && item.id !== 'leagues' ? color : 'none' }} />
              {item.isLive && liveCount > 0 && (
                <span style={{ 
                  position: 'absolute', top: -1, right: -4, 
                  background: '#ef4444', color: '#fff', 
                  fontSize: 8, fontWeight: 800, 
                  padding: '1px 4px', borderRadius: 6, 
                  minWidth: 14, textAlign: 'center', 
                  boxShadow: '0 2px 6px rgba(239,68,68,0.4)' 
                }}>
                  {liveCount}
                </span>
              )}
            </div>
            <span style={{ 
              fontSize: 10, 
              fontWeight: isActive ? 700 : 500, 
              color: isActive ? '#f1f5f9' : '#8b92a5', 
              transition: 'all 0.2s ease' 
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
