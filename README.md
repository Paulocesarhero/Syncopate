# Syncopate



https://github.com/user-attachments/assets/be371ab2-784a-4c0e-91cb-686474c2eb8c

🎵 Demo Music: Wade by Josh Woodward. Free download: [https://www.joshwoodward.com/](https://www.joshwoodward.com/) Shout out to the people who create for the love of art.


A local web application for learning English through songs with synchronized lyrics. Practice listening and fill in the blanks as you follow along with your favorite tracks.

## Features

- **Drag & Drop Upload** — Add songs by dropping MP3/WAV files with matching `.lrc` lyric files
- **Real-time Lyrics Sync** — Beat-synchronized karaoke-style display using audio analysis
- **Fill-in-the-blank Quizzes** — Test your listening comprehension with contextual word blanks
- **Three Difficulty Levels** — Easy (1 blank), Medium (2 blanks), Hard (full verse)
- **Score Tracking** — Track your progress per song with local storage

## Getting Started

### Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

### Installation

```bash
# Clone the repository
git clone https://github.com/anomalyco/Syncopate.git
cd Syncopate

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Running the App

```bash
# Terminal 1 — Backend (port 8000)
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

## Adding Songs

Place audio and lyrics files in the `media/` folder:

```
media/
├── song-name.mp3
└── song-name.lrc
```

The `.lrc` format uses timestamps:

```
[mm:ss.xx] lyrical line
[00:19.12] How long before I get in?
[00:21.95] Before it starts, before I begin?
```

## Project Structure

```
/syncopate
├── backend/          # FastAPI (port 8000)
├── frontend/         # React + Vite + TypeScript (port 5173)
├── media/            # Audio files (.mp3, .wav) + lyrics (.lrc)
└── docs/             # Architecture & API docs
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + uvicorn |
| Frontend | React 19 + Vite + TypeScript |
| State | Zustand |
| Audio | Howler.js |
| Database | SQLite (local) |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/songs | List all available songs |
| GET | /api/songs/{id} | Get song details |
| GET | /api/songs/{id}/lyrics | Get parsed lyrics with timestamps |
| POST | /api/progress | Save user progress |
| POST | /api/upload | Upload new song + lyrics |
| DELETE | /api/songs/{id} | Delete a song |

## How It Works

1. **Song loads** — Backend scans `/media` for audio + LRC pairs
2. **Quiz starts** — Frontend parses lyrics and displays the current verse
3. **Audio plays** — Web Audio API analyzes frequencies for real-time sync
4. **Blanks appear** — Words are hidden based on chosen difficulty
5. **User answers** — Select the correct word from 4 options
6. **Score updates** — Progress saves locally when the song ends

🚀 Future Roadmap
🐳 Infrastructure & Deployment

    Dockerization for NAS Environments:

        Containerize the application using Docker and Docker Compose.

        Optimize images for low-resource environments (e.g., Synology/QNAP NAS) using lightweight Alpine-based images.

        Implement persistent volume mapping for music libraries and configuration files.

🎵 Core Features

    Song Management (CRUD):

        Develop a full CRUD (Create, Read, Update, Delete) interface to manage the localized song database.

        Integration with FastAPI (backend) and React (frontend) to handle metadata and file paths.

    LRC File Editor:

        Build an interactive, time-synced editor to create and modify .lrc (Lyric) files.

        Real-time preview to sync lyrics perfectly with the audio playback.

## License

This project is for educational purposes. See [LICENSE](./LICENSE) for details.
