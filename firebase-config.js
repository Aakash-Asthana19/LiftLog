// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYLGNvOtPHyXeQF6IRK2OXLQM9a2vtgNs",
  authDomain: "eloquent-hold-452818-d3.firebaseapp.com",
  projectId: "eloquent-hold-452818-d3",
  storageBucket: "eloquent-hold-452818-d3.firebasestorage.app",
  messagingSenderId: "842237190744",
  appId: "1:842237190744:web:7516f11e03b87b1ae0e02d",
  measurementId: "G-0L5TQ8JM9L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);