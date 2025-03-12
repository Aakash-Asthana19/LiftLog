import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYLGNvOtPHyXeQF6IRK2OXLQM9a2vtgNs",
  authDomain: "eloquent-hold-452818-d3.firebaseapp.com",
  projectId: "eloquent-hold-452818-d3",
  storageBucket: "eloquent-hold-452818-d3.firebasestorage.app",
  messagingSenderId: "842237190744",
  appId: "1:842237190744:web:7516f11e03b87b1ae0e02d",
  measurementId: "G-0L5TQ8JM9L"
};

//Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const initializeAnalytics = async () => {
  try {
    const analyticsSupported = await isSupported();
    return analyticsSupported ? getAnalytics(app) : null;
  } catch (error) {
    console.log('Analytics initialization failed:', error);
    return null;
  }
};

export { app, initializeAnalytics };
