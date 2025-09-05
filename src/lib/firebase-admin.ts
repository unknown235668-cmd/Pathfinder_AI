import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';

// Server-side (Admin) Firebase app initialization
if (admin.apps.length === 0) {
  admin.initializeApp({
    // Explicitly providing the projectId can resolve authentication issues in some environments.
    projectId: 'pathfinder-ai-xsk6g'
  });
}

// Server-side (Admin) Firestore instance
const firestore: AdminFirestore = getAdminFirestore();

export { firestore };
