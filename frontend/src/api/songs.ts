import type { Song, Verse, LyricsResponse, SongsResponse, UserProgress } from '../types';

const API_BASE = 'http://localhost:8000';

export async function fetchSongs(): Promise<Song[]> {
  const res = await fetch(`${API_BASE}/api/songs`);
  const data: SongsResponse = await res.json();
  return data.songs;
}

export async function fetchSong(id: string): Promise<Song> {
  const res = await fetch(`${API_BASE}/api/songs/${id}`);
  if (!res.ok) throw new Error('Song not found');
  return res.json();
}

export async function fetchLyrics(id: string): Promise<Verse[]> {
  const res = await fetch(`${API_BASE}/api/songs/${id}/lyrics`);
  if (!res.ok) throw new Error('Lyrics not found');
  const data: LyricsResponse = await res.json();
  return data.lyrics;
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  await fetch(`${API_BASE}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  });
}

export async function uploadSong(audioFile: File, lrcFile?: File): Promise<Song> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  if (lrcFile) {
    formData.append('lrc', lrcFile);
  }

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Upload failed');
  }

  const data = await res.json();
  return data.song;
}