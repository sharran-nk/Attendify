import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttendanceRing } from './AttendanceRing';

describe('AttendanceRing', () => {
  it('shows the rounded percentage label', () => {
    render(<AttendanceRing percentage={74.6} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides the label when showLabel is false', () => {
    render(<AttendanceRing percentage={80} showLabel={false} />);
    expect(screen.queryByText('80%')).not.toBeInTheDocument();
  });

  it.each([
    ['sm', '48'],
    ['md', '80'],
    ['lg', '120'],
  ] as const)('renders the %s size at %spx', (size, px) => {
    const { container } = render(<AttendanceRing percentage={50} size={size} />);
    expect(container.querySelector('svg')).toHaveAttribute('width', px);
  });

  it.each([
    [95, 'hsl(var(--success))'],
    [80, 'hsl(var(--primary))'],
    [65, 'hsl(var(--warning))'],
    [30, 'hsl(var(--destructive))'],
  ])('colours %s%% with %s', (pct, color) => {
    render(<AttendanceRing percentage={pct} />);
    expect(screen.getByText(`${pct}%`).getAttribute('style')).toContain(color);
  });

  it('uses a custom colour when provided', () => {
    render(<AttendanceRing percentage={30} color="rgb(1, 2, 3)" />);
    expect(screen.getByText('30%')).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });
});
