# Syncopate - AGENTS.md

## Estructura del Proyecto

```
/syncopate
├── backend/          # FastAPI (puerto 8000)
├── frontend/         # React + Vite (puerto 5173)
├── media/            # Archivos de Audio (MP3/WAV) y letras (.lrc)
└── AGENTS.md
```

## Comandos de Desarrollo

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## API Contract (FastAPI → React)

- `GET /api/songs` - Lista todas las canciones disponibles
- `GET /api/songs/{id}` - Detalle de canción individual
- `GET /api/songs/{id}/lyrics` - 获取歌词和timestamps
- `POST /api/progress` - 保存进度

## Gestión de Contenido

- Media: colocar archivos en `/media`
- Formatos soportados: MP3, WAV, MP4 + .lrc (mismo nombre)
- El servidor sirve archivos estáticos desde `/media`

## Notas Técnicas

- Zero latency: procesamiento en cliente para quiz instantáneo
- SQLite para historial de usuario (en backend/)
- CORS permitir http://localhost:5173

## Tech Stack

- Backend: FastAPI + uvicorn
- Frontend: React + Vite + TypeScript
- Database: SQLite (via SQLAlchemy)