'use client'

interface RatingSliderProps {
  value: number           // 0–100
  onChange: (v: number) => void
  disabled?: boolean
}

function getRatingColor(v: number) {
  if (v === 0) return 'var(--silver-ghost)'
  if (v < 40)  return '#e74c3c'
  if (v < 60)  return '#d4a853'
  if (v < 80)  return '#f0c060'
  return '#27ae60'
}

function getRatingLabel(v: number) {
  if (v === 0)   return 'Not rated'
  if (v <= 20)   return 'Unwatchable'
  if (v <= 40)   return 'Disappointing'
  if (v <= 55)   return 'Decent'
  if (v <= 70)   return 'Good'
  if (v <= 85)   return 'Great'
  if (v <= 95)   return 'Excellent'
  return 'Masterpiece'
}

export default function RatingSlider({ value, onChange, disabled }: RatingSliderProps) {
  const color = getRatingColor(value)
  const pct = value  // 0–100 maps directly to percent

  return (
    <div className="space-y-3">
      {/* Score display */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-bold transition-all" style={{ color }}>
            {value}
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--silver-ghost)' }}>/100</span>
        </div>
        <span className="text-xs font-mono transition-all" style={{ color }}>
          {getRatingLabel(value)}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background: `linear-gradient(90deg, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
            // Thumb styles injected via global CSS class below
          }}
        />
      </div>

      {/* Tick marks: 10 20 30 … 100 */}
      <div className="flex justify-between px-0">
        {[0,10,20,30,40,50,60,70,80,90,100].map(tick => (
          <button
            key={tick}
            type="button"
            onClick={() => !disabled && onChange(tick)}
            className="flex flex-col items-center gap-0.5 group/tick"
            style={{ cursor: disabled ? 'default' : 'pointer' }}
          >
            <div
              className="w-px transition-all"
              style={{
                height: tick % 50 === 0 ? 6 : 4,
                background: value >= tick && tick > 0 ? color : 'rgba(255,255,255,0.15)',
              }}
            />
            {(tick % 20 === 0) && (
              <span
                className="font-mono transition-all"
                style={{
                  fontSize: 9,
                  color: value >= tick && tick > 0 ? color : 'var(--silver-ghost)',
                  opacity: tick === 0 ? 0.4 : 1,
                }}
              >
                {tick === 0 ? '0' : tick}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
