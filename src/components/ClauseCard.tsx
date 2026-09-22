"use client";

interface Clause {
  category: string;
  attentionLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  suggestedQuestion: string;
  quote: string;
}

interface ClauseCardProps {
  clause: Clause;
  index: number;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function ClauseCard({ clause: c, index: i, isActive, onMouseEnter, onMouseLeave, onClick }: ClauseCardProps) {
  const isHigh = c.attentionLevel === 'High';
  const isMed  = c.attentionLevel === 'Medium';
  const accent = isHigh ? '#FF6B6B' : isMed ? '#FFB347' : '#5ED0C3';
  const bgTint = isHigh ? 'bg-[#FF6B6B]/[0.05]' : isMed ? 'bg-[#FFB347]/[0.05]' : 'bg-[#5ED0C3]/[0.05]';
  const borderActive = isHigh
    ? 'border-[#FF6B6B]/50 ring-1 ring-[#FF6B6B]/20'
    : isMed
    ? 'border-[#FFB347]/50 ring-1 ring-[#FFB347]/20'
    : 'border-[#5ED0C3]/50 ring-1 ring-[#5ED0C3]/20';
  const label = isHigh ? 'HIGH RISK' : isMed ? 'MEDIUM RISK' : 'LOW RISK';
  const icon  = isHigh ? '⚠' : isMed ? '◆' : '●';

  return (
    <div
      id={`clause-card-${i}`}
      className={`rounded-[14px] border overflow-hidden shadow-sm cursor-pointer transition-all duration-200 ${
        isActive ? `${borderActive} -translate-y-0.5` : 'border-border hover:border-muted-foreground/40'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Coloured top accent bar */}
      <div style={{ backgroundColor: accent }} className="h-[3px] w-full" />

      <div className={`p-5 space-y-4 bg-card ${bgTint}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[17px] text-foreground leading-snug">{c.category}</p>
          </div>
          <span
            style={{ color: accent, borderColor: `${accent}50`, backgroundColor: `${accent}18` }}
            className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
          >
            {icon} {label}
          </span>
        </div>

        {/* Reason */}
        <p className="text-[13px] text-muted-foreground leading-relaxed">{c.reason}</p>

        {/* Quote snippet if present */}
        {c.quote && !c.quote.includes('omitted') && (
          <div className="border-l-[3px] pl-3 py-0.5" style={{ borderColor: accent }}>
            <p className="text-[12px] italic text-muted-foreground leading-relaxed font-serif">
              &ldquo;{c.quote}&rdquo;
            </p>
          </div>
        )}

        {/* Suggested question */}
        {c.suggestedQuestion && (
          <div className="flex items-start gap-2 pt-1 border-t border-border/50">
            <span
              className="text-[11px] shrink-0 font-bold uppercase tracking-wider mt-0.5"
              style={{ color: accent }}
            >
              Ask →
            </span>
            <p className="text-[12px] text-muted-foreground italic leading-relaxed">
              {c.suggestedQuestion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
