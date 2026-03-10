// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy8TD3ks19WTbONu3-0ggX2RrpHpHXuHc",
  authDomain: "chegaja-84e0c.firebaseapp.com",
  projectId: "chegaja-84e0c",
  storageBucket: "chegaja-84e0c.firebasestorage.app",
  messagingSenderId: "346124374041",
  appId: "1:346124374041:web:3db51893cec081f49f9a88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)