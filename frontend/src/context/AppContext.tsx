import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Song, Difficulty, UserProgress } from '../types';
import { fetchSongs, saveProgress as saveProgressApi } from '../api/songs';

interface AppState {
  songs: Song[];
  difficulty: Difficulty;
  userProgress: Map<string, UserProgress>;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_SONGS'; payload: Song[] }
  | { type: 'ADD_SONG'; payload: Song }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_PROGRESS'; payload: UserProgress }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface AppContextValue extends AppState {
  setDifficulty: (diff: Difficulty) => void;
  addSong: (song: Song) => void;
  updateProgress: (progress: UserProgress) => void;
  refreshSongs: () => Promise<void>;
}

const initialState: AppState = {
  songs: [],
  difficulty: 'easy',
  userProgress: new Map(),
  loading: true,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SONGS':
      return { ...state, songs: action.payload };
    case 'ADD_SONG':
      return { ...state, songs: [...state.songs, action.payload] };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_PROGRESS': {
      const newProgress = new Map(state.userProgress);
      newProgress.set(action.payload.song_id, action.payload);
      return { ...state, userProgress: newProgress };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshSongs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const songs = await fetchSongs();
      dispatch({ type: 'SET_SONGS', payload: songs });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
    localStorage.setItem('syncopate_difficulty', difficulty);
  }, []);

  const addSong = useCallback((song: Song) => {
    dispatch({ type: 'ADD_SONG', payload: song });
  }, []);

  const updateProgress = useCallback(async (progress: UserProgress) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress });
    try {
      await saveProgressApi(progress);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  }, []);

  useEffect(() => {
    const savedDifficulty = localStorage.getItem('syncopate_difficulty') as Difficulty;
    if (savedDifficulty) {
      dispatch({ type: 'SET_DIFFICULTY', payload: savedDifficulty });
    }
    refreshSongs();
  }, [refreshSongs]);

  const value: AppContextValue = {
    ...state,
    setDifficulty,
    addSong,
    updateProgress,
    refreshSongs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}