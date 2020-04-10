// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.6.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'apiKey': 'AIzaSyAamZ5m5mAk_65PT1MhizNPqtC-4i1B82A',
  'projectId': 'd-mi2-1564330446417',
  'messagingSenderId': '633390037761',
  'appId': '1:633390037761:web:a3b75a20ded5e740'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
// noinspection JSUnusedGlobalSymbols
const messaging = firebase.messaging();

/*(function() {
  'use strict';

  self.addEventListener('notificationclick', (event) => {
    // Write the code to open
    if(clients.openWindow && event.notification.data.url) {
      event.waitUntil(clients.openWindow(event.notification.data.url));
    }
  });
}());*/
