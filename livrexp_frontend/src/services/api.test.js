import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './api';

describe('authService API unit tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('login sends POST request to /api/login and returns response', async () => {
    const mockResponse = { success: true, message: 'Connecté avec succès' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await authService.login('test@example.com', 'password123', true);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        username: 'test@example.com',
        password: 'password123',
        _remember_me: true,
      }),
    }));
    expect(result).toEqual(mockResponse);
  });

  it('throws error when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Identifiants invalides' }),
    });

    await expect(authService.login('wrong@example.com', 'wrong', false))
      .rejects.toThrow('Identifiants invalides');
  });

  it('register sends payload to /api/register', async () => {
    const mockResponse = { success: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const payload = { email: 'new@example.com', password: 'pwd' };
    const result = await authService.register(payload);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
    expect(result).toEqual(mockResponse);
  });
});
