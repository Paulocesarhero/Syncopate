import { useState, useCallback } from "react";
import type { Song, Difficulty } from "../types";
import { useAppStore } from "../stores/appStore";
import { uploadSong } from "../api/songs";
import { DropZone } from "./DropZone";
import { SongList } from "./SongList";
import { DifficultySelector } from "./DifficultySelector";
import { Loading, SongCardSkeleton } from "./Loading";
import "./Home.css";

interface HomeProps {
  onStartQuiz: (song: Song, difficulty: Difficulty) => void;
}

export function Home({ onStartQuiz }: HomeProps) {
  const {
    songs,
    difficulty,
    loading,
    error,
    setDifficulty,
    addSong,
    showToast,
  } = useAppStore();
  const [uploading, setUploading] = useState(false);

  const handleFilesDropped = useCallback(
    async (files: { audio: File; lrc?: File }) => {
      setUploading(true);
      try {
        const song = await uploadSong(files.audio, files.lrc);
        addSong(song);
        showToast("Canción añadida correctamente", "success");
      } catch (_err) {
        showToast("Error al subir la canción", "error");
      } finally {
        setUploading(false);
      }
    },
    [addSong, showToast],
  );

  const handleSelectSong = useCallback(
    (song: Song) => {
      if (!song.has_lyrics) {
        showToast("Esta canción no tiene letras .lrc", "warning");
        return;
      }
      onStartQuiz(song, difficulty);
    },
    [difficulty, onStartQuiz, showToast],
  );

  if (error) {
    return (
      <div className="home">
        <header className="home__header">
          <h1 className="home__title">Syncopate</h1>
          <p className="home__subtitle">Aprende inglés con música</p>
        </header>
        <main className="home__main">
          <div className="home__error">
            <p>Error: {error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="home__header">
        <h1 className="home__title">Syncopate</h1>
        <p className="home__subtitle">Aprende inglés con música</p>
      </header>

      <main className="home__main">
        <DropZone onFilesDropped={handleFilesDropped} />

        {uploading && (
          <div className="home__uploading">
            <Loading size="sm" message="Subiendo..." />
          </div>
        )}

        <DifficultySelector difficulty={difficulty} onChange={setDifficulty} />

        <div className="home__songs">
          {loading ? (
            <div className="home__loading">
              <Loading size="md" message="Cargando canciones..." />
              {[1, 2, 3].map((i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <SongList songs={songs} onSelectSong={handleSelectSong} />
          )}
        </div>
      </main>
    </div>
  );
}
