import React, { useState, useEffect } from 'react';
import { usePWAInstall, useMobileOptimization } from '../hooks/useMobileOptimization';

const PWAInstallBanner = ({ onInstall, onDismiss }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { isMobile, vibrate } = useMobileOptimization();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 檢查是否已經關閉過安裝提示
    const dismissedTime = localStorage.getItem('pwa_install_dismissed');
    const dismissedRecently = dismissedTime && 
      (Date.now() - parseInt(dismissedTime)) < 7 * 24 * 60 * 60 * 1000; // 7天內

    // 只在移動端且可安裝且未安裝且未被關閉的情況下顯示
    if (isMobile && isInstallable && !isInstalled && !dismissedRecently) {
      // 延遲3秒顯示，避免干擾用戶初始體驗
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isMobile, isInstallable, isInstalled]);

  const handleInstall = async () => {
    vibrate([100, 50, 100]); // 觸覺反饋
    
    const result = await install();
    
    if (result.success) {
      setShowBanner(false);
      onInstall?.(result);
    } else {
      console.warn('[PWAInstallBanner] 安裝失敗:', result.error);
    }
  };

  const handleDismiss = () => {
    vibrate([50]); // 輕微觸覺反饋
    
    setShowBanner(false);
    setDismissed(true);
    
    // 記錄關閉時間
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    
    onDismiss?.();
  };

  const handleLater = () => {
    setShowBanner(false);
    
    // 30分鐘後再次提示
    setTimeout(() => {
      if (!dismissed) {
        setShowBanner(true);
      }
    }, 30 * 60 * 1000);
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="pwa-install-banner">
      <div className="banner-content">
        <div className="banner-icon">📱</div>
        <div className="banner-text">
          <h3>安裝愛唱歌應用</h3>
          <p>安裝到主屏幕，享受更好的使用體驗</p>
          <div className="banner-features">
            <span className="feature">⚡ 更快載入</span>
            <span className="feature">📱 離線使用</span>
            <span className="feature">🔔 推送通知</span>
          </div>
        </div>
      </div>
      
      <div className="banner-actions">
        <button onClick={handleDismiss} className="dismiss-button">
          不再提示
        </button>
        <button onClick={handleLater} className="later-button">
          稍後
        </button>
        <button onClick={handleInstall} className="install-button">
          安裝
        </button>
      </div>

      <style jsx="true">{`
        .pwa-install-banner {
          position: fixed;
          bottom: 80px; /* 避免與底部導航重疊 */
          left: 16px;
          right: 16px;
          background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
          color: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 999;
          animation: slideUp 0.5s ease-out;
        }

        .banner-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .banner-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .banner-text h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .banner-text p {
          margin: 0 0 12px 0;
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .banner-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .feature {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 12px;
          white-space: nowrap;
        }

        .banner-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .banner-actions button {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .dismiss-button {
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .dismiss-button:active {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(0.95);
        }

        .later-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .later-button:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }

        .install-button {
          background: white;
          color: #4caf50;
          font-weight: 600;
          min-width: 80px;
        }

        .install-button:active {
          background: rgba(255, 255, 255, 0.9);
          transform: scale(0.95);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* 橫屏模式調整 */
        .landscape-mode .pwa-install-banner {
          bottom: 16px;
          left: 16px;
          right: auto;
          max-width: 400px;
        }

        /* 小屏幕優化 */
        @media (max-width: 360px) {
          .pwa-install-banner {
            left: 8px;
            right: 8px;
            padding: 16px;
          }

          .banner-content {
            gap: 12px;
            margin-bottom: 12px;
          }

          .banner-icon {
            font-size: 28px;
          }

          .banner-text h3 {
            font-size: 16px;
          }

          .banner-text p {
            font-size: 13px;
          }

          .banner-actions {
            gap: 6px;
          }

          .banner-actions button {
            padding: 6px 12px;
            font-size: 13px;
          }
        }

        /* 低端設備優化 */
        .low-end-device .pwa-install-banner {
          background: #4caf50;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          animation: none;
        }

        .low-end-device .banner-actions button {
          transition: none;
        }

        .low-end-device .banner-actions button:active {
          transform: none;
        }

        /* 減少動畫模式 */
        @media (prefers-reduced-motion: reduce) {
          .pwa-install-banner {
            animation: none;
          }

          .banner-actions button {
            transition: none;
          }

          .banner-actions button:active {
            transform: none;
          }
        }

        /* 高對比度模式 */
        @media (prefers-contrast: high) {
          .pwa-install-banner {
            background: #000000;
            border: 2px solid #4caf50;
          }

          .install-button {
            background: #4caf50;
            color: #000000;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallBanner;