// js/firebase-config.js
// Initialize Firebase app and export references

// Firebase configuration for your project
const firebaseConfig = {
  apiKey: "AIzaSyCvIDH7ivXDopEunnuBXcPR-KOFAxzhgwo",
  authDomain: "customerengagementwebsite.firebaseapp.com",
  projectId: "customerengagementwebsite",
  storageBucket: "customerengagementwebsite.appspot.com", // fixed typo
  messagingSenderId: "369251893161",
  appId: "1:369251893161:web:eb1c6375c05f0273daceb8",
  measurementId: "G-R6Z5ZWJXR2",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Analytics if available
if ("measurementId" in firebaseConfig) {
  firebase.analytics();
}

// Export Firebase services for use in other scripts
const auth = firebase.auth(); // Firebase Authentication
const db = firebase.firestore(); // Firestore Database
const messaging = firebase.messaging(); // Firebase Cloud Messaging

window.auth = auth;
window.db = db;
window.messaging = messaging;
