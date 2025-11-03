import { firebaseConfig } from './firebaseConfig';

// This file initializes Firebase and exports the Firestore instance.
// The Firebase SDKs are loaded from <script> tags in index.html, making the
// `firebase` object available on the global `window` scope.

// A simple check to see if the Firebase SDKs have loaded.
if (!(window as any).firebase) {
  throw new Error("Firebase SDK not loaded. Please check the script tags in index.html.");
}

// Initialize Firebase
const app = (window as any).firebase.initializeApp(firebaseConfig);

// Get a Firestore instance
const db = app.firestore();

// IMPORTANT: For a production application, you MUST configure Firestore Security Rules
// in the Firebase console to protect your data. A starting point could be:
//
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Allow anyone to read and create bowlers (for the public form and admin panel)
//     match /bowlers/{bowlerId} {
//       allow read, create: if true;
//       // To secure deletion, you would implement Firebase Authentication
//       // for your admin panel and change this rule to something like:
//       // allow delete: if request.auth != null;
//     }
//   }
// }
// Without proper security rules, your database is open to public modification.

export const bowlersCollection = db.collection('bowlers');
