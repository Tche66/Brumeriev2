// Nom du cache pour Brumerie
const CACHE_NAME = 'brumerie-v1';

// On n'installe rien de spécial au début, mais on active le SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Indispensable pour que Chrome valide la PWA : intercepter les requêtes
self.addEventListener('fetch', (event) => {
  // On laisse passer toutes les requêtes normalement
  event.respondWith(fetch(event.request));
});
