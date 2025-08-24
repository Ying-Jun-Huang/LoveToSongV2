/**
 * Service Worker - 緩存策略實現
 * 提供離線支援和性能優化
 */

// 更新版本號以清除所有緩存 - 2024-08-12
const CACHE_NAME = 'love-to-song-v1.0.3-clean';
const STATIC_CACHE = 'static-cache-v1.3-clean';
const DYNAMIC_CACHE = 'dynamic-cache-v1.3-clean';
const IMAGE_CACHE = 'image-cache-v1.3-clean';
const API_CACHE = 'api-cache-v1.3-clean';

// 緩存策略配置
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',        // 優先使用緩存
  NETWORK_FIRST: 'network-first',    // 優先使用網絡
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // 使用緩存並背景更新
  NETWORK_ONLY: 'network-only',      // 僅使用網絡
  CACHE_ONLY: 'cache-only'           // 僅使用緩存
};

// 檢查請求是否可以緩存
function isRequestCacheable(request) {
  try {
    const url = new URL(request.url);
    
    // 只允許 HTTP 和 HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    // 排除特定的不支持的 schemes
    const unsupportedSchemes = [
      'chrome-extension://',
      'moz-extension://',
      'webkit-extension://',
      'data:',
      'blob:',
      'file:'
    ];
    
    return !unsupportedSchemes.some(scheme => request.url.startsWith(scheme));
  } catch (error) {
    console.error('[SW] Error checking if request is cacheable:', error);
    return false;
  }
}

// 需要緩存的靜態資源
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 不同類型資源的緩存策略
const CACHE_RULES = [
  // 靜態資源 - 緩存優先
  {
    pattern: /\.(js|css|woff|woff2|ttf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 100
  },
  
  // 圖片資源 - 緩存優先，長期保存
  {
    pattern: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: IMAGE_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 200
  },
  
  // API請求 - 網絡優先，短期緩存
  {
    pattern: /^https?:\/\/.*\/api\/.*/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5分鐘
    maxEntries: 50
  },
  
  // 頁面請求 - 使用緩存並背景更新
  {
    pattern: /^https?:\/\/.*\/((?!api).)*$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1天
    maxEntries: 50
  }
];

// Service Worker 安裝事件 - 簡化版
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing - skipping caching');
  // 直接跳過安裝，不進行任何快取
  self.skipWaiting();
});

// Service Worker 激活事件 - 簡化版
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating');
  // 直接取得控制權，不清理快取
  event.waitUntil(self.clients.claim());
});

// 攔截網絡請求 - 簡化版，直接通過網路
self.addEventListener('fetch', (event) => {
  // 不做任何快取，直接從網路獲取
  return;
  
  try {
    const url = new URL(request.url);
    
    // 嚴格過濾：只處理 http 和 https 協議
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      // Skipping non-HTTP(S) request
      return;
    }
    
    // 只處理 GET 請求
    if (request.method !== 'GET') {
      return;
    }
    
    // 檢查請求是否可以緩存
    if (!isRequestCacheable(request)) {
      // Skipping non-cacheable request
      return;
    }
    
    // 查找匹配的緩存規則
    const rule = CACHE_RULES.find(rule => rule.pattern.test(request.url));
    
    if (rule) {
      event.respondWith(handleRequest(request, rule));
    } else {
      // 沒有匹配規則，直接發送網絡請求
      event.respondWith(fetch(request));
    }
  } catch (error) {
    console.error('[SW] Error in fetch event listener:', error);
    // 如果有任何錯誤，直接跳過 Service Worker 處理
    return;
  }
});

// 處理請求根據策略
async function handleRequest(request, rule) {
  const { strategy, cache, maxAge, maxEntries } = rule;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache, maxAge);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cache);
      
    default:
      return fetch(request);
  }
}

// 緩存優先策略
async function cacheFirst(request, cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 檢查緩存是否過期
      const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
      const now = new Date();
      
      if (now.getTime() - cachedDate.getTime() < maxAge) {
        // Cache hit
        return cachedResponse;
      }
    }
    
    try {
      // Fetching from network
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // 確保請求可以被緩存
        if (isRequestCacheable(request)) {
          // 克隆響應並添加緩存時間戳
          const responseToCache = networkResponse.clone();
          const headers = new Headers(responseToCache.headers);
          headers.append('sw-cached-date', new Date().toISOString());
          
          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          try {
            await cache.put(request, modifiedResponse);
            // Successfully cached
          } catch (cacheError) {
            console.error('[SW] Failed to cache request:', request.url, cacheError);
          }
        }
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed, using cache
      return cachedResponse || new Response('Offline', { status: 408 });
    }
  } catch (error) {
    console.error('[SW] Cache operation failed:', error);
    // 如果緩存操作失敗，直接嘗試網絡請求
    return fetch(request);
  }
}

// 網絡優先策略
async function networkFirst(request, cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    
    try {
      // Network first - fetching
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && isRequestCacheable(request)) {
        // 克隆響應並添加緩存時間戳
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.append('sw-cached-date', new Date().toISOString());
        
        const modifiedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        await cache.put(request, modifiedResponse);
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed, trying cache
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // 檢查緩存是否過期
        const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
        const now = new Date();
        
        if (now.getTime() - cachedDate.getTime() < maxAge * 2) { // 容忍更長的過期時間
          return cachedResponse;
        }
      }
      
      return new Response('Offline', { status: 408 });
    }
  } catch (error) {
    console.error('[SW] Network first cache operation failed:', error);
    return fetch(request);
  }
}

// 使用緩存並背景更新策略
async function staleWhileRevalidate(request, cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // 背景更新
    const fetchPromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok && isRequestCacheable(request)) {
          const responseToCache = networkResponse.clone();
          const headers = new Headers(responseToCache.headers);
          headers.append('sw-cached-date', new Date().toISOString());
          
          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          cache.put(request, modifiedResponse).catch((error) => {
            console.error('[SW] Failed to cache response:', error);
          });
        }
        return networkResponse;
      })
      .catch(() => null);
    
    if (cachedResponse) {
      // Serving from cache, updating in background
      return cachedResponse;
    }
    
    // No cache, waiting for network
    return fetchPromise || new Response('Offline', { status: 408 });
  } catch (error) {
    console.error('[SW] Stale while revalidate operation failed:', error);
    return fetch(request);
  }
}

// 僅使用緩存策略
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  return cachedResponse || new Response('Not in cache', { status: 404 });
}

// 清理過期緩存
async function cleanupCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cachedDate = new Date(response.headers.get('sw-cached-date'));
      const now = new Date();
      
      // 根據緩存類型設定過期時間
      let maxAge = 24 * 60 * 60 * 1000; // 默認1天
      
      if (cacheName === STATIC_CACHE) {
        maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      } else if (cacheName === IMAGE_CACHE) {
        maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
      } else if (cacheName === API_CACHE) {
        maxAge = 5 * 60 * 1000; // 5分鐘
      }
      
      if (now.getTime() - cachedDate.getTime() > maxAge) {
        // Deleting expired cache entry
        await cache.delete(request);
      }
    }
  }
}

// 限制緩存條目數量
async function limitCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  if (requests.length > maxEntries) {
    // 按最後修改時間排序，刪除最舊的條目
    const sortedRequests = requests.sort(async (a, b) => {
      const responseA = await cache.match(a);
      const responseB = await cache.match(b);
      const dateA = new Date(responseA?.headers?.get('sw-cached-date') || 0);
      const dateB = new Date(responseB?.headers?.get('sw-cached-date') || 0);
      return dateA - dateB;
    });
    
    const toDelete = sortedRequests.slice(0, requests.length - maxEntries);
    
    for (const request of toDelete) {
      // Deleting old cache entry to maintain size limit
      await cache.delete(request);
    }
  }
}

// 定期清理緩存（每小時執行一次）
setInterval(() => {
  cleanupCaches();
  
  // 限制各個緩存的大小
  limitCacheSize(STATIC_CACHE, 100);
  limitCacheSize(IMAGE_CACHE, 200);
  limitCacheSize(API_CACHE, 50);
  limitCacheSize(DYNAMIC_CACHE, 50);
}, 60 * 60 * 1000);

// 處理消息事件
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'FORCE_UPDATE':
      if (payload && payload.url) {
        forceUpdateResource(payload.url).then(() => {
          event.ports[0].postMessage({ type: 'RESOURCE_UPDATED', url: payload.url });
        });
      }
      break;
  }
});

// 獲取緩存大小
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  const sizes = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    sizes[cacheName] = requests.length;
    totalSize += requests.length;
  }
  
  return {
    total: totalSize,
    breakdown: sizes
  };
}

// 清空所有緩存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
  
  // All caches cleared
}

// 強制更新資源
async function forceUpdateResource(url) {
  const request = new Request(url);
  const response = await fetch(request);
  
  if (response.ok) {
    // 找到對應的緩存並更新
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        const headers = new Headers(response.headers);
        headers.append('sw-cached-date', new Date().toISOString());
        
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        
        await cache.put(request, modifiedResponse);
        // Force updated resource
        break;
      }
    }
  }
}

// 推送事件處理
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '新消息',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'love-to-song-notification',
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '查看',
        icon: '/action-open.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: '/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Love To Song', options)
  );
});

// 通知點擊事件處理
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  
  event.notification.close();
  
  if (action === 'open' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Service Worker script - 2024-08-12 cleaned version