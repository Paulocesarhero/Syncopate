import { memo } from 'react';
import type { Song } from '../types';
import './SongCard.css';

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
  onClick?: () => void;
}

export const SongCard = memo(function SongCard({ song, onSelect, onClick }: SongCardProps) {
  return (
    <div className="song-card" onClick={onClick}>
      <div className="song-card__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div className="song-card__info">
        <h3 className="song-card__title">{song.title}</h3>
        <span className="song-card__status">
          {song.has_lyrics ? (
            <span className="song-card__badge song-card__badge--ready">Con letras</span>
          ) : (
            <span className="song-card__badge song-card__badge--no-lyrics">Sin letras</span>
          )}
        </span>
      </div>
      <button 
        className="song-card__play"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(song);
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </button>
    </div>
  );
});