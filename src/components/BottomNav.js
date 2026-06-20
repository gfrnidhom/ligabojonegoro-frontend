"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home as HomeIcon, Trophy, FileText } from 'lucide-react';
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
    { id: 'all', label: 'Matches', icon: HomeIcon, path: '/', filter: 'all' },
    { id: 'leagues', label: 'Leagues', icon: Trophy, path: '/tournaments' },
    { id: 'news', label: 'News', icon: FileText, path: '/news' },
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
      className="fixed bottom-0 left-0 right-0 z-[100] h-[64px] lg:hidden px-2 flex items-center overflow-x-auto hide-scrollbar" 
      style={{ 
        scrollbarWidth: 'none', 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {navItems.map((item) => {
        const isActive = (item.path === '/' && pathname === '/' && currentFilter === item.filter) || 
                         (item.path !== '/' && pathname.startsWith(item.path));
        
        const color = isActive ? '#0f172a' : '#94a3b8';
        
        return (
          <button
            key={item.id}
            onClick={() => handleNav(item)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 4, 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              flex: 1, 
              height: '100%', 
              justifyContent: 'center' 
            }}
          >
            <div style={{ position: 'relative' }}>
              <item.icon size={22} color={color} style={{ fill: isActive ? color : 'none', transition: 'all 0.2s ease' }} />
              {item.isLive && liveCount > 0 && (
                <span style={{ 
                  position: 'absolute', top: -4, right: -8, 
                  background: '#ef4444', color: '#fff', 
                  fontSize: 9, fontWeight: 800, 
                  padding: '2px 4px', borderRadius: 6, 
                  minWidth: 16, textAlign: 'center', 
                }}>
                  {liveCount}
                </span>
              )}
            </div>
            <span style={{ 
              fontSize: 11, 
              fontWeight: isActive ? 700 : 600, 
              color: color, 
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
