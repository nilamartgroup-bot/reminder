// Service Worker for Offline PWA and Lock-Screen Interactive Notifications
const CACHE_NAME = 'reminder-pro-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle interactive Notification Action Buttons (e.g. "✓ انجام شد" / Mark Completed)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action; // 'complete', 'snooze', or undefined (clicked body)
  const reminderId = event.notification.data?.reminderId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Send message to active window if open
      for (const client of clientList) {
        client.postMessage({
          type: 'REMINDER_ACTION',
          action: action || 'complete',
          reminderId: reminderId,
        });
        if ('focus' in client) {
          return client.focus();
        }
      }
      // If no window is currently open, open window and pass action query params
      if (self.clients.openWindow) {
        return self.clients.openWindow(`/?action=${action || 'complete'}&reminderId=${reminderId || ''}`);
      }
    })
  );
});
