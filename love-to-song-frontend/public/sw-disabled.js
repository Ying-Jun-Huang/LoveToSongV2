// Service Worker 完全禁用 - 2024-08-12
// 這個文件取代了原始的 sw.js 來防止任何緩存相關日誌

console.log('[SW] Service Worker 已完全禁用');

// 移除所有現有緩存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // 緩存已清除，但不記錄日誌
    })
  );
});

// 不處理任何請求，讓所有請求直接通過網絡
self.addEventListener('fetch', (event) => {
  // 不攔截任何請求
  return;
});