// firebase-messaging-sw.js
// Service worker for Firebase Cloud Messaging (FCM)

importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCvIDH7ivXDopEunnuBXcPR-KOFAxzhgwo",
  authDomain: "customerengagementwebsite.firebaseapp.com",
  projectId: "customerengagementwebsite",
  storageBucket: "customerengagementwebsite.appspot.com",
  messagingSenderId: "369251893161",
  appId: "1:369251893161:web:eb1c6375c05f0273daceb8",
  measurementId: "G-R6Z5ZWJXR2",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192.png", // Optional: add your own icon
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
