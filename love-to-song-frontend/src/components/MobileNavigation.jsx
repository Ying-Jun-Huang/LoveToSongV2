import React, { useState, useEffect } from 'react';
import { useMobileOptimization, useTouchGestures } from '../hooks/useMobileOptimization';

const MobileNavigation = ({ currentPage, onNavigate, className = '' }) => {
  const { isMobile, orientation, vibrate, getMobileClasses } = useMobileOptimization();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navRef = React.useRef(null);
  const gestureState = useTouchGestures(navRef);

  const navigationItems = [
    { id: 'home', label: '首頁', icon: '🏠', path: '/' },
    { id: 'request', label: '點歌', icon: '🎤', path: '/request' },
    { id: 'queue', label: '排隊', icon: '📋', path: '/queue' },
    { id: 'events', label: '活動', icon: '🎊', path: '/events' },
    { id: 'profile', label: '個人', icon: '👤', path: '/profile' }
  ];

  // 監聽滾動隱藏/顯示導航欄
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 向下滾動，隱藏導航欄
        setIsVisible(false);
      } else {
        // 向上滾動，顯示導航欄
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, lastScrollY]);

  // 處理導航點擊
  const handleNavClick = (item) => {
    vibrate([50]); // 觸覺反饋
    onNavigate(item.path);
  };

  // 處理滑動手勢
  useEffect(() => {
    if (gestureState.direction && gestureState.distance > 50) {
      const currentIndex = navigationItems.findIndex(item => item.id === currentPage);
      
      if (gestureState.direction === 'left' && currentIndex < navigationItems.length - 1) {
        // 向左滑動，下一頁
        vibrate([30]);
        onNavigate(navigationItems[currentIndex + 1].path);
      } else if (gestureState.direction === 'right' && currentIndex > 0) {
        // 向右滑動，上一頁
        vibrate([30]);
        onNavigate(navigationItems[currentIndex - 1].path);
      }
    }
  }, [gestureState.direction, gestureState.distance, currentPage, navigationItems, onNavigate, vibrate]);

  if (!isMobile) return null;

  return (
    <div 
      ref={navRef}
      className={`mobile-navigation ${getMobileClasses()} ${className} ${isVisible ? 'visible' : 'hidden'}`}
    >
      <div className="nav-container">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {currentPage === item.id && <div className="active-indicator" />}
          </button>
        ))}
      </div>

      {/* 滑動指示器 */}
      {gestureState.isActive && (
        <div className="swipe-indicator">
          <div 
            className="swipe-progress"
            style={{ 
              width: `${Math.min(gestureState.distance / 50 * 100, 100)}%`,
              backgroundColor: gestureState.direction === 'left' ? '#4caf50' : gestureState.direction === 'right' ? '#2196f3' : '#ccc'
            }}
          />
        </div>
      )}

      <style jsx="true">{`
        .mobile-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(30, 30, 30, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          transition: transform 0.3s ease-in-out;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        }

        .mobile-navigation.hidden {
          transform: translateY(100%);
        }

        .mobile-navigation.visible {
          transform: translateY(0);
        }

        .nav-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 0;
          max-width: 100%;
          margin: 0 auto;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: none;
          border: none;
          color: #cccccc;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
          min-width: 60px;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-item:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-item.active {
          color: #4caf50;
          background: rgba(76, 175, 80, 0.1);
        }

        .nav-icon {
          font-size: 20px;
          margin-bottom: 2px;
          display: block;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #4caf50;
          border-radius: 50%;
        }

        .swipe-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .swipe-progress {
          height: 100%;
          transition: width 0.1s ease;
        }

        /* 橫屏模式優化 */
        .landscape-mode .mobile-navigation {
          bottom: auto;
          top: 0;
          border-top: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .landscape-mode .nav-container {
          padding: 6px 0;
        }

        .landscape-mode .nav-item {
          padding: 6px 8px;
          min-width: 50px;
        }

        .landscape-mode .nav-icon {
          font-size: 16px;
        }

        .landscape-mode .nav-label {
          font-size: 9px;
        }

        /* 低端設備優化 */
        .low-end-device .mobile-navigation {
          backdrop-filter: none;
          background: rgba(30, 30, 30, 1);
        }

        .low-end-device .nav-item {
          transition: none;
        }

        .low-end-device .nav-item:active {
          transform: none;
        }

        /* 小屏幕優化 */
        @media (max-width: 360px) {
          .nav-container {
            padding: 6px 0;
          }

          .nav-item {
            padding: 6px 8px;
            min-width: 50px;
          }

          .nav-icon {
            font-size: 18px;
          }

          .nav-label {
            font-size: 9px;
          }
        }

        /* 超寬屏幕優化 */
        @media (min-width: 768px) {
          .mobile-navigation {
            display: none;
          }
        }

        /* 高對比度模式 */
        @media (prefers-contrast: high) {
          .mobile-navigation {
            background: #000000;
            border-top: 2px solid #ffffff;
          }

          .nav-item {
            color: #ffffff;
          }

          .nav-item.active {
            color: #00ff00;
            background: rgba(0, 255, 0, 0.2);
          }
        }

        /* 減少動畫模式 */
        @media (prefers-reduced-motion: reduce) {
          .mobile-navigation,
          .nav-item,
          .swipe-progress {
            transition: none;
          }

          .nav-item:active {
            transform: none;
          }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .mobile-navigation {
            background: rgba(0, 0, 0, 0.95);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }
        }

        /* 安全區域適配 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .mobile-navigation {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileNavigation;