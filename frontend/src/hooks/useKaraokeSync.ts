import { useCallback, useRef, useState, useEffect } from "react";
import type { Word } from "../types";

interface UseKaraokeSyncOptions {
  words: Word[];
  currentTime: number;
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
}

interface KaraokeState {
  currentWordIndex: number | null;
  vocalActivity: {
    isActive: boolean;
    energy: number;
  };
}

const MIN_VOCAL_FREQ = 300;
const MAX_VOCAL_FREQ = 3000;

export function useKaraokeSync({
  words,
  currentTime,
  isPlaying,
  audioElement,
}: UseKaraokeSyncOptions) {
  const [karaokeState, setKaraokeState] = useState<KaraokeState>({
    currentWordIndex: null,
    vocalActivity: { isActive: false, energy: 0 },
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const MIN_VOCAL_FREQ = 300;
  const MAX_VOCAL_FREQ = 3000;
  const VOICE_ENERGY_THRESHOLD = 0.015;
  const FFT_SIZE = 2048;

  const initAudioAnalysis = useCallback(() => {
    if (!audioElement || audioContextRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.7;

      sourceRef.current =
        audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error("Error initializing audio analysis:", error);
    }
  }, [audioElement]);

  const findCurrentWordIndex = useCallback(
    (time: number, wordList: Word[]): number | null => {
      if (!wordList || wordList.length === 0) return null;

      for (let i = 0; i < wordList.length; i++) {
        const currentWord = wordList[i];
        const nextWord = wordList[i + 1];

        if (i === wordList.length - 1) {
          if (time >= currentWord.timestamp) {
            return i;
          }
        } else if (
          time >= currentWord.timestamp &&
          (!nextWord || time < nextWord.timestamp)
        ) {
          return i;
        }
      }

      return null;
    },
    [],
  );

  const analyzeVocalActivity = useCallback((): {
    isActive: boolean;
    energy: number;
  } => {
    if (!analyserRef.current || !audioContextRef.current) {
      return { isActive: false, energy: 0 };
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sampleRate = audioContextRef.current.sampleRate;
    const binSize = sampleRate / (bufferLength * 2);

    const lowBin = Math.floor(MIN_VOCAL_FREQ / binSize);
    const highBin = Math.floor(MAX_VOCAL_FREQ / binSize);

    let totalEnergy = 0;
    const binsInRange = highBin - lowBin + 1;

    for (let i = lowBin; i <= highBin && i < bufferLength; i++) {
      totalEnergy += dataArray[i] / 255;
    }

    const avgEnergy = totalEnergy / binsInRange;
    const isActive = avgEnergy > VOICE_ENERGY_THRESHOLD;

    return { isActive, energy: avgEnergy };
  }, []);

  const updateKaraokeState = useCallback(() => {
    const wordIndex = findCurrentWordIndex(currentTime, words);
    const { isActive, energy } = analyzeVocalActivity();

    setKaraokeState({
      currentWordIndex: wordIndex,
      vocalActivity: { isActive, energy },
    });

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateKaraokeState);
    }
  }, [
    currentTime,
    words,
    isPlaying,
    findCurrentWordIndex,
    analyzeVocalActivity,
  ]);

  useEffect(() => {
    if (audioElement) {
      initAudioAnalysis();
    }
  }, [audioElement, initAudioAnalysis]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateKaraokeState);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateKaraokeState]);

  useEffect(() => {
    const wordIndex = findCurrentWordIndex(currentTime, words);
    setKaraokeState((prev) => ({
      ...prev,
      currentWordIndex: wordIndex,
    }));
  }, [currentTime, words, findCurrentWordIndex]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    currentWordIndex: karaokeState.currentWordIndex,
    vocalActivity: karaokeState.vocalActivity,
    isInitialized: !!audioContextRef.current,
  };
}

export function getVocalFrequencyRange(): { min: number; max: number } {
  return { min: MIN_VOCAL_FREQ, max: MAX_VOCAL_FREQ };
}
