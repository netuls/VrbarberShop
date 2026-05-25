// firebase-messaging-sw.js
// Service Worker para receber notificações push em background (iOS e Android)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAI6Z4Ay6atavjrsBAfc0XWndjeAX8zbCM",
  authDomain: "admin-restaurante-ebc77.firebaseapp.com",
  projectId: "admin-restaurante-ebc77",
  storageBucket: "admin-restaurante-ebc77.firebasestorage.app",
  messagingSenderId: "883332092146",
  appId: "1:883332092146:web:43af09519de61e87f1006b"
});

const messaging = firebase.messaging();

// Recebe e exibe notificações quando o app está em background ou fechado
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Novo Agendamento', {
    body: body || 'Um cliente acabou de agendar!',
    icon: icon || './logo.png',
    badge: './logo.png',
    vibrate: [200, 100, 200],
    tag: 'novo-agendamento',
    renotify: true,
    data: payload.data || {}
  });
});

// Ao clicar na notificação, abre o painel admin
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('admin') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./admin.html');
    })
  );
});
