import React, { useEffect } from 'react';
import { app, initializeAnalytics } from "./firebase-config";
import { logEvent } from "firebase/analytics";
import WorkoutScreen from './src/Screens/WorkoutScreen.js';

export default function App() {
  useEffect(() => {
    const setupAnalytics = async () => {
      try {
        const analytics = await initializeAnalytics();
        if (analytics) {
          logEvent(analytics, 'app_open');
        } else {
          console.log('Analytics not supported in this environment');
        }
      } catch (error) {
        console.error('Analytics initialization error:', error);
      }
    };
    
    setupAnalytics();
  }, []);

  return <WorkoutScreen />;
}
