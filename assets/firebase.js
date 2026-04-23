import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvHUkN-oHsy6TNnXxgL-PzbqeDTk4NBVg",
  authDomain: "portfoliopavan-a79ea.firebaseapp.com",
  projectId: "portfoliopavan-a79ea",
  storageBucket: "portfoliopavan-a79ea.firebasestorage.app",
  messagingSenderId: "846941948950",
  appId: "1:846941948950:web:f99f130ac2785fbba07937"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc
};
