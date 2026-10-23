// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Load Firebase config dynamically (no credentials embedded in the repo)
importScripts("/firebase-config.js");

// Check if Firebase config is valid before initializing
const config = self.firebaseConfig || {};

// Only initialize if required fields are present
if (config.projectId && config.apiKey && config.authDomain && config.messagingSenderId && config.appId) {
  try {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message",
        payload
      );

      const notificationTitle = payload.notification?.title || "New Message";
      const notificationOptions = {
        body: payload.notification?.body,
        icon: "/assets/icons/logo-light.svg",
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
  }
} else {
  console.warn(
    "[firebase-messaging-sw.js] Firebase config is incomplete. Missing required fields:",
    {
      projectId: !config.projectId,
      apiKey: !config.apiKey,
      authDomain: !config.authDomain,
      messagingSenderId: !config.messagingSenderId,
      appId: !config.appId,
    }
  );
}
