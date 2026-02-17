'use client';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftEmoji?: string;
  rightEmoji?: string;
  color?: string;
}

export function SliderInput({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  leftEmoji = '',
  rightEmoji = '',
  color = '#22c55e',
}: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-white/70">{label}</label>
        <span
          className="text-[20px] font-bold tabular-nums"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {leftEmoji && <span className="text-lg">{leftEmoji}</span>}
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
            }}
          />
        </div>
        {rightEmoji && <span className="text-lg">{rightEmoji}</span>}
      </div>
    </div>
  );
}
