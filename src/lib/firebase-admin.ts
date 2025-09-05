
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Server-side (Admin) Firebase app initialization
if (admin.apps.length === 0) {
  // Explicitly load the service account credentials from the file path
  // specified in the environment variable. This is the most robust way
  // to ensure authentication works in all environments.
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath) {
    throw new Error('The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  }

  // Verify the file exists before attempting to read it
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

// Server-side (Admin) Firestore instance
const firestore: AdminFirestore = getAdminFirestore();

export { firestore };
