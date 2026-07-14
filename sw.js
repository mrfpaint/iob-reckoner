/* Minimal service worker - enables "Install app" and caches the shell.
   Rates are always fetched fresh from Google Sheets (network-first for CSV). */

var CACHE = 'iob-reckoner-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(SHELL).catch(function(){ /* ignore individual misses */ });
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = e.request.url;

  // Never cache the Google Sheets rates - always go to the network
  if(url.indexOf('docs.google.com') > -1){
    return; // let the browser handle it normally
  }

  // App shell: serve from cache, fall back to network
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request);
    })
  );
});
