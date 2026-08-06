import { describe, it, expect } from 'vitest';
import './fetchInterceptor';

describe('fetchInterceptor unit tests', () => {
  it('defines window.fetch wrapper', () => {
    expect(typeof window.fetch).toBe('function');
  });
});
