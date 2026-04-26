import { useRef, useCallback, useEffect, useState } from 'react';

const FFT_SIZE = 2048;
const MIN_VOCAL_FREQ = 300;
const MAX_VOCAL_FREQ = 3000;
const VOICE_ENERGY_THRESHOLD = 0.02;

interface UseAudioAnalysisOptions {
  audioElement?: HTMLAudioElement | null;
  sampleRate?: number;
}

interface VocalActivity {
  isActive: boolean;
  energy: number;
  dominantFrequency: number;
}

export function useAudioAnalysis({ audioElement, sampleRate = 44100 }: UseAudioAnalysisOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [vocalActivity, setVocalActivity] = useState<VocalActivity>({
    isActive: false,
    energy: 0,
    dominantFrequency: 0,
  });

  const initAudioContext = useCallback(() => {
    if (!audioElement || isInitialized) return;

    try {
      audioContextRef.current = new AudioContext({ sampleRate });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.8;

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio analysis:', error);
    }
  }, [audioElement, sampleRate, isInitialized]);

  const analyzeFrequencyBands = useCallback((dataArray: Uint8Array, frequencyData: Uint8Array): { energy: number; dominantFreq: number } => {
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const bufferLength = dataArray.length;
    const binSize = sampleRate / (bufferLength * 2);

    let lowBin = Math.floor(MIN_VOCAL_FREQ / binSize);
    let highBin = Math.floor(MAX_VOCAL_FREQ / binSize);
    lowBin = Math.max(0, Math.min(lowBin, bufferLength - 1));
    highBin = Math.max(0, Math.min(highBin, bufferLength - 1));

    let totalEnergy = 0;
    let maxEnergy = 0;
    let dominantBin = 0;

    for (let i = lowBin; i <= highBin; i++) {
      const energy = dataArray[i] / 255;
      totalEnergy += energy;

      if (energy > maxEnergy) {
        maxEnergy = energy;
        dominantBin = i;
      }
    }

    const avgEnergy = totalEnergy / (highBin - lowBin + 1);
    const dominantFreq = dominantBin * binSize;

    return {
      energy: avgEnergy,
      dominantFreq,
    };
  }, []);

  const analyze = useCallback((): VocalActivity => {
    if (!analyserRef.current || !audioContextRef.current) {
      return { isActive: false, energy: 0, dominantFrequency: 0 };
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    analyserRef.current.getByteFrequencyData(dataArray);
    analyserRef.current.getByteTimeDomainData(frequencyData);

    const { energy, dominantFreq } = analyzeFrequencyBands(dataArray, frequencyData);

    const isActive = energy > VOICE_ENERGY_THRESHOLD;

    const activity: VocalActivity = {
      isActive,
      energy,
      dominantFrequency: dominantFreq,
    };

    setVocalActivity(activity);
    return activity;
  }, [analyzeFrequencyBands]);

  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    if (audioElement && !isInitialized) {
      initAudioContext();
    }
  }, [audioElement, isInitialized, initAudioContext]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isInitialized,
    vocalActivity,
    analyze,
    resumeAudioContext,
    initAudioContext,
  };
}

export function getVocalFrequencyRange(): { min: number; max: number } {
  return { min: MIN_VOCAL_FREQ, max: MAX_VOCAL_FREQ };
}