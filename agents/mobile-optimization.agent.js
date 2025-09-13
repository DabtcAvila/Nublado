#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');

class MobileOptimizationAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_004',
      name: 'Mobile Optimization Agent',
      type: 'mobile_specialist',
      capabilities: [
        'responsive_design',
        'pwa',
        'mobile_performance',
        'viewport_optimization',
        'touch_events',
        'service_workers',
        'offline_first',
        'app_shell',
        'mobile_gestures',
        'adaptive_loading'
      ],
      branch: 'feature/mobile',
      permissions: {
        read: ['*'],
        write: ['src/mobile/**', 'public/manifest.json', 'src/service-worker.js'],
        execute: ['test:mobile', 'audit:lighthouse']
      }
    });
  }

  async processTask(task) {
    switch (task.type) {
      case 'setup_pwa':
        return await this.setupPWA(task.params);
      case 'optimize_viewport':
        return await this.optimizeViewport(task.params);
      case 'implement_service_worker':
        return await this.implementServiceWorker(task.params);
      case 'mobile_performance':
        return await this.optimizeMobilePerformance(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async setupPWA(params) {
    const { appName = 'App', theme = '#3B82F6' } = params;
    
    // Create manifest.json
    const manifest = {
      name: appName,
      short_name: appName,
      description: `${appName} Progressive Web App`,
      theme_color: theme,
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ],
      prefer_related_applications: false
    };

    await fs.writeFile(
      path.join(process.cwd(), 'public', 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Create service worker
    await this.implementServiceWorker({ cacheStrategy: 'network-first' });

    return { success: true, pwa: true };
  }

  async implementServiceWorker(params) {
    const { cacheStrategy = 'cache-first' } = params;
    
    const swCode = `// Service Worker v1.0.0
const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/offline.html'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event with ${cacheStrategy} strategy
self.addEventListener('fetch', event => {
  ${this.generateCacheStrategy(cacheStrategy)}
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('App Update', options)
  );
});`;

    await fs.writeFile(
      path.join(process.cwd(), 'src', 'service-worker.js'),
      swCode
    );

    return { success: true, serviceWorker: true, strategy: cacheStrategy };
  }

  generateCacheStrategy(strategy) {
    const strategies = {
      'cache-first': `
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );`,
      'network-first': `
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );`,
      'stale-while-revalidate': `
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(response => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
          });
          return response;
        });
        return cachedResponse || fetchPromise;
      })
  );`
    };
    
    return strategies[strategy] || strategies['cache-first'];
  }

  async optimizeViewport(params) {
    const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">`;

    return { success: true, viewport: viewportMeta };
  }

  async optimizeMobilePerformance(params) {
    const optimizations = {
      lazyLoading: await this.implementLazyLoading(),
      touchOptimization: await this.optimizeTouchEvents(),
      imageOptimization: await this.optimizeImages(),
      criticalCSS: await this.extractCriticalCSS()
    };

    return { success: true, optimizations };
  }

  async implementLazyLoading() {
    const lazyLoadCode = `
// Lazy loading implementation
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.add('loaded');
      observer.unobserve(img);
    }
  });
});

lazyImages.forEach(img => imageObserver.observe(img));`;

    return { implemented: true, code: lazyLoadCode };
  }

  async optimizeTouchEvents() {
    const touchCode = `
// Touch optimization
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!touchStartX || !touchStartY) return;
  
  const xDiff = touchStartX - e.touches[0].clientX;
  const yDiff = touchStartY - e.touches[0].clientY;
  
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    // Horizontal swipe detected
    if (xDiff > 0) {
      // Swipe left
    } else {
      // Swipe right
    }
  }
}, { passive: true });`;

    return { implemented: true, code: touchCode };
  }

  async optimizeImages() {
    const pictureElement = `
<picture>
  <source media="(max-width: 640px)" srcset="image-mobile.webp" type="image/webp">
  <source media="(max-width: 640px)" srcset="image-mobile.jpg" type="image/jpeg">
  <source media="(max-width: 1024px)" srcset="image-tablet.webp" type="image/webp">
  <source media="(max-width: 1024px)" srcset="image-tablet.jpg" type="image/jpeg">
  <source srcset="image-desktop.webp" type="image/webp">
  <img src="image-desktop.jpg" alt="Description" loading="lazy">
</picture>`;

    return { implemented: true, example: pictureElement };
  }

  async extractCriticalCSS() {
    const criticalCSS = `
/* Critical CSS for above-the-fold content */
body { margin: 0; font-family: -apple-system, system-ui, sans-serif; }
.header { position: fixed; top: 0; width: 100%; background: white; z-index: 100; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
@media (max-width: 640px) { .container { padding: 0 0.75rem; } }`;

    return { implemented: true, css: criticalCSS };
  }
}

module.exports = MobileOptimizationAgent;