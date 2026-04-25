import { useState, useCallback } from 'react';
import type { Song, Difficulty } from './types';
import { Providers } from './components/Providers';
import { Home } from './components/Home';
import { Quiz } from './components/Quiz';
import './App.css';

function App() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const handleStartQuiz = useCallback((song: Song, diff: Difficulty) => {
    setCurrentSong(song);
    setDifficulty(diff);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentSong(null);
  }, []);

  if (currentSong) {
    return (
      <Providers>
        <Quiz 
          song={currentSong} 
          difficulty={difficulty} 
          onBack={handleBack} 
        />
      </Providers>
    );
  }

  return (
    <Providers>
      <Home onStartQuiz={handleStartQuiz} />
    </Providers>
  );
}

export default App;