import { useRef, useState, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import type { Verse } from '../types';

interface UseAudioOptions {
  audioSrc: string;
  verses: Verse[];
  onVerseEnd?: () => void;
}

export function useAudio({ audioSrc, verses, onVerseEnd }: UseAudioOptions) {
  const howlRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const verseIndexRef = useRef(0);
  const timeIntervalRef = useRef<number | null>(null);

  const initAudio = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    howlRef.current = new Howl({
      src: [audioSrc],
      html5: true,
      onplay: () => {
        setIsPlaying(true);
        // Start time tracking interval
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = window.setInterval(() => {
          if (howlRef.current) {
            const time = howlRef.current.seek() as number;
            setCurrentTime(time);
            
            // Check if current verse ended
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
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
      onstop: () => {
        setIsPlaying(false);
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
        onVerseEnd?.();
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
          timeIntervalRef.current = null;
        }
      },
    });
  }, [audioSrc, onVerseEnd, verses]);

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
    play,
    pause,
    stop,
    seek,
    playVerse,
    replayCurrentVerse,
    initAudio,
  };
}