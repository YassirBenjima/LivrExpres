/**
 * useAuth - Custom hook for role-based access control.
 *
 * Reads the current user from localStorage and exposes:
 *   - user         : the raw user object (email, roles, name…)
 *   - roles        : the array of Symfony roles (e.g. ['ROLE_LIVREUR', 'ROLE_USER'])
 *   - isAuthenticated  : boolean
 *   - hasRole(role)    : returns true if the user has that specific role
 *   - isLivreur        : shortcut for hasRole('ROLE_LIVREUR')
 *   - isClient         : shortcut for hasRole('ROLE_CLIENT')
 *   - isAdmin          : shortcut for hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN') || hasRole('ROLE_SUPERVISEUR')
 */
export function useAuth() {
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch (_) {
    // corrupted storage – ignore
  }

  const token = localStorage.getItem('auth_token');
  const isAuthenticated = !!(token && user);

  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const hasRole = (role) => roles.includes(role);

  const isLivreur   = hasRole('ROLE_LIVREUR');
  const isClient     = hasRole('ROLE_CLIENT');
  const isSuperAdmin = hasRole('ROLE_SUPER_ADMIN');
  const isSuperviseur= hasRole('ROLE_SUPERVISEUR');
  const isAdmin      = hasRole('ROLE_ADMIN') || isSuperAdmin || isSuperviseur;

  return {
    user,
    roles,
    isAuthenticated,
    hasRole,
    isLivreur,
    isClient,
    isAdmin,
    isSuperAdmin,
    isSuperviseur,
  };
}

/**
 * getUserRoles() - Standalone helper (no hooks required).
 * Returns the roles array stored in localStorage.
 */
export function getUserRoles() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return [];
    const user = JSON.parse(raw);
    return Array.isArray(user?.roles) ? user.roles : [];
  } catch (_) {
    return [];
  }
}
