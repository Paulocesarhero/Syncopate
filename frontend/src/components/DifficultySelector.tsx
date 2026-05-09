import { memo } from "react";
import type { Difficulty } from "../types";
import "./DifficultySelector.css";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const options: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", label: "Fácil", description: "1 palabra en blanco" },
  { value: "medium", label: "Medio", description: "2 palabras en blanco" },
  {
    value: "hard",
    label: "Difícil",
    description: "verso completo con algunas pistas",
  },
];

export const DifficultySelector = memo(function DifficultySelector({
  difficulty,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="difficulty-selector">
      <label className="difficulty-selector__label">Dificultad</label>
      <div className="difficulty-selector__options">
        {options.map((option) => (
          <button
            key={option.value}
            className={`difficulty-selector__option ${
              difficulty === option.value
                ? "difficulty-selector__option--active"
                : ""
            }`}
            onClick={() => onChange(option.value)}
          >
            <span className="difficulty-selector__option-label">
              {option.label}
            </span>
            <span className="difficulty-selector__option-desc">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});
