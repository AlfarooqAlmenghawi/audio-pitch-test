import React, { useState, useRef, useEffect } from "react";

const PitchTest = () => {
  const [playbackRate, setPlaybackRate] = useState(1); // Default playback speed (1 = normal)
  const audioContextRef = useRef(null); // Web Audio API context
  const audioBufferRef = useRef(null); // Reference to the loaded audio buffer
  const audioSourceRef = useRef(null); // Reference to the audio source node
  const isPlayingRef = useRef(false); // Track if audio is playing

  // Function to initialize the audio context and load the audio
  useEffect(() => {
    const initializeAudio = async () => {
      // Create the audio context
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Fetch and decode the audio file
      const response = await fetch("public/audio/taketowhere.mp3"); // Replace with your audio file
      const arrayBuffer = await response.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
    };

    initializeAudio();

    // Cleanup on component unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Function to play the audio
  const playSound = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    // Stop previous playback if it's already playing
    if (isPlayingRef.current && audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    // Create a new audio source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate; // Adjust playback rate
    source.connect(audioContextRef.current.destination);

    // Start playback
    source.start();
    audioSourceRef.current = source; // Save the source reference
    isPlayingRef.current = true;

    // Stop tracking after playback ends
    source.onended = () => {
      isPlayingRef.current = false;
    };
  };

  return (
    <div>
      <h1>Audio Player</h1>
      <button onClick={playSound}>Play</button>

      <div>
        <label>Playback Speed: </label>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
        />
        <span>{playbackRate}x</span>
      </div>
    </div>
  );
};

export default PitchTest;
