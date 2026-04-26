import { useRef, useState, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import type { Verse } from '../types';

interface UseAudioOptions {
  audioSrc: string;
  verses: Verse[];
  onVerseEnd?: () => void;
}

interface VocalActivity {
  isActive: boolean;
  energy: number;
  dominantFrequency: number;
}

interface UseAudioReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  vocalActivity: VocalActivity;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  playVerse: (verseIdx: number) => void;
  replayCurrentVerse: () => void;
  initAudio: () => void;
}

export function useAudio({ audioSrc, verses, onVerseEnd }: UseAudioOptions): UseAudioReturn {
  const howlRef = useRef<Howl | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vocalActivity, setVocalActivity] = useState<VocalActivity>({
    isActive: false,
    energy: 0,
    dominantFrequency: 0,
  });
  const verseIndexRef = useRef(0);
  const timeIntervalRef = useRef<number | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);

  const MIN_VOCAL_FREQ = 300;
  const MAX_VOCAL_FREQ = 3000;
  const VOICE_ENERGY_THRESHOLD = 0.015;
  const FFT_SIZE = 2048;

  const analyzeVocalActivity = useCallback((): VocalActivity => {
    if (!sourceRef.current || !analyserRef.current || !audioContextRef.current) {
      return { isActive: false, energy: 0, dominantFrequency: 0 };
    }

    if (audioContextRef.current.state === 'suspended') {
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
    let maxEnergy = 0;
    let dominantBin = lowBin;

    for (let i = lowBin; i <= highBin && i < bufferLength; i++) {
      const energy = dataArray[i] / 255;
      totalEnergy += energy;

      if (energy > maxEnergy) {
        maxEnergy = energy;
        dominantBin = i;
      }
    }

    const avgEnergy = totalEnergy / (highBin - lowBin + 1);
    const dominantFreq = dominantBin * binSize;
    const isActive = avgEnergy > VOICE_ENERGY_THRESHOLD;

    return { isActive, energy: avgEnergy, dominantFrequency: dominantFreq };
  }, []);

  const startVocalAnalysis = useCallback(() => {
    if (!howlRef.current || sourceRef.current || !audioContextRef.current) return;

    try {
      const howlNode = (howlRef.current as any)._node;
      if (howlNode && howlNode.length > 0) {
        const audioEl = howlNode[0]?._node || howlNode[0];
        if (audioEl && audioEl.tagName === 'AUDIO') {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioEl as HTMLAudioElement);
          sourceRef.current.connect(analyserRef.current!);
          analyserRef.current!.connect(audioContextRef.current.destination);

          if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = window.setInterval(() => {
            const activity = analyzeVocalActivity();
            setVocalActivity(activity);
          }, 50);
        }
      }
    } catch (error) {
      console.warn('Could not initialize vocal analysis:', error);
    }
  }, [analyzeVocalActivity]);

  const stopVocalAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setVocalActivity({ isActive: false, energy: 0, dominantFrequency: 0 });
  }, []);

  const initAudio = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = 0.7;
    }

    howlRef.current = new Howl({
      src: [audioSrc],
      html5: true,
      onplay: () => {
        setIsPlaying(true);
        startVocalAnalysis();
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = window.setInterval(() => {
          if (howlRef.current) {
            const time = howlRef.current.seek() as number;
            setCurrentTime(time);
            const currentVerse = verses[verseIndexRef.current];
            if (currentVerse && time >= currentVerse.timestamp + currentVerse.duration) {
              howlRef.current.pause();
              onVerseEnd?.();
            }
          }
        }, 100);
      },
      onpause: () => {
        setIsPlaying(false);
        stopVocalAnalysis();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
      onstop: () => {
        setIsPlaying(false);
        stopVocalAnalysis();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
      onload: () => {
        setDuration(howlRef.current?.duration() || 0);
      },
      onend: () => {
        setIsPlaying(false);
        stopVocalAnalysis();
        onVerseEnd?.();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
    });
  }, [audioSrc, onVerseEnd, verses, startVocalAnalysis, stopVocalAnalysis]);

  const play = useCallback(() => {
    howlRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    howlRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    howlRef.current?.stop();
  }, []);

  const seek = useCallback((time: number) => {
    howlRef.current?.seek(time);
    setCurrentTime(time);
  }, []);

  const playVerse = useCallback((verseIdx: number) => {
    if (!howlRef.current || !verses[verseIdx]) return;

    const currentVerse = verses[verseIdx];
    verseIndexRef.current = verseIdx;

    howlRef.current.seek(currentVerse.timestamp);
    howlRef.current.play();
    setIsPlaying(true);
  }, [verses]);

  const replayCurrentVerse = useCallback(() => {
    if (verses.length === 0) return;
    playVerse(verseIndexRef.current);
  }, [verses, playVerse]);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioSrc) {
      initAudio();
    }
  }, [audioSrc, initAudio]);

  return {
    isPlaying,
    currentTime,
    duration,
    vocalActivity,
    play,
    pause,
    stop,
    seek,
    playVerse,
    replayCurrentVerse,
    initAudio,
  };
}