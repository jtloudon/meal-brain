import { describe, it, expect } from 'vitest';
import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('formats minutes-only ISO durations', () => {
    expect(formatDuration('PT50M')).toBe('50 min');
    expect(formatDuration('PT30M')).toBe('30 min');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration('PT2H30M')).toBe('2 hr 30 min');
    expect(formatDuration('PT2H')).toBe('2 hr');
    expect(formatDuration('PT0H45M')).toBe('45 min');
  });

  it('normalizes overflowing minutes into hours', () => {
    expect(formatDuration('PT90M')).toBe('1 hr 30 min');
  });

  it('handles seconds and day components', () => {
    expect(formatDuration('PT1H30M0S')).toBe('1 hr 30 min');
    expect(formatDuration('P0DT0H20M')).toBe('20 min');
  });

  it('passes through already-readable strings', () => {
    expect(formatDuration('15 mins')).toBe('15 mins');
    expect(formatDuration('10-12 hours')).toBe('10-12 hours');
  });

  it('returns null for empty or zero values', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration('')).toBeNull();
    expect(formatDuration('PT0M')).toBeNull();
  });
});
