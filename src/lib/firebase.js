// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// You can remove storage if it’s no longer needed; otherwise, leave it for other Firebase services.
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7lG2JDB203Teb6jd3cNpk3oSGHYML7oo",
  authDomain: "reactchat-53aec.firebaseapp.com",
  projectId: "reactchat-53aec",
  storageBucket: "reactchat-53aec.appspot.com",
  messagingSenderId: "868298477478",
  appId: "1:868298477478:web:a717b43f76ce391e8e0967",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
