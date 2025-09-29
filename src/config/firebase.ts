import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    console.log('Initializing Firebase...');
    console.log('Environment:', process.env.NODE_ENV);

    // Check if we're in production and have environment variables
    if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Using Firebase environment variables for production...');
      
      // Use environment variables for production
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
    } else {
      console.log('Using Firebase service account file for development...');
      
      // Use service account file for development
      const serviceAccountPath = path.join('firebase.json');
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
      }
      
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.error('Make sure Firebase credentials are properly configured');
    throw error;
  }
};

export const getDb = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.firestore();
};