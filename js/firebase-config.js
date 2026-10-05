// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyA15jqBkvI1w_Sf41F7V7Kn6nRfhermzQs",
    authDomain: "iron-forge-444a0.firebaseapp.com",
    projectId: "iron-forge-444a0",
    storageBucket: "iron-forge-444a0.firebasestorage.app",
    messagingSenderId: "237839367060",
    appId: "1:237839367060:web:c13ef92e1e64244b20ad81",
    measurementId: "G-8GJ0H2NNXY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { auth, googleProvider, db };
