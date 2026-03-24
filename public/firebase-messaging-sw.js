importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyDNBw6qaB1Hi7JhIEErYNfBbjVLoVilTjE",
  authDomain: "uppi-brasil.firebaseapp.com",
  projectId: "uppi-brasil",
  storageBucket: "uppi-brasil.firebasestorage.app",
  messagingSenderId: "357522916455",
  appId: "1:357522916455:web:0882b7db636481277d40c2",
  measurementId: "G-LPX9RZLS8Z"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
