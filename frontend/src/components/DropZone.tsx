import { useState, useCallback, memo, type DragEvent } from "react";
import "./DropZone.css";

interface DropZoneProps {
  onFilesDropped: (files: { audio: File; lrc?: File }) => void;
}

export const DropZone = memo(function DropZone({
  onFilesDropped,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const files = Array.from(e.dataTransfer.files);
      const audioExtensions = [".mp3", ".wav", ".mp4"];
      const audioFile = files.find((f) =>
        audioExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
      );
      const lrcFile = files.find((f) => f.name.toLowerCase().endsWith(".lrc"));

      if (!audioFile) {
        setError("Arrastra un archivo de audio (MP3, WAV, MP4)");
        return;
      }

      if (!lrcFile) {
        setError("Arrastra también el archivo .lrc con el mismo nombre");
        return;
      }

      const audioName = audioFile.name.replace(/\.[^/.]+$/, "");
      const lrcName = lrcFile.name.replace(/\.[^/.]+$/, "");

      if (audioName !== lrcName) {
        setError("El archivo LRC debe tener el mismo nombre que el audio");
        return;
      }

      onFilesDropped({ audio: audioFile, lrc: lrcFile });
    },
    [onFilesDropped],
  );

  return (
    <div
      className={`drop-zone ${isDragging ? "drop-zone--dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-zone__content">
        <svg
          className="drop-zone__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="drop-zone__text">
          {isDragging ? "Suelta aquí" : "Arrastra MP3 + LRC aquí"}
        </p>
        <p className="drop-zone__hint">
          Ambos archivos deben tener el mismo nombre
        </p>
      </div>
      {error && <p className="drop-zone__error">{error}</p>}
    </div>
  );
});
