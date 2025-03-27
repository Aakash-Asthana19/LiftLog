import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [workouts, setWorkouts] = useState([]); // State to store workouts


  const onDayPress = async (day) => {
    setSelectedDate(day.dateString);
    await fetchWorkoutsForDate(day.dateString); // Fetch workouts for selected date
  };
  

  const fetchWorkoutsForDate = async (date) => {
    const auth = getAuth();
    const userId = auth.currentUser ? auth.currentUser.uid : null;
  
    if (!userId) {
      console.error('User not logged in');
      return [];
    }
  
    const db = getFirestore();
    const workoutsRef = collection(db, 'workouts');
    const q = query(workoutsRef, where('userId', '==', userId), where('date', '==', date));
  
    try {
      const querySnapshot = await getDocs(q);
      const workoutsForDate = [];
      querySnapshot.forEach((doc) => {
        workoutsForDate.push(doc.data());
      });
      setWorkouts(workoutsForDate); // Update state with fetched workouts
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };
  
  

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: 'blue' },
        }}
      />
      {selectedDate && (
        <View style={styles.workoutInfo}>
          <Text style={styles.dateText}>Workouts for {selectedDate}:</Text>
          {workouts.map((workout, index) => (
            <Text key={index}>
              {workout.exercise}: {workout.sets} sets, {workout.reps} reps, {workout.weight} lbs
            </Text>
          ))}
        </View>
      )}
    </View>
  );
    
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  workoutInfo: {
    marginTop: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CalendarScreen;
