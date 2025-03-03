import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
// import * as Speech from 'expo-speech-to-text';

const WorkoutScreen = () => {
  const [workout, setWorkout] = useState({ exercise: '', reps: '', sets: '', weight: '' });
  const [isListening, setIsListening] = useState(false);

  const handleInputChange = (name, value) => {
    setWorkout({ ...workout, [name]: value });
  };

  const startListening = async () => {
    try {
      await Speech.requestPermissionsAsync();
      setIsListening(true);
      const { results } = await Speech.startListeningAsync();
      if (results && results.length > 0) {
        parseVoiceInput(results[0]);
      }
    } catch (error) {
      console.error('Error listening:', error);
    } finally {
      setIsListening(false);
    }
  };

  const parseVoiceInput = (input) => {
    // Implement parsing logic here
    // For now, just set the exercise name
    setWorkout({ ...workout, exercise: input });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Workout</Text>
      <TextInput
        style={styles.input}
        placeholder="Exercise"
        value={workout.exercise}
        onChangeText={(text) => handleInputChange('exercise', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        value={workout.reps}
        onChangeText={(text) => handleInputChange('reps', text)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Sets"
        value={workout.sets}
        onChangeText={(text) => handleInputChange('sets', text)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (lbs)"
        value={workout.weight}
        onChangeText={(text) => handleInputChange('weight', text)}
        keyboardType="numeric"
      />
      <Button title={isListening ? "Listening..." : "Voice Input"} onPress={startListening} />
      <Button title="Save Workout" onPress={() => console.log('Saving workout:', workout)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default WorkoutScreen;
