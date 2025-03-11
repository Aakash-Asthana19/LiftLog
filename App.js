import React, { useEffect } from 'react';
import * as Analytics from 'expo-firebase-analytics';
import WorkoutScreen from './src/Screens/WorkoutScreen.js';

export default function App() {
  useEffect(() => {
    // Log app open event
    Analytics.logEvent('app_open');
  }, []);

  return <WorkoutScreen />;
}
