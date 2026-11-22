import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('supports conditional object syntax', () => {
    expect(cn({ active: true, hidden: false })).toBe('active');
  });

  it('lets later Tailwind classes override conflicting earlier ones', () => {
    expect(cn('p-2 text-sm', 'p-4')).toBe('text-sm p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
