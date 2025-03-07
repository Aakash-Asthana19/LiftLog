import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { Audio } from 'expo-av';
import * as mime from 'react-native-mime-types';

const WorkoutScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [workout, setWorkout] = useState({
    exercise: '',
    reps: '',
    sets: '',
    weight: '',
  });

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
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording saved at:', uri);

      processAudioToText(uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const processAudioToText = async (uri) => {
    try {
      const mimeType = mime.lookup(uri) || 'audio/wav';
      const fileExtension = mime.extension(mimeType) || 'wav';
      const fileName = `audio.${fileExtension}`;

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: mimeType,
        name: fileName,
      });
      
      const IPAddress = ''; // MODIFY WITH YOUR IP ADDRESS!!!!

      const response = await fetch(`http://${IPAddress}:3000/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      

      const data = await response.json();

      if (response.ok) {
        console.log('Transcription:', data.transcription);
        setTranscription(data.transcription);
        parseVoiceInput(data.transcription);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const handleInputChange = (name, value) => {
    setWorkout({ ...workout, [name]: value });
  };

  const parseVoiceInput = (input) => {
    const lowerInput = input.toLowerCase();
    const exerciseRegex = /([a-zA-Z\s]+)/;
    const repsRegex = /(\d+)\sreps/;
    const setRegex = /set\s(\d+)/;
    const weightRegex = /(\d+)\spounds/;

    const exerciseMatch = lowerInput.match(exerciseRegex);
    const repsMatch = lowerInput.match(repsRegex);
    const setMatch = lowerInput.match(setRegex);
    const weightMatch = lowerInput.match(weightRegex);

    setWorkout({
      exercise: exerciseMatch ? (exerciseMatch[1] || '').trim() : workout.exercise,
      reps: repsMatch ? repsMatch[1] : workout.reps,
      sets: setMatch ? setMatch[1] : workout.sets,
      weight: weightMatch ? weightMatch[1] : workout.weight,
    });
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
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {transcription && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Transcription:</Text>
          <Text style={styles.transcription}>{transcription}</Text>
        </View>
      )}
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
  transcriptionContainer: {
    marginTop: 20,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcription: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default WorkoutScreen;
