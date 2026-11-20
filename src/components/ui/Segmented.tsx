import { useId } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
}

/** Native radio inputs under the hood, so arrow keys and screen readers work for free. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1', className)}
    >
      {options.map(option => (
        <label key={option.value} className="relative">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={cn(
              'flex min-h-9 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground',
              'transition-[background-color,color,box-shadow] duration-150 ease-out',
              'peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-[var(--shadow-sm)]',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring'
            )}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
