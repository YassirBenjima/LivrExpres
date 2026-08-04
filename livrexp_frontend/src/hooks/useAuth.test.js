import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredUser, useAuth, getUserRoles } from './useAuth';

describe('useAuth hook unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns null and default roles when no user is stored', () => {
    expect(getStoredUser()).toBeNull();
    const auth = useAuth();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(getUserRoles()).toEqual(['ROLE_SUPER_ADMIN']);
  });

  it('parses stored user from localStorage', () => {
    const user = { email: 'client@example.com', roles: ['ROLE_CLIENT'] };
    localStorage.setItem('user', JSON.stringify(user));

    const stored = getStoredUser();
    expect(stored).toEqual(user);

    const auth = useAuth();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isClient).toBe(true);
    expect(auth.isLivreur).toBe(false);
  });

  it('detects livreur role correctly', () => {
    const user = { email: 'livreur@example.com', roles: ['ROLE_LIVREUR'] };
    sessionStorage.setItem('user', JSON.stringify(user));

    const auth = useAuth();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isLivreur).toBe(true);
    expect(auth.isClient).toBe(false);
  });
});
