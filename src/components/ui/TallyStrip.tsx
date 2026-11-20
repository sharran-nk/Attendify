import { useState } from 'react';
import { cn } from '@/lib/utils';

const MAX_GATES = 10;
const SEEN_KEY = 'attendify-tally-seen';

/** One "gate": up to four strokes, struck through on the fifth. */
function Gate({ count, className, delay }: { count: number; className?: string; delay?: number }) {
  return (
    <svg
      viewBox="0 0 28 26"
      className={cn('h-6 w-7', delay !== undefined && 'tally-in', className)}
      style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {[5, 11, 17, 23].slice(0, Math.min(count, 4)).map(x => (
          <path key={x} d={`M${x} 3v20`} />
        ))}
        {count >= 5 && <path d="M1.5 20L26.5 6" />}
      </g>
    </svg>
  );
}

function gatesFor(total: number) {
  const gates: number[] = [];
  let remaining = total;
  while (remaining > 0 && gates.length < MAX_GATES) {
    gates.push(Math.min(remaining, 5));
    remaining -= 5;
  }
  return gates;
}

/**
 * The register's tally marks. Each stroke is one recorded class:
 * attended in ink, absent in the danger colour. The draw-in plays once per session.
 */
export function TallyStrip({ attended, absent, className }: { attended: number; absent: number; className?: string }) {
  const [play] = useState(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return false;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable: just play */
    }
    return true;
  });

  const presentGates = gatesFor(attended);
  const absentGates = gatesFor(absent).slice(0, 4);

  if (presentGates.length === 0 && absentGates.length === 0) return null;

  return (
    <div
      role="img"
      aria-label={`${attended} classes attended, ${absent} absent`}
      className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-2', className)}
    >
      {presentGates.map((count, i) => (
        <Gate key={`p${i}`} count={count} className="text-foreground" delay={play ? Math.min(i * 35, 350) : undefined} />
      ))}
      {absentGates.length > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />}
      {absentGates.map((count, i) => (
        <Gate
          key={`a${i}`}
          count={count}
          className="text-destructive"
          delay={play ? Math.min((presentGates.length + i) * 35, 420) : undefined}
        />
      ))}
    </div>
  );
}
