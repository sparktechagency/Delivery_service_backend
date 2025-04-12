// src/config/firebase.ts
import * as admin from 'firebase-admin';
import { credential } from 'firebase-admin';

const serviceAccount = require('../../parceldeliveryapp-5dc60-firebase-adminsdk-fbsvc-4089ebb548.json');  // Ensure the path is correct

admin.initializeApp({
  credential: credential.cert(serviceAccount),
});

export default admin;
