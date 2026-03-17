"use client";

export const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
];

interface ColorPickerInlineProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerInline({ value, onChange }: ColorPickerInlineProps) {
  return (
    <div className="flex gap-1.5">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`h-5 w-5 rounded-full border-2 transition-transform ${
            value === c
              ? "border-foreground scale-110"
              : "border-transparent hover:scale-110"
          }`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}
