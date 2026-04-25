import { memo } from 'react';
import './Loading.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const Loading = memo(function Loading({ size = 'md', message }: LoadingProps) {
  return (
    <div className={`loading loading--${size}`}>
      <div className="loading__spinner">
        <div className="loading__spinner-ring" />
      </div>
      {message && <p className="loading__message">{message}</p>}
    </div>
  );
});

export const Skeleton = memo(function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} />;
});

export const SongCardSkeleton = memo(function SongCardSkeleton() {
  return (
    <div className="song-card-skeleton">
      <div className="song-card-skeleton__icon">
        <Skeleton />
      </div>
      <div className="song-card-skeleton__info">
        <Skeleton className="song-card-skeleton__title" />
        <Skeleton className="song-card-skeleton__badge" />
      </div>
      <Skeleton className="song-card-skeleton__button" />
    </div>
  );
});