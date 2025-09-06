
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import serviceAccount from '@/../pathfinder-ai-xsk6g-firebase-adminsdk-fbsvc-cc792f8f5f.json';

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Server-side (Admin) Firestore instance
const firestore: AdminFirestore = getAdminFirestore();

export { firestore };
