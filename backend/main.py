from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import re
import shutil

app = FastAPI()

origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)

if os.path.exists(MEDIA_DIR):
    app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

class ProgressUpdate(BaseModel):
    song_id: str
    correct: int
    total: int

class Song(BaseModel):
    id: str
    title: str
    audio_file: str
    has_lyrics: bool

class Verse(BaseModel):
    timestamp: float
    text: str

def parse_lrc(filepath: str) -> List[dict]:
    lines = []
    pattern = re.compile(r'\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)')
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                match = pattern.match(line.strip())
                if match:
                    minutes, seconds, ms, text = match.groups()
                    ms = ms.ljust(3, '0') if len(ms) == 2 else ms
                    timestamp = int(minutes) * 60 + int(seconds) + int(ms) / 1000
                    lines.append({
                        "timestamp": round(timestamp, 2),
                        "text": text.strip()
                    })
    except FileNotFoundError:
        return []
    
    # Calculate line durations and split into words with timestamps
    lyrics = []
    for i, line in enumerate(lines):
        # Duration: time until next line or default 3s
        duration = 3.0
        if i < len(lines) - 1:
            duration = round(lines[i+1]["timestamp"] - line["timestamp"], 2)
        
        # Split line into words
        words = [w.strip() for w in line["text"].split(' ') if w.strip()]
        word_count = len(words)
        word_list = []
        
        if word_count > 0:
            time_per_word = duration / word_count
            for idx, word in enumerate(words):
                word_timestamp = round(line["timestamp"] + (idx * time_per_word), 2)
                word_list.append({
                    "text": word,
                    "timestamp": word_timestamp
                })
        
        lyrics.append({
            "timestamp": line["timestamp"],
            "text": line["text"],
            "duration": duration,
            "words": word_list
        })
    
    return lyrics

def get_songs():
    songs = []
    if not os.path.exists(MEDIA_DIR):
        return songs
    for fname in os.listdir(MEDIA_DIR):
        name, ext = os.path.splitext(fname)
        if ext.lower() in ['.mp3', '.wav', '.mp4']:
            lrc_path = os.path.join(MEDIA_DIR, f"{name}.lrc")
            songs.append({
                "id": name,
                "title": name,
                "audio_file": f"/media/{fname}",
                "has_lyrics": os.path.exists(lrc_path)
            })
    return songs

@app.get("/api/songs")
def list_songs():
    return {"songs": get_songs()}

@app.get("/api/songs/{song_id}")
def get_song(song_id: str):
    songs = get_songs()
    for song in songs:
        if song["id"] == song_id:
            return song
    raise HTTPException(status_code=404, detail="Song not found")

@app.get("/api/songs/{song_id}/lyrics")
def get_lyrics(song_id: str):
    lrc_path = os.path.join(MEDIA_DIR, f"{song_id}.lrc")
    if not os.path.exists(lrc_path):
        raise HTTPException(status_code=404, detail="Lyrics not found")
    return {"lyrics": parse_lrc(lrc_path)}

@app.post("/api/progress")
def save_progress(progress: ProgressUpdate):
    return {"status": "ok", "song_id": progress.song_id}

@app.post("/api/upload")
async def upload_song(
    audio: UploadFile = File(...),
    lrc: Optional[UploadFile] = File(None)
):
    audio_ext = os.path.splitext(audio.filename)[1].lower()
    if audio_ext not in ['.mp3', '.wav', '.mp4']:
        raise HTTPException(status_code=400, detail="Invalid audio format")
    
    audio_name = os.path.splitext(audio.filename)[0]
    audio_path = os.path.join(MEDIA_DIR, audio.filename)
    
    with open(audio_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)
    
    lrc_path = None
    if lrc:
        lrc_ext = os.path.splitext(lrc.filename)[1].lower()
        if lrc_ext != '.lrc':
            raise HTTPException(status_code=400, detail="Invalid LRC format")
        
        lrc_name = os.path.splitext(lrc.filename)[0]
        if lrc_name != audio_name:
            raise HTTPException(status_code=400, detail="LRC filename must match audio filename")
        
        lrc_path = os.path.join(MEDIA_DIR, f"{lrc_name}.lrc")
        with open(lrc_path, "wb") as f:
            shutil.copyfileobj(lrc.file, f)
    
    return {
        "status": "ok",
        "song": {
            "id": audio_name,
            "title": audio_name,
            "audio_file": f"/media/{audio.filename}",
            "has_lyrics": lrc_path is not None and os.path.exists(lrc_path)
        }
    }

@app.delete("/api/songs/{song_id}")
def delete_song(song_id: str):
    songs = get_songs()
    song_exists = any(s["id"] == song_id for s in songs)
    
    if not song_exists:
        raise HTTPException(status_code=404, detail="Song not found")
    
    for ext in ['.mp3', '.wav', '.mp4']:
        audio_path = os.path.join(MEDIA_DIR, f"{song_id}{ext}")
        if os.path.exists(audio_path):
            os.remove(audio_path)
    
    lrc_path = os.path.join(MEDIA_DIR, f"{song_id}.lrc")
    if os.path.exists(lrc_path):
        os.remove(lrc_path)
    
    return {"status": "deleted", "song_id": song_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)