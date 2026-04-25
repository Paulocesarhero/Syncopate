# API Contract

Base URL: `http://localhost:8000`

## Endpoints

### GET /api/songs

Lista todas las canciones disponibles en `/media`.

**Response:**
```json
{
  "songs": [
    {
      "id": "song-name",
      "title": "Song Name",
      "audio_file": "/media/song-name.mp3",
      "has_lyrics": true
    }
  ]
}
```

---

### GET /api/songs/{song_id}

Obtiene detalle de una canción específica.

**Response:**
```json
{
  "id": "song-name",
  "title": "Song Name",
  "audio_file": "/media/song-name.mp3",
  "has_lyrics": true
}
```

**Error 404:**
```json
{
  "detail": "Song not found"
}
```

---

### GET /api/songs/{song_id}/lyrics

Obtiene las letras parseadas con timestamps.

**Response:**
```json
{
  "lyrics": [
    {
      "timestamp": 19.129,
      "text": "How long before I get in?"
    },
    {
      "timestamp": 21.953,
      "text": "Before it starts, before I begin?"
    }
  ]
}
```

**Error 404:**
```json
{
  "detail": "Lyrics not found"
}
```

---

### POST /api/progress

Guarda el progreso del usuario en una canción.

**Request:**
```json
{
  "song_id": "song-name",
  "correct": 5,
  "total": 10
}
```

**Response:**
```json
{
  "status": "ok",
  "song_id": "song-name"
}
```

---

## Archivos Estáticos

Los archivos de audio se sirven desde `/media`:

- `/media/song-name.mp3`
- `/media/song-name.wav`
- `/media/song-name.mp4`
- `/media/song-name.lrc`

---

## CORS

El backend permite requests desde:
- `http://localhost:5173` (frontend Vite)