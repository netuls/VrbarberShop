// ================================================
//  VR BARBER SHOP — Firebase Config
// ================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAI6Z4Ay6atavjrsBAfc0XWndjeAX8zbCM",
  authDomain: "admin-restaurante-ebc77.firebaseapp.com",
  projectId: "admin-restaurante-ebc77",
  storageBucket: "admin-restaurante-ebc77.firebasestorage.app",
  messagingSenderId: "883332092146",
  appId: "1:883332092146:web:43af09519de61e87f1006b",
  measurementId: "G-PY4WL4ZFZV"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
