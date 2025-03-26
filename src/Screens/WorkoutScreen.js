import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Audio } from 'expo-av';
import * as mime from 'react-native-mime-types';
import { FontAwesome } from '@expo/vector-icons';
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getApp } from "firebase/app";

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
      
      try {
        const analytics = await initializeAnalytics();
        if (analytics) {
          logEvent(analytics, 'start_recording');
        }
      } catch (analyticsError) {
        console.error('Analytics error:', analyticsError);
      }
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
      
      try {
        const analytics = await initializeAnalytics();
        if (analytics) {
          logEvent(analytics, 'stop_recording');
        }
      } catch (analyticsError) {
        console.error('Analytics error:', analyticsError);
      }
      
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

      const response = await fetch('http://128.61.15.40:3000/transcribe', { //update with your IP ADDRESS
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
    if (!input) return; // Check if input is not null or undefined

    const lowerInput = input.toLowerCase();

    //command must be said in a certain way as of now
    const exerciseRegex = /([a-zA-Z\s]+)(?=\d+\sreps|set|pounds)/; //get exercise name before reps, set, or pounds
    const repsRegex = /(\d+)\sreps/; //get number followed by "reps"
    const setRegex = /set\s(\d+)/; //get number after "set"
    const weightRegex = /(\d+)\spounds/; //get number followed by "pounds"

    const exerciseMatch = lowerInput.match(exerciseRegex);
    const repsMatch = lowerInput.match(repsRegex);
    const setMatch = lowerInput.match(setRegex);
    const weightMatch = lowerInput.match(weightRegex);

    setWorkout({
      exercise: exerciseMatch ? exerciseMatch[1].trim() : workout.exercise,
      reps: repsMatch ? repsMatch[1] : workout.reps,
      sets: setMatch ? setMatch[1] : workout.sets,
      weight: weightMatch ? weightMatch[1] : workout.weight,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          {/* Translucent Mic Background */}
          <Image
            source={require('../../assets/mic_background.png')}
            style={styles.backgroundImage}
          />

          <View style={styles.header}>
            <Text style={styles.title}>Lift-Log</Text>
            <Text style={styles.subtitle}>Text-to-Speech Activated</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={workout.exercise || "Exercise Name"}
              placeholderTextColor={'gray'}
              value={workout.exercise}
              onChangeText={(text) => handleInputChange('exercise', text)}
            />
            <TextInput
              style={styles.input}
              placeholder={workout.sets || "Set #"}
              placeholderTextColor={'gray'}
              value={workout.sets}
              onChangeText={(text) => handleInputChange('sets', text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder={workout.reps || "Reps #"}
              placeholderTextColor={'gray'}
              value={workout.reps}
              onChangeText={(text) => handleInputChange('reps', text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder={workout.weight || "Weight (lbs)"}
              placeholderTextColor={'gray'}
              value={workout.weight}
              onChangeText={(text) => handleInputChange('weight', text)}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.recordButton, isRecording ? styles.recording : null]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <FontAwesome
              name="microphone"
              size={24}
              color="white"
            />
          </TouchableOpacity>

          {transcription && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionTitle}>Transcription:</Text>
              <Text style={styles.transcription}>{transcription}</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  header: {
    marginTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  recordButton: {
    backgroundColor: '#5dade2',
    padding: 15,
    borderRadius: 30,
    marginBottom: 20,
  },
  recording: {
    backgroundColor: 'red',
  },
  transcriptionContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  transcription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default WorkoutScreen;
