import React, { useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import WorkoutScreen from './src/Screens/WorkoutScreen.js';
import firebaseConfig from './firebase-config';

export default function App() {
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    logEvent(analytics, 'app_open');
  }, []);

  return <WorkoutScreen />;
}
