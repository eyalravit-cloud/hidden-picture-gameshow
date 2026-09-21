// Service worker בסיסי: מאפשר התקנה למסך הבית ופתיחה מהירה גם עם רשת חלשה.
// לא שומר תמונות שהועלו לתיקיות (אלה נטענות תמיד מרשת כדי לקבל עדכונים).
const CACHE_NAME = "gameshow-shell-v3";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./audio/correct.mp3",
  "./audio/wrong.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // תוכן מ-GitHub API / תמונות מהריפו - תמיד מהרשת (כדי לראות עדכונים חיים).
  if (url.origin.includes("api.github.com") || url.origin.includes("raw.githubusercontent.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
