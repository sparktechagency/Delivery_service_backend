import * as admin from 'firebase-admin';
import { credential } from 'firebase-admin';


// const serviceAccount = require('../../deliverly-4811e-firebase-adminsdk-fbsvc-40b9e9f607.json');  
const serviceAccount = require('../../parceldeliveryapp-5dc60-firebase-adminsdk-fbsvc-4089ebb548.json');  
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: credential.cert(serviceAccount),
  });
} else {
  admin.app(); 
}

export default admin;