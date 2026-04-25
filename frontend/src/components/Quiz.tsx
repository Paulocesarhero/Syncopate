import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Song, Verse, Word, Difficulty } from '../types';
import { fetchLyrics, saveProgress } from '../api/songs';
import { useAudio } from '../hooks/useAudio';
import './Quiz.css';

interface QuizProps {
  song: Song;
  difficulty: Difficulty;
  onBack: () => void;
}

// Generate blanks in verse based on difficulty
function generateBlanks(words: Word[], difficulty: Difficulty): (Word | null)[] {
  const blankCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : words.length;
  const eligibleIndices = words
    .map((w, i) => (w.text.length > 2 ? i : -1))
    .filter(i => i !== -1);
  
  if (eligibleIndices.length === 0) return words as (Word | null)[];
  
  const blanks = new Set<number>();
  while (blanks.size < Math.min(blankCount, eligibleIndices.length)) {
    const randomIdx = Math.floor(Math.random() * eligibleIndices.length);
    blanks.add(eligibleIndices[randomIdx]);
  }
  
  return words.map((word, idx) => blanks.has(idx) ? null : word);
}

// Generate 4 word options (1 correct + 3 distractors)
function generateWordOptions(correctWords: string[], allWords: string[]): string[] {
  const uniqueCorrect = [...new Set(correctWords)];
  const correct = uniqueCorrect[Math.floor(Math.random() * uniqueCorrect.length)];
  
  const distractors = allWords
    .filter(w => w !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return options;
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
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedWords, setSelectedWords] = useState<(string | null)[]>([]);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [blanks, setBlanks] = useState<(Word | null)[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);

  const currentVerse = verses[currentVerseIdx];
  const audioUrl = `http://localhost:8000${song.audio_file}`;

  // Get all words from lyrics for distractors
  const allWords = useMemo(() => {
    return [...new Set(verses.flatMap(v => v.words.map(w => w.text)))];
  }, [verses]);

  // Update blanks and options when verse changes
  useEffect(() => {
    if (!currentVerse) return;
    
    const newBlanks = generateBlanks(currentVerse.words, difficulty);
    setBlanks(newBlanks);
    
    // Get correct words (blanks)
    const correctWords = newBlanks
      .filter((w): w is Word => w === null)
      .map(() => currentVerse.words.find(w => !newBlanks.includes(w))?.text || '')
      .filter(Boolean);
    
    setSelectedWords(new Array(newBlanks.filter(w => w === null).length).fill(null));
    setWordOptions(generateWordOptions(correctWords, allWords));
  }, [currentVerse, difficulty, allWords]);

  // Track current word for karaoke highlighting
  useEffect(() => {
    if (!currentVerse || !currentVerse.words.length) return;
    
    const currentTime = 0; // We'll get this from useAudio
    const wordIdx = currentVerse.words.findIndex(
      (w, idx) => 
        idx < currentVerse.words.length - 1
          ? currentTime >= w.timestamp && currentTime < currentVerse.words[idx + 1].timestamp
          : currentTime >= w.timestamp
    );
    
    setCurrentWordIdx(wordIdx >= 0 ? wordIdx : null);
  }, [currentVerse]);

  const handleVerseEnd = useCallback(() => {
    // Pause handled by useAudio, no additional action needed
  }, []);

  const { playVerse, replayCurrentVerse, currentTime, duration, seek, pause, play } = useAudio({
    audioSrc: audioUrl,
    verses,
    onVerseEnd: handleVerseEnd,
  });

  // Update current word based on audio time
  useEffect(() => {
    if (!currentVerse || !currentVerse.words.length) return;
    
    const wordIdx = currentVerse.words.findIndex(
      (w, idx) => {
        const nextWord = currentVerse.words[idx + 1];
        return currentTime >= w.timestamp && 
               (!nextWord || currentTime < nextWord.timestamp);
      }
    );
    
    setCurrentWordIdx(wordIdx >= 0 ? wordIdx : null);
  }, [currentTime, currentVerse]);

  // Load lyrics
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

  // Start first verse
  useEffect(() => {
    if (!loading && verses.length > 0 && currentVerseIdx === 0 && currentVerse) {
      const timeout = setTimeout(() => {
        playVerse(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [loading, verses.length, currentVerseIdx, currentVerse, playVerse]);

  // Handle word selection from options
  const handleSelectWord = useCallback((word: string) => {
    if (selectedWords.every(w => w !== null)) return;
    
    const newSelected = [...selectedWords];
    const emptyIdx = newSelected.findIndex(w => w === null);
    if (emptyIdx >= 0) {
      newSelected[emptyIdx] = word;
      setSelectedWords(newSelected);
      
      // Check if all blanks are filled
      if (newSelected.every(w => w !== null)) {
        // Check correctness
        const correctWords = blanks
          .map((b, idx) => b === null ? currentVerse.words[idx].text : null)
          .filter(Boolean);
        
        const isCorrect = newSelected.every((w, idx) => w === correctWords[idx]);
        
        if (isCorrect) {
          setScore(s => s + correctWords.length);
          
          // Resume audio to next verse
          setTimeout(() => {
            if (currentVerseIdx >= verses.length - 1) {
              setQuizComplete(true);
              saveProgress({ song_id: song.id, correct: score + correctWords.length, total: verses.length });
            } else {
              setCurrentVerseIdx(i => i + 1);
              playVerse(currentVerseIdx + 1);
            }
          }, 1000);
        } else {
          // Reset selected words on error
          setTimeout(() => {
            setSelectedWords(new Array(blanks.filter(w => w === null).length).fill(null));
          }, 1000);
        }
      }
    }
  }, [selectedWords, blanks, currentVerse, currentVerseIdx, verses.length, song.id, score, playVerse]);

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
          value={currentTime}
          onChange={handleSeek}
        />
      </div>

      <div className="quiz__verse">
        <div className="quiz__verse-text">
          {currentVerse?.words.map((word, idx) => {
            const isBlank = blanks[idx] === null;
            const isCurrent = idx === currentWordIdx;
            const isFilled = selectedWords.some(w => w === word.text);
            
            return (
              <span
                key={idx}
                className={`quiz__word ${
                  isCurrent ? 'quiz__word--current' : ''
                } ${
                  isBlank ? 'quiz__word--blank' : ''
                } ${
                  isFilled ? 'quiz__word--filled' : ''
                }`}
              >
                {isBlank && !isFilled ? '___' : word.text}
              </span>
            );
          })}
        </div>
      </div>

      <div className="quiz__options">
        {wordOptions.map((option, idx) => (
          <button
            key={idx}
            className="quiz__option"
            onClick={() => handleSelectWord(option)}
            disabled={selectedWords.every(w => w !== null)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="quiz__selected-words">
        <p>Palabras seleccionadas: {selectedWords.filter(w => w !== null).join(', ')}</p>
      </div>

      <div className="quiz__score-display">
        Score: {score}
      </div>
    </div>
  );
}