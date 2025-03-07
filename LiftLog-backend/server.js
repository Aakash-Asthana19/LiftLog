const express = require('express');
const multer = require('multer');
const speech = require('@google-cloud/speech');
const workoutController = require('./workoutController');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // Import exec to run ffmpeg
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

// Configure multer to save uploaded files in 'uploads/' directory
const upload = multer({ dest: 'uploads/' });

// Initialize Google Cloud Speech client
const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Function to convert m4a to wav
const convertToWav = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    // Enclose inputPath in quotes to handle spaces
    const command = `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg conversion error:', error);
        return reject(error);
      }
      console.log('FFmpeg conversion stdout:', stdout);
      console.error('FFmpeg conversion stderr:', stderr);
      resolve(outputPath);
    });
  });
};

// Function to parse transcription and extract workout data
function parseTranscription(transcription) {
  const lowerInput = transcription.toLowerCase();
  const exerciseRegex = /([a-zA-Z\s]+)(?=set|reps|pounds)/;
  const repsRegex = /(\d+)\sreps/;
  const setRegex = /set\s(\d+)/;
  const weightRegex = /(\d+)\spounds/;

  const exerciseMatch = lowerInput.match(exerciseRegex);
  const repsMatch = lowerInput.match(repsRegex);
  const setMatch = lowerInput.match(setRegex);
  const weightMatch = lowerInput.match(weightRegex);

  return {
    exercise: exerciseMatch ? (exerciseMatch[1] || '').trim() : '',
    reps: repsMatch ? repsMatch[1] : '',
    sets: setMatch ? setMatch[1] : '',
    weight: weightMatch ? weightMatch[1] : '',
    timestamp: new Date().toISOString(),
  };
}

// Endpoint for transcribing audio
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('Received file:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = path.resolve(req.file.path);
    const outputPath = inputPath + '.wav';

    // Convert to wav
    await convertToWav(inputPath, outputPath);

    // Read the converted wav file
    const audioBytes = fs.readFileSync(outputPath).toString('base64');

    // Configure request for Google Cloud Speech-to-Text API
    const audio = { content: audioBytes };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = { audio, config };

    // Send request to Google Cloud Speech-to-Text API
    const [response] = await client.recognize(request);

    // Process transcription response
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log(`Transcription: ${transcription}`);

    // Parse transcription and prepare workout data
    const workoutData = parseTranscription(transcription);

    // Add workout to Firestore
    await workoutController.addWorkout(workoutData);

    res.json({ transcription });

    // Clean up: Remove files after processing
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ error: 'An error occurred during transcription' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});