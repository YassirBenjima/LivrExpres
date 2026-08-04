import { describe, it, expect, vi } from 'vitest';
import './fetchInterceptor';

describe('fetchInterceptor unit tests', () => {
  it('defines window.fetch wrapper', () => {
    expect(typeof window.fetch).toBe('function');
  });
});
