import { useState, useEffect, useCallback, useMemo } from "react";
import type { Song, Verse, Word, Difficulty } from "../types";
import { saveProgress, fetchLyrics } from "../api/songs";
import { useAudio } from "../hooks/useAudio";
import "./Quiz.css";

interface QuizProps {
  song: Song;
  difficulty: Difficulty;
  onBack: () => void;
}

function generateBlanks(
  words: Word[],
  difficulty: Difficulty,
): (Word | null)[] {
  const blankCount =
    difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : words.length;
  const eligibleIndices = words
    .map((w, i) => (w.text.length > 2 ? i : -1))
    .filter((i) => i !== -1);

  if (eligibleIndices.length === 0) return words as (Word | null)[];

  const blanks = new Set<number>();
  while (blanks.size < Math.min(blankCount, eligibleIndices.length)) {
    const randomIdx = Math.floor(Math.random() * eligibleIndices.length);
    blanks.add(eligibleIndices[randomIdx]);
  }

  return words.map((word, idx) => (blanks.has(idx) ? null : word));
}

function generateWordOptions(
  correctWord: string,
  allWords: string[],
): string[] {
  const distractors = allWords
    .filter((w) => w !== correctWord)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return [correctWord, ...distractors].sort(() => Math.random() - 0.5);
}

export function Quiz({ song, difficulty, onBack }: QuizProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizComplete, setQuizComplete] = useState(false);
  const [blanks, setBlanks] = useState<(Word | null)[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);
  const [verseCompleted, setVerseCompleted] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [triedOptions, setTriedOptions] = useState<Set<string>>(new Set());
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [filledWords, setFilledWords] = useState<Map<number, string>>(
    new Map(),
  );
  const [isReplaying, setIsReplaying] = useState(false);
  const [verseEnded, setVerseEnded] = useState(false);

  const currentVerse = verses[currentVerseIdx];
  const audioUrl = `http://localhost:8000${song.audio_file}`;

  const allWords = useMemo(() => {
    return [...new Set(verses.flatMap((v) => v.words.map((w) => w.text)))];
  }, [verses]);

  const blankPositions = useMemo(() => {
    if (!currentVerse || blanks.length === 0) return [];
    return blanks
      .map((b, idx) => (b === null ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [currentVerse, blanks]);

  useEffect(() => {
    if (!currentVerse) return;

    const newBlanks = generateBlanks(currentVerse.words, difficulty);
    setBlanks(newBlanks);
    setFilledWords(new Map());
    setCurrentBlankIdx(0);
    setVerseEnded(false);
    setIsReplaying(false);
  }, [currentVerse, difficulty]);

  useEffect(() => {
    if (!currentVerse || blankPositions.length === 0) return;

    const blankPos = blankPositions[currentBlankIdx];
    if (blankPos === undefined || !currentVerse.words[blankPos]) return;

    const correctWord = currentVerse.words[blankPos].text;
    setWordOptions(generateWordOptions(correctWord, allWords));
    setTriedOptions(new Set());
    setWrongOption(null);
  }, [currentBlankIdx, blankPositions, currentVerse, allWords]);

  useEffect(() => {
    async function loadLyrics() {
      try {
        const lyrics = await fetchLyrics(song.id);
        setVerses(lyrics);
      } catch (err) {
        console.error("Error loading lyrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLyrics();
  }, [song.id]);

  const {
    playVerse,
    replayCurrentVerse,
    currentTime,
    duration,
    seek,
    pause,
    isReady,
    vocalActivity,
  } = useAudio({
    audioSrc: audioUrl,
    verses,
    onVerseEnd: () => {},
    autoPauseAtVerseEnd: false,
  });

  useEffect(() => {
    if (!currentVerse || !currentVerse.words.length) return;

    const wordIdx = currentVerse.words.findIndex((w, idx) => {
      const nextWord = currentVerse.words[idx + 1];
      return (
        currentTime >= w.timestamp &&
        (!nextWord || currentTime < nextWord.timestamp)
      );
    });

    setCurrentWordIdx(wordIdx >= 0 ? wordIdx : null);
  }, [currentTime, currentVerse, vocalActivity.isActive]);

  useEffect(() => {
    if (!currentVerse || verseCompleted || blankPositions.length === 0) return;

    const verseEndTime = currentVerse.timestamp + currentVerse.duration;
    const remainingBlanks = blankPositions.filter(
      (_, idx) =>
        idx >= currentBlankIdx || !filledWords.has(blankPositions[idx]),
    );
    if (
      currentTime >= verseEndTime &&
      remainingBlanks.length > 0 &&
      !verseEnded
    ) {
      setVerseEnded(false);
      setIsReplaying(true);
      replayCurrentVerse();
    }
  }, [
    currentTime,
    currentVerse,
    verseCompleted,
    blankPositions,
    currentBlankIdx,
    filledWords,
    verseEnded,
    replayCurrentVerse,
  ]);

  useEffect(() => {
    if (!verseCompleted || currentVerseIdx >= verses.length - 1) return;

    const nextVerse = verses[currentVerseIdx + 1];
    if (!nextVerse) return;

    const isInNextVerseTimestamp = currentTime >= nextVerse.timestamp;
    const hasVocalActivity =
      vocalActivity.isActive && vocalActivity.energy > 0.015;
    const currentVerseEndTime = currentVerse
      ? currentVerse.timestamp + currentVerse.duration
      : 0;
    const pastCurrentVerse = currentTime > currentVerseEndTime + 0.5;

    if (isInNextVerseTimestamp && (hasVocalActivity || pastCurrentVerse)) {
      pause();
      const nextVerseIdx = currentVerseIdx + 1;
      setVerseCompleted(false);
      setSuccessAnimation(false);
      setCurrentVerseIdx(nextVerseIdx);
      setTimeout(() => {
        playVerse(nextVerseIdx);
      }, 100);
    }
  }, [
    verseCompleted,
    currentVerseIdx,
    currentTime,
    currentVerse,
    vocalActivity,
    verses,
    pause,
    playVerse,
  ]);

  useEffect(() => {
    if (
      !loading &&
      verses.length > 0 &&
      currentVerseIdx === 0 &&
      currentVerse &&
      isReady
    ) {
      const timeout = setTimeout(() => {
        playVerse(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [
    loading,
    verses.length,
    currentVerseIdx,
    currentVerse,
    isReady,
    playVerse,
  ]);

  const handleSelectWord = useCallback(
    (word: string) => {
      if (verseCompleted || blankPositions.length === 0) return;

      const blankPos = blankPositions[currentBlankIdx];
      if (blankPos === undefined || !currentVerse.words[blankPos]) return;

      const correctWord = currentVerse.words[blankPos].text;

      if (word === correctWord) {
        setScore((s) => s + 1);
        setSuccessAnimation(true);
        setTimeout(() => setSuccessAnimation(false), 500);

        const newFilledWords = new Map(filledWords);
        newFilledWords.set(blankPos, word);
        setFilledWords(newFilledWords);

        const nextBlankIdx = currentBlankIdx + 1;

        if (nextBlankIdx >= blankPositions.length) {
          setVerseCompleted(true);
          setTriedOptions(new Set());
          setWrongOption(null);

          if (currentVerseIdx >= verses.length - 1) {
            setTimeout(() => {
              setQuizComplete(true);
              saveProgress({
                song_id: song.id,
                correct: score + blankPositions.length,
                total: verses.length,
              });
            }, 2000);
          }
        } else {
          setCurrentBlankIdx(nextBlankIdx);
        }
      } else {
        setWrongOption(word);
        setTriedOptions((prev) => new Set(prev).add(word));
        setTimeout(() => {
          setWrongOption(null);
        }, 1000);
      }
    },
    [
      verseCompleted,
      blankPositions,
      currentBlankIdx,
      currentVerse,
      filledWords,
      currentVerseIdx,
      verses.length,
      song.id,
      score,
    ],
  );

  useEffect(() => {
    if (quizComplete) {
      saveProgress({ song_id: song.id, correct: score, total: verses.length });
    }
  }, [quizComplete, song.id, score, verses.length]);

  useEffect(() => {
    setVerseCompleted(false);
    setSuccessAnimation(false);
    setTriedOptions(new Set());
    setWrongOption(null);
    setCurrentBlankIdx(0);
    setFilledWords(new Map());
    setVerseEnded(false);
    setIsReplaying(false);
  }, [currentVerseIdx]);

  const handleReplay = useCallback(() => {
    setIsReplaying(true);
    setVerseEnded(false);
    replayCurrentVerse();
  }, [replayCurrentVerse]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      seek(time);
    },
    [seek],
  );

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
          <p className="quiz__score">
            Score: {score}/
            {verses.length *
              (difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 10)}
          </p>
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
        <div
          className={`quiz__vocal-indicator ${vocalActivity.isActive ? "quiz__vocal-indicator--active" : ""}`}
        >
          <div
            className="quiz__vocal-bar"
            style={{ height: `${vocalActivity.energy * 100}%` }}
          ></div>
        </div>
      </div>

      <div
        className={`quiz__verse ${successAnimation ? "quiz__verse--success" : ""} ${isReplaying ? "quiz__verse--replaying" : ""}`}
      >
        <div className="quiz__verse-text">
          {currentVerse?.words.map((word, idx) => {
            const isBlank = blanks[idx] === null;
            const isCurrent = idx === currentWordIdx;
            const filledWord = filledWords.get(idx);

            return (
              <span
                key={idx}
                className={`quiz__word ${
                  isCurrent ? "quiz__word--current" : ""
                } ${isBlank ? "quiz__word--blank" : ""} ${
                  filledWord ? "quiz__word--filled" : ""
                }`}
              >
                {isBlank && !filledWord ? "___" : filledWord || word.text}
              </span>
            );
          })}
        </div>
      </div>

      <div className="quiz__options">
        {wordOptions.map((option, idx) => (
          <button
            key={idx}
            className={`quiz__option ${
              wrongOption === option ? "quiz__option--wrong" : ""
            } ${triedOptions.has(option) ? "quiz__option--tried" : ""}`}
            onClick={() => handleSelectWord(option)}
            disabled={verseCompleted}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="quiz__selected-words">
        <p>
          Blanks completados: {filledWords.size}/{blankPositions.length}
        </p>
      </div>

      <div className="quiz__score-display">Score: {score}</div>
    </div>
  );
}
