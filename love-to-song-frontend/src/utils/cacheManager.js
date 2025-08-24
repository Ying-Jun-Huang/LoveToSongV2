/**
 * 緩存管理工具類
 * 提供統一的緩存管理接口
 */

class CacheManager {
  constructor() {
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    this.serviceWorker = null;
    this.initServiceWorker();
  }

  // 初始化 Service Worker
  async initServiceWorker() {
    // 重新啟用Service Worker，但禁用自動頁面重新載入
    
    if (!this.isServiceWorkerSupported) {
      console.warn('[CacheManager] Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Service Worker registered

      // 監聽 Service Worker 狀態變化
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        // New Service Worker installing

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 有新版本可用
              this.notifyNewVersion();
            } else {
              // 首次安裝完成
              // Service Worker installed for the first time
            }
          }
        });
      });

      this.serviceWorker = registration;
    } catch (error) {
      console.error('[CacheManager] Service Worker registration failed:', error);
    }
  }

  // 通知新版本可用
  notifyNewVersion() {
    // New version detected - manual update available
    // 提供手動更新選項而非自動更新
    const shouldUpdate = window.confirm(
      '發現新版本。\n點擊確定將在下次刷新時更新，或點擊取消繼續使用當前版本。'
    );

    if (shouldUpdate) {
      // 設置標記，在下次刷新時更新
      localStorage.setItem('love-to-song:pending-sw-update', 'true');
    }
  }

  // 更新 Service Worker
  updateServiceWorker() {
    if (!this.serviceWorker) return;

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'UPDATED') {
        // Service Worker updated
        // 移除自動重新載入，讓用戶手動刷新頁面
      }
    };

    // 通知 Service Worker 跳過等待
    if (this.serviceWorker.waiting) {
      this.serviceWorker.waiting.postMessage(
        { type: 'SKIP_WAITING' },
        [messageChannel.port2]
      );
    }
  }

  // 獲取緩存大小
  async getCacheSize() {
    if (!this.isServiceWorkerSupported) {
      return { total: 0, breakdown: {} };
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          resolve(event.data.size);
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );

      // 超時處理
      setTimeout(() => {
        resolve({ total: 0, breakdown: {} });
      }, 5000);
    });
  }

  // 清空所有緩存
  async clearAllCaches() {
    if (!this.isServiceWorkerSupported) {
      return;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve();
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      setTimeout(resolve, 5000);
    });
  }

  // 強制更新特定資源
  async forceUpdateResource(url) {
    if (!this.isServiceWorkerSupported) {
      return;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'RESOURCE_UPDATED') {
          resolve();
        }
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'FORCE_UPDATE', payload: { url } },
        [messageChannel.port2]
      );

      setTimeout(resolve, 5000);
    });
  }

  // 預加載關鍵資源
  async preloadCriticalResources(urls) {
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          // Resource preloaded
        }
      } catch (error) {
        console.warn('[CacheManager] Failed to preload:', url, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // 檢查網絡狀態
  isOnline() {
    return navigator.onLine;
  }

  // 監聽網絡狀態變化
  onNetworkStatusChange(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 返回清理函數
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // 獲取緩存統計信息
  async getCacheStats() {
    const size = await this.getCacheSize();
    const isOnline = this.isOnline();
    const swStatus = this.serviceWorker ? 'active' : 'inactive';

    return {
      cacheSize: size,
      isOnline,
      serviceWorkerStatus: swStatus,
      lastUpdated: new Date().toISOString()
    };
  }
}

// 本地存儲管理工具
class LocalStorageManager {
  constructor(prefix = 'love-to-song') {
    this.prefix = prefix;
    this.isSupported = this.checkSupport();
  }

  // 檢查本地存儲支持
  checkSupport() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('[LocalStorageManager] LocalStorage not supported');
      return false;
    }
  }

  // 生成完整鍵名
  getKey(key) {
    return `${this.prefix}:${key}`;
  }

  // 設置數據
  set(key, value, expirationMinutes = null) {
    if (!this.isSupported) return false;

    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('[LocalStorageManager] Failed to set item:', error);
      return false;
    }
  }

  // 獲取數據
  get(key, defaultValue = null) {
    if (!this.isSupported) return defaultValue;

    try {
      const itemStr = localStorage.getItem(this.getKey(key));
      if (!itemStr) return defaultValue;

      const item = JSON.parse(itemStr);

      // 檢查是否過期
      if (item.expiration && Date.now() > item.expiration) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.error('[LocalStorageManager] Failed to get item:', error);
      return defaultValue;
    }
  }

  // 刪除數據
  remove(key) {
    if (!this.isSupported) return false;

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('[LocalStorageManager] Failed to remove item:', error);
      return false;
    }
  }

  // 清空所有數據
  clear() {
    if (!this.isSupported) return false;

    try {
      const keys = Object.keys(localStorage);
      const prefixedKeys = keys.filter(key => key.startsWith(`${this.prefix}:`));
      
      prefixedKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error('[LocalStorageManager] Failed to clear storage:', error);
      return false;
    }
  }

  // 獲取所有鍵
  getKeys() {
    if (!this.isSupported) return [];

    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(`${this.prefix}:`))
        .map(key => key.replace(`${this.prefix}:`, ''));
    } catch (error) {
      console.error('[LocalStorageManager] Failed to get keys:', error);
      return [];
    }
  }

  // 獲取存儲大小（估算）
  getSize() {
    if (!this.isSupported) return 0;

    try {
      const keys = Object.keys(localStorage);
      let size = 0;

      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          const value = localStorage.getItem(key);
          size += key.length + (value ? value.length : 0);
        }
      });

      return size;
    } catch (error) {
      console.error('[LocalStorageManager] Failed to calculate size:', error);
      return 0;
    }
  }

  // 清理過期數據
  cleanupExpired() {
    if (!this.isSupported) return 0;

    const keys = this.getKeys();
    let cleanedCount = 0;

    keys.forEach(key => {
      try {
        const itemStr = localStorage.getItem(this.getKey(key));
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (item.expiration && Date.now() > item.expiration) {
            this.remove(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // 如果數據格式有問題，也清理掉
        this.remove(key);
        cleanedCount++;
      }
    });

    // Cleaned up expired localStorage items
    return cleanedCount;
  }
}

// 會話存儲管理工具
class SessionStorageManager extends LocalStorageManager {
  constructor(prefix = 'love-to-song-session') {
    super(prefix);
    this.storage = sessionStorage;
  }

  checkSupport() {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (error) {
      console.warn('[SessionStorageManager] SessionStorage not supported');
      return false;
    }
  }

  set(key, value) {
    if (!this.isSupported) return false;

    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify({
        value,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('[SessionStorageManager] Failed to set item:', error);
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this.isSupported) return defaultValue;

    try {
      const itemStr = sessionStorage.getItem(this.getKey(key));
      if (!itemStr) return defaultValue;

      const item = JSON.parse(itemStr);
      return item.value;
    } catch (error) {
      console.error('[SessionStorageManager] Failed to get item:', error);
      return defaultValue;
    }
  }

  remove(key) {
    if (!this.isSupported) return false;

    try {
      sessionStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('[SessionStorageManager] Failed to remove item:', error);
      return false;
    }
  }

  clear() {
    if (!this.isSupported) return false;

    try {
      const keys = Object.keys(sessionStorage);
      const prefixedKeys = keys.filter(key => key.startsWith(`${this.prefix}:`));
      
      prefixedKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error('[SessionStorageManager] Failed to clear storage:', error);
      return false;
    }
  }

  getSize() {
    if (!this.isSupported) return 0;

    try {
      const keys = Object.keys(sessionStorage);
      let size = 0;

      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          const value = sessionStorage.getItem(key);
          size += key.length + (value ? value.length : 0);
        }
      });

      return size;
    } catch (error) {
      console.error('[SessionStorageManager] Failed to calculate size:', error);
      return 0;
    }
  }
}

// 創建單例實例
const cacheManager = new CacheManager();
const localStorage = new LocalStorageManager();
const sessionStorage = new SessionStorageManager();

// 導出工具函數
export const cache = {
  // Service Worker 相關
  getCacheSize: () => cacheManager.getCacheSize(),
  clearAllCaches: () => cacheManager.clearAllCaches(),
  forceUpdateResource: (url) => cacheManager.forceUpdateResource(url),
  preloadResources: (urls) => cacheManager.preloadCriticalResources(urls),
  getCacheStats: () => cacheManager.getCacheStats(),
  
  // 網絡狀態
  isOnline: () => cacheManager.isOnline(),
  onNetworkChange: (callback) => cacheManager.onNetworkStatusChange(callback),
  
  // 本地存儲
  local: {
    set: (key, value, expirationMinutes) => localStorage.set(key, value, expirationMinutes),
    get: (key, defaultValue) => localStorage.get(key, defaultValue),
    remove: (key) => localStorage.remove(key),
    clear: () => localStorage.clear(),
    getKeys: () => localStorage.getKeys(),
    getSize: () => localStorage.getSize(),
    cleanupExpired: () => localStorage.cleanupExpired()
  },
  
  // 會話存儲
  session: {
    set: (key, value) => sessionStorage.set(key, value),
    get: (key, defaultValue) => sessionStorage.get(key, defaultValue),
    remove: (key) => sessionStorage.remove(key),
    clear: () => sessionStorage.clear(),
    getSize: () => sessionStorage.getSize()
  }
};

// 定期清理過期的本地存儲數據（每30分鐘）
setInterval(() => {
  localStorage.cleanupExpired();
}, 30 * 60 * 1000);

export default cache;