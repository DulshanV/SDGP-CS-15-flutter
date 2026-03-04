// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// HOW TO GET YOUR CONFIG:
//   1. Go to https://console.firebase.google.com
//   2. Open your project → Project Settings (gear icon)
//   3. Scroll to "Your apps" → click the web app (</>)
//   4. Copy the firebaseConfig values below
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4CfVHQdOBCxexYnBBv0ryb3A_lai38Rk",
    authDomain: "ceylon-hs.firebaseapp.com",
    projectId: "ceylon-hs",
    storageBucket: "ceylon-hs.firebasestorage.app",
    messagingSenderId: "1087856269110",
    appId: "1:1087856269110:web:669a4fb469208428abc597",
    measurementId: "G-26MXDJK1GQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
