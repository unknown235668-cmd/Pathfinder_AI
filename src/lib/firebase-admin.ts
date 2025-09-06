
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      JSON.stringify(require('@/../pathfinder-ai-xsk6g-firebase-adminsdk-fbsvc-cc792f8f5f.json'))
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Server-side (Admin) Firestore instance
const firestore: AdminFirestore = getAdminFirestore();

export { firestore };
