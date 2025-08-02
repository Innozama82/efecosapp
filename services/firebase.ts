// Firebase initialization for the app
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDPOA1FlioFWIXcw4NCQA8O72gynjj2KBs",
  authDomain: "efecos-538f7.firebaseapp.com",
  projectId: "efecos-538f7",
  storageBucket: "efecos-538f7.appspot.com",
  messagingSenderId: "649177228733",
  appId: "1:649177228733:web:cfb3a1a9cd51ed4ad65ed4",
  measurementId: "G-FC0V6E8D1B"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { app, auth, db };