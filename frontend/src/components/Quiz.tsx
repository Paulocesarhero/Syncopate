import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Song, Verse, Difficulty } from '../types';
import { fetchLyrics, saveProgress } from '../api/songs';
import { useAudio } from '../hooks/useAudio';
import './Quiz.css';

interface QuizProps {
  song: Song;
  difficulty: Difficulty;
  onBack: () => void;
}

function generateBlankedVerse(text: string, difficulty: Difficulty): string {
  const words = text.split(' ');
  
  if (difficulty === 'hard') {
    return words.map(() => '___').join(' ');
  }
  
  const blankCount = difficulty === 'easy' ? 1 : 2;
  const nonBlankWords = words.filter(w => w.length > 2);
  
  if (nonBlankWords.length < blankCount) {
    return words.map(() => '___').join(' ');
  }
  
  const blanks: (string | null)[] = words.map(w => w.length > 2 ? null : w);
  let placed = 0;
  let idx = Math.floor(Math.random() * words.length);
  
  while (placed < blankCount) {
    if (blanks[idx] === null) {
      blanks[idx] = '___';
      placed++;
    }
    idx = (idx + 1) % words.length;
  }
  
  return blanks.map(w => w || '___').join(' ');
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Quiz({ song, difficulty, onBack }: QuizProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentVerse = verses[currentVerseIdx];
  const blankedVerse = currentVerse ? generateBlankedVerse(currentVerse.text, difficulty) : '';

  const audioUrl = `http://localhost:8000${song.audio_file}`;

  const { playVerse, replayCurrentVerse, duration, seek } = useAudio({
    audioSrc: audioUrl,
    verses,
  });

  const options = useMemo(() => {
    if (!currentVerse || verses.length === 0) return [];
    const correctOption = currentVerse.text;
    const otherVerses = verses
      .filter((_, i) => i !== currentVerseIdx)
      .map(v => v.text);
    
    const shuffledOthers = shuffle(otherVerses).slice(0, 3);
    return shuffle([correctOption, ...shuffledOthers]);
  }, [verses, currentVerseIdx, currentVerse]);

  useEffect(() => {
    async function loadLyrics() {
      try {
        const lyrics = await fetchLyrics(song.id);
        setVerses(lyrics);
      } catch (err) {
        console.error('Error loading lyrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLyrics();
  }, [song.id]);

  useEffect(() => {
    if (!loading && verses.length > 0 && currentVerseIdx === 0 && currentVerse) {
      const timeout = setTimeout(() => {
        playVerse(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [loading, verses.length, currentVerseIdx, currentVerse, playVerse]);

  const handleSelectOption = useCallback((optionIdx: number) => {
    if (showResult) return;
    
    setSelectedOption(optionIdx);
    const isCorrect = options[optionIdx] === currentVerse?.text;
    
    setShowResult(true);
    
    if (isCorrect) {
      setScore(s => s + 1);
      
      setTimeout(() => {
        if (currentVerseIdx >= verses.length - 1) {
          setQuizComplete(true);
          saveProgress({ song_id: song.id, correct: score + 1, total: verses.length });
        } else {
          setCurrentVerseIdx(i => i + 1);
          setSelectedOption(null);
          setShowResult(false);
          playVerse(currentVerseIdx + 1);
        }
      }, 1500);
    } else {
      setTimeout(() => {
        setSelectedOption(null);
        setShowResult(false);
      }, 1500);
    }
  }, [showResult, options, currentVerse, currentVerseIdx, verses.length, song.id, score, playVerse]);

  const handleReplay = useCallback(() => {
    replayCurrentVerse();
  }, [replayCurrentVerse]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  }, [seek]);

  if (loading) {
    return (
      <div className="quiz">
        <div className="quiz__loading">Cargando...</div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="quiz">
        <div className="quiz__complete">
          <h2>¡Completado!</h2>
          <p className="quiz__score">Score: {score}/{verses.length}</p>
          <button className="quiz__back-btn" onClick={onBack}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <header className="quiz__header">
        <button className="quiz__back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1 className="quiz__title">{song.title}</h1>
        <div className="quiz__progress">
          {currentVerseIdx + 1} / {verses.length}
        </div>
      </header>

      <div className="quiz__player">
        <button className="quiz__replay" onClick={handleReplay}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
          Replay
        </button>
        <input
          type="range"
          className="quiz__seek"
          min={0}
          max={duration}
          step={0.1}
          defaultValue={0}
          onChange={handleSeek}
        />
      </div>

      <div className="quiz__verse">
        <p className="quiz__verse-text">{blankedVerse}</p>
      </div>

      <div className="quiz__options">
        {options.map((option, idx) => (
          <button
            key={idx}
            className={`quiz__option ${
              selectedOption === idx
                ? option === currentVerse?.text
                  ? 'quiz__option--correct'
                  : 'quiz__option--wrong'
                : ''
            } ${
              showResult && option === currentVerse?.text
                ? 'quiz__option--reveal'
                : ''
            }`}
            onClick={() => handleSelectOption(idx)}
            disabled={showResult}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="quiz__score-display">
        Score: {score}
      </div>
    </div>
  );
}