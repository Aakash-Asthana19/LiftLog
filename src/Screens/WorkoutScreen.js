import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const WorkoutScreen = () => {
  const [workout, setWorkout] = useState({ exercise: '', reps: '', sets: '', weight: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    processAudioToText(uri);
  };

  const processAudioToText = async (uri) => {
    const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    
    // Send audioBase64 to your backend server or directly to Google Cloud Speech-to-Text API
    // For simplicity, we'll just log it here
    console.log('Audio file ready for processing:', audioBase64.substr(0, 100) + '...');
    
    // TODO: Implement API call to Google Cloud Speech-to-Text
    // Parse the response and update the workout state
    // For now, we'll just set a placeholder text
    setWorkout({ ...workout, exercise: 'Speech recognition placeholder' });
  };

  const handleInputChange = (name, value) => {
    setWorkout({ ...workout, [name]: value });
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
      <Button
        title={isRecording ? "Stop Recording" : "Start Recording"}
        onPress={isRecording ? stopRecording : startRecording}
      />
      <Button title="Save Workout" onPress={() => console.log('Saving workout:', workout)} />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (styles remain the same)
});

export default WorkoutScreen;
