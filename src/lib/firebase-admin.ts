import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';

// Server-side (Admin) Firebase app initialization
if (admin.apps.length === 0) {
  // When GOOGLE_APPLICATION_CREDENTIALS is set, it will be used automatically
  admin.initializeApp();
}

// Server-side (Admin) Firestore instance
const firestore: AdminFirestore = getAdminFirestore();

export { firestore };
