import { create } from "zustand";
import type { Song, Difficulty, UserProgress } from "../types";
import { fetchSongs, saveProgress as saveProgressApi } from "../api/songs";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AppState {
  songs: Song[];
  difficulty: Difficulty;
  userProgress: Map<string, UserProgress>;
  loading: boolean;
  error: string | null;
  toasts: Toast[];

  setDifficulty: (difficulty: Difficulty) => void;
  addSong: (song: Song) => void;
  removeSong: (songId: string) => void;
  updateProgress: (progress: UserProgress) => Promise<void>;
  refreshSongs: () => Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  songs: [],
  difficulty: "easy",
  userProgress: new Map(),
  loading: true,
  error: null,
  toasts: [],

  setDifficulty: (difficulty) => {
    localStorage.setItem("syncopate_difficulty", difficulty);
    set({ difficulty });
  },

  addSong: (song) => {
    set((state) => ({ songs: [...state.songs, song] }));
  },

  removeSong: (songId: string) => {
    set((state) => ({ songs: state.songs.filter((s) => s.id !== songId) }));
  },

  updateProgress: async (progress) => {
    set((state) => {
      const newProgress = new Map(state.userProgress);
      newProgress.set(progress.song_id, progress);
      return { userProgress: newProgress };
    });
    try {
      await saveProgressApi(progress);
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  },

  refreshSongs: async () => {
    set({ loading: true, error: null });
    try {
      const songs = await fetchSongs();
      set({ songs, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  showToast: (message, type = "info") => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      get().hideToast(id);
    }, 3000);
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

if (typeof window !== "undefined") {
  const savedDifficulty = localStorage.getItem(
    "syncopate_difficulty",
  ) as Difficulty;
  if (savedDifficulty) {
    useAppStore.getState().setDifficulty(savedDifficulty);
  }
  useAppStore.getState().refreshSongs();
}
