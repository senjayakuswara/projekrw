import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTXWuD2uxYr2nSLC6IVLIHhgg_D18_boQ",
  authDomain: "projek-rw.firebaseapp.com",
  projectId: "projek-rw",
  storageBucket: "projek-rw.appspot.com",
  messagingSenderId: "880594762715",
  appId: "1:880594762715:web:3a35bfc6057b565fea05fe"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
