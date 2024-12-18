import React, { useState, useRef, useEffect } from "react";
import path from "path-browserify";

const PitchTest = () => {
  const [audioFiles, setAudioFiles] = useState([
    // "/audio/august2019.mp3",
    "/audio/oompahpolks.mp3",
    // "/audio/popsicle.mp3",
    // "/audio/sweetstory.mp3",
    // "/audio/smoothnylons.mp3",
    // "/audio/taketowhere.mp3",
    // "/audio/towntalk.mp3",
    // "/audio/easymover.mp3",
    // "/audio/Diamonds.mp3",
    "/audio/shop.mp3",
    "/audio/toystory.mp3",
    "/audio/mrlonely.mp3",
    "/audio/firefly.mp3",
    "/audio/catgroove.mp3",
    "/audio/pizzadelivery!.mp3",
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

  const downloadModifiedAudio = async (index, fileName) => {
    if (!audioBuffersRef.current[index]) return;

    // Calculate the adjusted length based on playback rate
    const originalLength = audioBuffersRef.current[index].length;
    const sampleRate = audioBuffersRef.current[index].sampleRate;
    const playbackRate = playbackRates[index];
    const adjustedLength = Math.ceil(originalLength / playbackRate);

    // Create an OfflineAudioContext with the adjusted length
    const offlineContext = new OfflineAudioContext(
      2, // Stereo channels
      adjustedLength, // Adjusted length for playback rate
      sampleRate // Original sample rate
    );

    // Create an AudioBufferSourceNode
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffersRef.current[index];
    source.playbackRate.value = playbackRate; // Apply playback rate

    source.connect(offlineContext.destination);
    source.start();

    // Render the audio offline
    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV/Blob for download
    const blob = bufferToWave(renderedBuffer, renderedBuffer.length);
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger the download
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${fileName} - Pitch ${playbackRate}.wav`;
    document.body.appendChild(a);
    console.log(audioBuffersRef.current);
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Helper: Convert AudioBuffer to WAV
  const bufferToWave = (buffer, length) => {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const formatLength = 44 + length * numOfChannels * 2;
    const bufferArray = new ArrayBuffer(formatLength);
    const view = new DataView(bufferArray);

    // WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + length * numOfChannels * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, length * numOfChannels * 2, true);

    // WAV data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i] * 32767;
        view.setInt16(offset, sample < 0 ? sample : sample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  };

  // Helper: Write string to DataView
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  audioFiles.map((file) => {
    console.log(path.basename(file));
  });
  return (
    <div>
      <h1>Audio Players</h1>
      {audioFiles.map((file, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <h3>File: {path.basename(file)}</h3>

          <div>
            <label>Playback Speed: </label>
            <input
              type="range"
              min="0.05"
              max="2"
              step="0.05"
              value={playbackRates[index]}
              onChange={(e) =>
                handlePlaybackRateChange(index, parseFloat(e.target.value))
              }
            />
            <span>Pitch {playbackRates[index]}</span>
          </div>
          <button onClick={() => playSound(index)}>Play</button>
          <button
            onClick={() => downloadModifiedAudio(index, path.basename(file))}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
};

export default PitchTest;
