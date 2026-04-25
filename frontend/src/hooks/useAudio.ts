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

  const initAudio = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    howlRef.current = new Howl({
      src: [audioSrc],
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onload: () => {
        setDuration(howlRef.current?.duration() || 0);
      },
      onend: () => {
        setIsPlaying(false);
        onVerseEnd?.();
      },
    });
  }, [audioSrc, onVerseEnd]);

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

    const startTime = currentVerse.timestamp;

    howlRef.current.seek(startTime);
    howlRef.current.play();

    setIsPlaying(true);
  }, [verses, duration]);

  const replayCurrentVerse = useCallback(() => {
    if (verses.length === 0) return;
    playVerse(verseIndexRef.current);
  }, [verses, playVerse]);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
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