# Arquitectura Syncopate

## Stack Tecnológico

| Capa | Tecnología | Puerto |
|------|------------|--------|
| Backend | FastAPI + uvicorn | 8000 |
| Frontend | React 19 + Vite + TypeScript | 5173 |
| Database | SQLite (via SQLAlchemy) | local |
| Audio | Howler.js | cliente |

## Estructura de Proyecto

```
/syncopate
├── backend/          # FastAPI
│   ├── main.py       # API + endpoints
│   └── database.db   # SQLite
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── api/
│   └── package.json
├── media/            # Archivos MP3 + LRC
└── docs/             # Documentación
```

## Estructura de Datos

### Canción (Song)
```typescript
interface Song {
  id: string;           // identificador único
  title: string;       // nombre de la canción
  audio_file: string;   // path "/media/filename.mp3"
  has_lyrics: boolean; // indica si tiene LRC
}
```

### Verso (del LRC parseado)
```typescript
interface Verse {
  timestamp: number;  // tiempo en segundos
  text: string;      // texto original "How long before I get in?"
}
```

### Estado del Quiz
```typescript
interface QuizState {
  song: Song;
  difficulty: 'easy' | 'medium' | 'hard';
  currentVerseIndex: number;
  options: string[];      // 4 opciones
  correctOption: number;  // índice de opción correcta
  score: number;
  attempts: number;
}
```

### Progreso del Usuario
```typescript
interface UserProgress {
  song_id: string;
  correct: number;   // respuestas correctas
  total: number;     // total de versos
  completed_at: string;  // timestamp
}
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/songs | Lista todas las canciones |
| GET | /api/songs/{id} | Detalle de canción |
| GET | /api/songs/{id}/lyrics | Lyrics + timestamps |
| POST | /api/progress | Guardar progreso |

## Flujo de Audio

```
Backend (serve static)
      │
      ▼
frontend/src/audio/Player.tsx
      │
      ▼
   Howler.js
      │
      ▼
  Web Audio API / HTML5 Audio
```

## Validaciones

1. **Upload**: Solo .mp3, .wav, .mp4
2. **LRC**: Mismo nombre que audio + extensión .lrc
3. **Blanqueo**: Según dificultad seleccionada