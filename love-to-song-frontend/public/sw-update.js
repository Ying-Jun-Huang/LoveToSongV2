// Service Worker update script - DISABLED to prevent infinite reload loop
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(function(registrations) {
//     for(let registration of registrations) {
//       registration.unregister();
//     }
//     console.log('All service workers unregistered');
//     
//     // 清除所有緩存
//     caches.keys().then(function(cacheNames) {
//       return Promise.all(
//         cacheNames.map(function(cacheName) {
//           console.log('Deleting cache:', cacheName);
//           return caches.delete(cacheName);
//         })
//       );
//     }).then(function() {
//       console.log('All caches cleared');
//       // DISABLED: window.location.reload();
//     });
//   });
// }

console.log('SW update script disabled to prevent reload loop');