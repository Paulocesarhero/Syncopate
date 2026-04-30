import { memo } from "react";
import type { Song } from "../types";
import { SongCard } from "./SongCard";
import "./SongList.css";

interface SongListProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

export const SongList = memo(function SongList({
  songs,
  onSelectSong,
}: SongListProps) {
  if (!songs || songs.length === 0) {
    return null;
  }

  return (
    <div className="song-list">
      <h2 className="song-list__title">Tus Canciones</h2>
      <div className="song-list__grid">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onSelect={onSelectSong} />
        ))}
      </div>
    </div>
  );
});
