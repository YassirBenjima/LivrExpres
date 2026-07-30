/**
 * useAuth - Custom hook for role-based access control.
 *
 * Reads the current user from localStorage & sessionStorage and exposes:
 *   - user         : the raw user object (email, roles, name…)
 *   - roles        : the array of Symfony roles (e.g. ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])
 *   - isAuthenticated  : boolean
 *   - hasRole(role)    : returns true if the user has that specific role
 *   - isLivreur        : shortcut for hasRole('ROLE_LIVREUR')
 *   - isClient         : shortcut for hasRole('ROLE_CLIENT')
 *   - isSuperAdmin     : true if ROLE_SUPER_ADMIN or admin user
 *   - isAdmin          : true if admin/superadmin/superviseur
 */
export function useAuth() {
  let user = null;
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user_profile');
    if (raw) user = JSON.parse(raw);
  } catch (_) {
    // corrupted storage – ignore
  }

  let roles = [];
  if (Array.isArray(user?.roles)) {
    roles = user.roles;
  } else if (typeof user?.role === 'string') {
    roles = [user.role];
  } else if (typeof user?.roles === 'string') {
    roles = [user.roles];
  }

  const hasRole = (role) => {
    if (roles.includes(role)) return true;
    if (role === 'ROLE_SUPER_ADMIN') {
      return roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN') || user?.isSuperAdmin === true || user?.role === 'ROLE_SUPER_ADMIN';
    }
    return false;
  };

  const isLivreur    = roles.includes('ROLE_LIVREUR');
  const isClient     = roles.includes('ROLE_CLIENT');
  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPERVISEUR') || user?.isSuperAdmin === true || user?.role === 'ROLE_SUPER_ADMIN' || (user && !isLivreur && !isClient);
  const isSuperviseur= roles.includes('ROLE_SUPERVISEUR');
  const isAdmin      = roles.includes('ROLE_ADMIN') || isSuperAdmin || isSuperviseur;
  const isAuthenticated = !!user;

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
 * Returns the roles array stored in localStorage/sessionStorage.
 */
export function getUserRoles() {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user_profile');
    if (!raw) return ['ROLE_SUPER_ADMIN']; // Fallback for admin staff view
    const user = JSON.parse(raw);
    if (Array.isArray(user?.roles)) return user.roles;
    if (typeof user?.role === 'string') return [user.role];
    if (typeof user?.roles === 'string') return [user.roles];
    return ['ROLE_SUPER_ADMIN'];
  } catch (_) {
    return ['ROLE_SUPER_ADMIN'];
  }
}
