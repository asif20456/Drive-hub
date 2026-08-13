import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "drive-hub-92e03.firebaseapp.com",
  projectId: "drive-hub-92e03",
  storageBucket: "drive-hub-92e03.firebasestorage.app",
  messagingSenderId: "681002841110",
  appId: "1:681002841110:web:ec6341ed8ce8d6e5b2b137",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);