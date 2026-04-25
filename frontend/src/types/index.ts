export interface Song {
  id: string;
  title: string;
  audio_file: string;
  has_lyrics: boolean;
  length: number;
}

export interface Word {
  text: string;
  timestamp: number;
}

export interface Verse {
  timestamp: number;
  text: string;
  duration: number;
  words: Word[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizState {
  song: Song;
  difficulty: Difficulty;
  currentVerseIndex: number;
  verses: Verse[];
  options: string[];
  correctOption: number;
  score: number;
  isPlaying: boolean;
  showResult: boolean;
  lastAnswerCorrect: boolean;
}

export interface UserProgress {
  song_id: string;
  correct: number;
  total: number;
}

export interface SongsResponse {
  songs: Song[];
}

export interface LyricsResponse {
  lyrics: Verse[];
}

export interface ProgressResponse {
  status: string;
  song_id: string;
}