import React, { useEffect } from 'react';
import { app, analytics } from './firebaseClient';
import WorkoutScreen from './src/Screens/WorkoutScreen.js';

export default function App() {
  useEffect(() => {
    // Log app open event
    analytics().logAppOpen();
  }, []);

  return <WorkoutScreen />;
}
