import React, { useState, useRef, useEffect } from "react";

const PitchTest = () => {
  const [audioFiles, setAudioFiles] = useState([
    "/audio/august2019.mp3",
    "/audio/circus.mp3",
    "/audio/littlethings.mp3",
    "/audio/oompahpolks.mp3",
    "/audio/popsicle.mp3",
    "/audio/roselita.mp3",
    "/audio/smoothnylons.mp3",
    "/audio/taketowhere.mp3",
    "/audio/towntalk.mp3",
    "/audio/waffles.mp3",
    "/audio/primabossanova.mp3",
  ]);

  const [playbackRates, setPlaybackRates] = useState(
    audioFiles.map(() => 1) // Default playback speed for each file
  );

  const audioContextRef = useRef(null); // Shared Web Audio API context
  const audioBuffersRef = useRef([]); // Array of decoded audio buffers
  const audioSourcesRef = useRef([]); // Array of active audio source nodes
  const isPlayingRefs = useRef(audioFiles.map(() => false)); // Track if each audio is playing

  // Initialize the audio context and load all audio files
  useEffect(() => {
    const initializeAudio = async () => {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Load and decode each audio file
      const buffers = await Promise.all(
        audioFiles.map(async (file) => {
          const response = await fetch(file);
          const arrayBuffer = await response.arrayBuffer();
          return audioContextRef.current.decodeAudioData(arrayBuffer);
        })
      );

      audioBuffersRef.current = buffers;
    };

    initializeAudio();

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioFiles]);

  // Play the audio for a specific file
  const playSound = (index) => {
    if (!audioContextRef.current || !audioBuffersRef.current[index]) return;

    // Stop the previous playback if already playing
    if (isPlayingRefs.current[index] && audioSourcesRef.current[index]) {
      audioSourcesRef.current[index].stop();
    }

    // Create a new audio source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffersRef.current[index];
    source.playbackRate.value = playbackRates[index]; // Adjust playback rate
    source.connect(audioContextRef.current.destination);

    source.start(); // Start playback
    audioSourcesRef.current[index] = source; // Save the source reference
    isPlayingRefs.current[index] = true;

    // Stop tracking after playback ends
    source.onended = () => {
      isPlayingRefs.current[index] = false;
    };
  };

  // Update playback rate for a specific file
  const handlePlaybackRateChange = (index, rate) => {
    const newRates = [...playbackRates];
    newRates[index] = rate;
    setPlaybackRates(newRates);
  };

  return (
    <div>
      <h1>Audio Players</h1>
      {audioFiles.map((file, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <h3>File: {file.split("/").pop()}</h3>
          <button onClick={() => playSound(index)}>Play</button>

          <div>
            <label>Playback Speed: </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={playbackRates[index]}
              onChange={(e) =>
                handlePlaybackRateChange(index, parseFloat(e.target.value))
              }
            />
            <span>{playbackRates[index]}x</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PitchTest;
