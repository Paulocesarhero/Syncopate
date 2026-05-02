import { useRef, useState, useCallback, useEffect } from "react";
import { Howl } from "howler";
import type { Verse } from "../types";

interface UseAudioOptions {
  audioSrc: string;
  verses: Verse[];
  onVerseEnd?: () => void;
  autoPauseAtVerseEnd?: boolean;
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
  isReady: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  playVerse: (verseIdx: number) => void;
  replayCurrentVerse: (verseIdx: number) => void;
  initAudio: () => void;
}

export function useAudio({
  audioSrc,
  verses,
  onVerseEnd,
  autoPauseAtVerseEnd = true,
}: UseAudioOptions): UseAudioReturn {
  const howlRef = useRef<Howl | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const versesRef = useRef<Verse[]>([]);
  const onVerseEndRef = useRef(onVerseEnd);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vocalActivity, setVocalActivity] = useState<VocalActivity>({
    isActive: false,
    energy: 0,
    dominantFrequency: 0,
  });
  const [isReady, setIsReady] = useState(false);
  const verseIndexRef = useRef(0);
  const timeIntervalRef = useRef<number | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);

  const MIN_VOCAL_FREQ = 300;
  const MAX_VOCAL_FREQ = 3000;
  const VOICE_ENERGY_THRESHOLD = 0.015;
  const FFT_SIZE = 2048;

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    onVerseEndRef.current = onVerseEnd;
  }, [onVerseEnd]);

  const cleanupAudioAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current = null;
    }
    setVocalActivity({ isActive: false, energy: 0, dominantFrequency: 0 });
  }, []);

  const analyzeVocalActivity = useCallback((): VocalActivity => {
    if (!analyserRef.current || !audioContextRef.current) {
      return { isActive: false, energy: 0, dominantFrequency: 0 };
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
    if (
      !audioElementRef.current ||
      !audioContextRef.current ||
      !analyserRef.current
    ) {
      return;
    }

    try {
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {}
      }

      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioElementRef.current,
      );
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      analysisIntervalRef.current = window.setInterval(() => {
        const activity = analyzeVocalActivity();
        setVocalActivity(activity);
      }, 50);
    } catch (error) {
      console.warn("Could not initialize vocal analysis:", error);
    }
  }, [analyzeVocalActivity]);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }
      } catch (e) {}
    }

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = FFT_SIZE;
    analyserRef.current.smoothingTimeConstant = 0.7;
  }, []);

  const playVerse = useCallback((verseIdx: number) => {
    if (!howlRef.current || !versesRef.current[verseIdx]) return;

    const currentVerse = versesRef.current[verseIdx];
    verseIndexRef.current = verseIdx;

    howlRef.current.seek(currentVerse.timestamp);
    howlRef.current.play();
    setIsPlaying(true);
  }, []);

  const replayCurrentVerse = useCallback(
    (verseIdx: number) => {
      if (versesRef.current.length === 0) return;
      playVerse(verseIdx);
    },
    [playVerse],
  );

  const initAudio = useCallback(() => {
    setIsReady(false);
    cleanupAudioAnalysis();

    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }

    initAudioContext();

    howlRef.current = new Howl({
      src: [audioSrc],
      html5: true,
      onplay: () => {
        setIsPlaying(true);

        const howl = howlRef.current;
        if (howl) {
          const node = (howl as any)._node;
          const audioEl = node?.[0]?._node || node?.[0];
          if (audioEl && audioEl.tagName === "AUDIO") {
            audioElementRef.current = audioEl as HTMLAudioElement;
          }
        }

        startVocalAnalysis();

        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
        }
        timeIntervalRef.current = window.setInterval(() => {
          if (howlRef.current) {
            const time = howlRef.current.seek() as number;
            setCurrentTime(time);
            const currentVerse = versesRef.current[verseIndexRef.current];
            if (
              currentVerse &&
              autoPauseAtVerseEnd &&
              time >= currentVerse.timestamp + currentVerse.duration
            ) {
              howlRef.current.pause();
              onVerseEndRef.current?.();
            }
          }
        }, 100);
      },
      onpause: () => {
        setIsPlaying(false);
        cleanupAudioAnalysis();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
      onstop: () => {
        setIsPlaying(false);
        cleanupAudioAnalysis();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
      onload: () => {
        setDuration(howlRef.current?.duration() || 0);
        setIsReady(true);
      },
      onloaderror: (_soundId, error) => {
        console.error("Audio load error:", error);
        setIsReady(false);
      },
      onend: () => {
        setIsPlaying(false);
        cleanupAudioAnalysis();
        onVerseEndRef.current?.();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
    });
  }, [audioSrc, startVocalAnalysis, cleanupAudioAnalysis, initAudioContext]);

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

  useEffect(() => {
    return () => {
      cleanupAudioAnalysis();
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [cleanupAudioAnalysis]);

  useEffect(() => {
    if (audioSrc) {
      initAudio();
    }
  }, [audioSrc]);

  return {
    isPlaying,
    currentTime,
    duration,
    vocalActivity,
    isReady,
    play,
    pause,
    stop,
    seek,
    playVerse,
    replayCurrentVerse,
    initAudio,
  };
}
