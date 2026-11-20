import { cn } from '@/lib/utils';

/** Four strokes crossed by a fifth: the tally mark that stands in for "attendance". */
export function TallyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('h-7 w-7', className)}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M7 6v20" />
        <path d="M13 6v20" />
        <path d="M19 6v20" />
        <path d="M25 6v20" />
      </g>
      <path d="M3 23L29 9" stroke="hsl(var(--margin))" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <TallyMark />
      <span className="font-display text-xl font-bold tracking-tight">Attendify</span>
    </span>
  );
}
