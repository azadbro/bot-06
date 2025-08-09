import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPE3oCwiUZiUggcID-Le-wy2EHGa-ZJDw",
  authDomain: "trx-earn-bott.firebaseapp.com",
  projectId: "trx-earn-bott",
  storageBucket: "trx-earn-bott.firebasestorage.app",
  messagingSenderId: "682053542270",
  appId: "1:682053542270:web:780046a72f2142635d132f",
  measurementId: "G-12MGRKXTPD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics };
export default app;