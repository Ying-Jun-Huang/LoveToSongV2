import { useState, useEffect, useCallback } from 'react';

// 移動端優化Hook
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState('unknown');
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // 檢測設備類型
  const detectDeviceType = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    setIsMobile(isMobileDevice);

    // 檢測低端設備
    const isLowEnd = checkLowEndDevice();
    setIsLowEndDevice(isLowEnd);
  }, []);

  // 檢測低端設備
  const checkLowEndDevice = () => {
    // 檢查可用內存
    if ('memory' in navigator && navigator.memory.jsHeapSizeLimit < 1073741824) { // < 1GB
      return true;
    }

    // 檢查 CPU 核心數
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 2) {
      return true;
    }

    // 檢查 GPU 支持
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      return true;
    }

    return false;
  };

  // 更新屏幕信息
  const updateScreenInfo = useCallback(() => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // 檢測方向
    const isPortrait = window.innerHeight > window.innerWidth;
    setOrientation(isPortrait ? 'portrait' : 'landscape');
  }, []);

  // 檢測網絡類型
  const detectNetworkType = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setNetworkType(connection.effectiveType || 'unknown');
      }
    }
  }, []);

  useEffect(() => {
    // 初始檢測
    detectDeviceType();
    updateScreenInfo();
    detectNetworkType();

    // 監聽屏幕變化
    const handleResize = () => {
      updateScreenInfo();
    };

    // 監聽方向變化
    const handleOrientationChange = () => {
      setTimeout(updateScreenInfo, 100); // 延遲一點讓瀏覽器完成方向切換
    };

    // 監聽網絡狀態變化
    const handleOnline = () => setIsOnline(true);

    // 監聽網絡類型變化
    const handleConnectionChange = () => {
      detectNetworkType();
    };

    // 添加事件監聽器
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('online', handleOnline);

    if ('connection' in navigator) {
      navigator.connection?.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('online', handleOnline);
      
      if ('connection' in navigator) {
        navigator.connection?.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [detectDeviceType, updateScreenInfo, detectNetworkType]);

  // 獲取優化建議
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations = [];

    if (isLowEndDevice) {
      recommendations.push({
        type: 'performance',
        message: '檢測到低端設備，建議啟用性能優化模式',
        action: 'enable_performance_mode'
      });
    }

    if (networkType === 'slow-2g' || networkType === '2g') {
      recommendations.push({
        type: 'network',
        message: '網絡速度較慢，建議啟用數據節省模式',
        action: 'enable_data_saver'
      });
    }

    if (isMobile && orientation === 'landscape') {
      recommendations.push({
        type: 'ui',
        message: '橫屏模式下建議使用簡化界面',
        action: 'enable_landscape_ui'
      });
    }

    if (!isOnline) {
      recommendations.push({
        type: 'connectivity',
        message: '網路連接中斷',
        action: 'network_disconnected'
      });
    }

    return recommendations;
  }, [isMobile, isLowEndDevice, networkType, orientation, isOnline]);

  // 獲取移動端CSS類名
  const getMobileClasses = useCallback(() => {
    const classes = [];

    if (isMobile) classes.push('mobile-device');
    if (isLowEndDevice) classes.push('low-end-device');
    if (orientation === 'landscape') classes.push('landscape-mode');
    if (!isOnline) classes.push('disconnected');
    if (networkType === 'slow-2g' || networkType === '2g') classes.push('slow-network');

    return classes.join(' ');
  }, [isMobile, isLowEndDevice, orientation, isOnline, networkType]);

  // 獲取推薦的性能設置
  const getPerformanceSettings = useCallback(() => {
    return {
      // 動畫設置
      animations: !isLowEndDevice,
      reduceMotion: isLowEndDevice,
      
      // 數據更新頻率
      updateInterval: isLowEndDevice ? 2000 : 1000,
      
      // 緩存設置
      cacheSize: isLowEndDevice ? 50 : 100,
      
      // 網絡設置
      compression: networkType === 'slow-2g' || networkType === '2g',
      batchUpdates: networkType === 'slow-2g' || networkType === '2g',
      
      // UI設置
      virtualScrolling: isMobile && screenSize.height < 700,
      lazyLoading: true,
      
      // 音頻設置
      audioQuality: isLowEndDevice ? 'low' : 'high',
      preloadAudio: !isLowEndDevice && isOnline
    };
  }, [isMobile, isLowEndDevice, networkType, screenSize, isOnline]);

  // 安裝 PWA 提示
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // 安裝 PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      const result = await installPrompt.prompt();
      console.log('[PWA] 安裝提示結果:', result.outcome);
      
      setInstallPrompt(null);
      setShowInstallBanner(false);
      
      return result.outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] 安裝失敗:', error);
      return false;
    }
  }, [installPrompt]);

  // 檢查是否為 PWA 模式
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

  // 觸覺反饋
  const vibrate = useCallback((pattern = [100]) => {
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(pattern);
    }
  }, [isMobile]);

  // 保持屏幕喚醒
  const [wakeLock, setWakeLock] = useState(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('[MobileOptimization] 屏幕保持喚醒已啟用');
        return true;
      } catch (error) {
        console.warn('[MobileOptimization] 無法啟用屏幕保持喚醒:', error);
        return false;
      }
    }
    return false;
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
      console.log('[MobileOptimization] 屏幕保持喚醒已釋放');
    }
  }, [wakeLock]);

  // 檢測手勢支持
  const [gestureSupport, setGestureSupport] = useState({
    touch: 'ontouchstart' in window,
    pointer: 'onpointerdown' in window,
    gesture: 'ongesturestart' in window
  });

  return {
    // 設備信息
    isMobile,
    isLowEndDevice,
    orientation,
    screenSize,
    isPWA,
    gestureSupport,

    // 網絡信息
    isOnline,
    networkType,

    // 功能方法
    getMobileClasses,
    getPerformanceSettings,
    getOptimizationRecommendations,
    vibrate,

    // PWA 功能
    installPrompt,
    showInstallBanner,
    installPWA,
    setShowInstallBanner,

    // 屏幕喚醒
    wakeLock: !!wakeLock,
    requestWakeLock,
    releaseWakeLock
  };
};

// 移動端性能優化Hook
export const useMobilePerformance = () => {
  const [performanceMode, setPerformanceMode] = useState('auto');
  const [renderOptimizations, setRenderOptimizations] = useState({
    virtualScrolling: false,
    lazyLoading: true,
    reducedAnimations: false,
    imageOptimization: true
  });

  // 自動檢測並設置性能模式
  useEffect(() => {
    const detectPerformanceNeeds = () => {
      let mode = 'normal';
      
      // 檢查設備性能
      if ('memory' in navigator && navigator.memory.jsHeapSizeLimit < 1073741824) {
        mode = 'low';
      }
      
      // 檢查網絡狀況
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
          mode = 'low';
        }
      }
      
      // 檢查電池狀況
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          if (battery.level < 0.2 && !battery.charging) {
            mode = 'low';
          }
        });
      }

      setPerformanceMode(mode);
      
      // 根據性能模式調整優化設置
      setRenderOptimizations(prev => ({
        ...prev,
        virtualScrolling: mode === 'low',
        reducedAnimations: mode === 'low',
        imageOptimization: true
      }));
    };

    detectPerformanceNeeds();

    // 監聽電池狀態變化
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBatteryMode = () => {
          if (battery.level < 0.15 && !battery.charging) {
            setPerformanceMode('battery-saver');
            setRenderOptimizations(prev => ({
              ...prev,
              virtualScrolling: true,
              reducedAnimations: true,
              lazyLoading: true
            }));
          }
        };

        battery.addEventListener('levelchange', updateBatteryMode);
        battery.addEventListener('chargingchange', updateBatteryMode);
      });
    }
  }, []);

  return {
    performanceMode,
    renderOptimizations,
    setPerformanceMode,
    setRenderOptimizations
  };
};

// 觸摸手勢Hook
export const useTouchGestures = (elementRef) => {
  const [gestureState, setGestureState] = useState({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    direction: null,
    distance: 0
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startTouch = null;
    let currentTouch = null;

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        startTouch = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
        
        setGestureState(prev => ({
          ...prev,
          isActive: true,
          startPoint: startTouch
        }));
      }
    };

    const handleTouchMove = (event) => {
      if (!startTouch || event.touches.length !== 1) return;

      currentTouch = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };

      const deltaX = currentTouch.x - startTouch.x;
      const deltaY = currentTouch.y - startTouch.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let direction = null;
      if (distance > 10) { // 最小滑動距離
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
      }

      setGestureState(prev => ({
        ...prev,
        currentPoint: currentTouch,
        direction,
        distance
      }));
    };

    const handleTouchEnd = () => {
      setGestureState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
        direction: null,
        distance: 0
      });

      startTouch = null;
      currentTouch = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef]);

  return gestureState;
};

// PWA 安裝Hook
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 檢查是否已安裝
    const checkInstalled = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;
      setIsInstalled(isPWA);
    };

    checkInstalled();

    // 監聽安裝提示事件
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    // 監聽安裝完成事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return { success: false, error: 'No install prompt available' };

    try {
      const result = await installPrompt.prompt();
      const accepted = result.outcome === 'accepted';
      
      if (accepted) {
        setInstallPrompt(null);
        setIsInstallable(false);
      }

      return { success: accepted, outcome: result.outcome };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    install
  };
};

export default {
  useMobileOptimization,
  useMobilePerformance,
  useTouchGestures,
  usePWAInstall
};