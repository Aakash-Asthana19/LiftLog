import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesome } from '@expo/vector-icons';


const CalendarScreen = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWorkoutsForDate(selectedDate);
  }, []);

  const fetchWorkoutsForDate = async (date) => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      const db = getFirestore();
      const workoutsRef = collection(db, 'workouts');
      const q = query(workoutsRef, 
        where('userId', '==', userId), 
        where('date', '==', date)
      );
  
      const querySnapshot = await getDocs(q);
      const workoutsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle both timestamp formats
        let timestamp;
        if (data.timestamp?.toDate) {
          timestamp = data.timestamp.toDate(); // New format (Timestamp)
        } else if (typeof data.timestamp === 'string') {
          timestamp = new Date(data.timestamp); // Old format (ISO string)
        } else {
          timestamp = null;
        }
  
        return {
          id: doc.id,
          ...data,
          timestamp: timestamp
        };
      });

      
      const groupedWorkouts = workoutsData.reduce((acc, workout) => {  // Group workouts by exercise and sort by timestamp
        const key = workout.exercise;
        if (!acc[key]) {
          acc[key] = {
            exercise: workout.exercise,
            sets: [],
            totalReps: 0,
            maxWeight: 0,
            minWeight: Infinity,
            timestamps: []
          };
        }
        
        acc[key].sets.push({
          reps: parseInt(workout.reps) || 0,
          weight: parseInt(workout.weight) || 0
        });
        
        acc[key].totalReps += parseInt(workout.reps) || 0;
        acc[key].maxWeight = Math.max(acc[key].maxWeight, parseInt(workout.weight) || 0);
        acc[key].minWeight = Math.min(acc[key].minWeight, parseInt(workout.weight) || Infinity);
        acc[key].timestamps.push(workout.timestamp);

        return acc;
      }, {});

      // Convert to array and sort by earliest timestamp
      const sortedWorkouts = Object.values(groupedWorkouts)
      .map(exercise => ({
        ...exercise,
        timestamps: exercise.timestamps.sort((a, b) => a - b)
      }))
      .sort((a, b) => a.timestamps[0] - b.timestamps[0]);

    setWorkouts(sortedWorkouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    Alert.alert('Error', 'Failed to load workouts');
  } finally {
    setIsLoading(false);
  }
};

  const getTotalVolume = () => {
    return workouts.reduce((total, exercise) => {
      return total + exercise.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
    }, 0);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={async (day) => {
          setSelectedDate(day.dateString);
          await fetchWorkoutsForDate(day.dateString);
        }}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: '#2ecc71',
            selectedTextColor: 'white'
          }
        }}
        theme={{
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#2ecc71',
          todayTextColor: '#2ecc71',
          dayTextColor: '#2d3436',
          textDisabledColor: '#d3d3d3',
          arrowColor: '#2ecc71',
          monthTextColor: '#2d3436',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : workouts.length === 0 ? (
          <Text style={styles.emptyText}>No workouts recorded for this day</Text>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Daily Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{workouts.length}</Text>
                  <Text style={styles.summaryLabel}>Exercises</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {workouts.reduce((total, exercise) => total + exercise.sets.length, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Sets</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{getTotalVolume()}</Text>
                  <Text style={styles.summaryLabel}>Total Volume</Text>
                </View>
              </View>
            </View>

            {workouts.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.exercise}</Text>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{exercise.sets.length}</Text>
                    <Text style={styles.statLabel}>Sets</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{exercise.totalReps}</Text>
                    <Text style={styles.statLabel}>Total Reps</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{exercise.maxWeight}</Text>
                    <Text style={styles.statLabel}>Max Weight</Text>
                  </View>
                </View>

                <View style={styles.setsContainer}>
                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setItem}>
                      <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                      <Text style={styles.setDetail}>{set.reps} reps</Text>
                      <Text style={styles.setDetail}>{set.weight} lbs</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ecc71',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  setNumber: {
    color: '#666',
    fontWeight: '500',
  },
  setDetail: {
    color: '#2d3436',
    fontWeight: '500',
  },
});

export default CalendarScreen;
