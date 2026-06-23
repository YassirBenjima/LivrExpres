/**
 * Authentication and Registration API Services
 * Abstracts API calls to backend Symfony endpoints.
 */

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMessage = 'Une erreur est survenue.';
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      // JSON parsing failed, use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const authService = {
  /**
   * Log in user
   */
  async login(username, password, rememberMe) {
    return request('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        _remember_me: rememberMe
      })
    });
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email) {
    return request('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  /**
   * Change user password with token verification
   */
  async resetPasswordChange(password, confirmPassword) {
    return request('/api/reset-password/change', {
      method: 'POST',
      body: JSON.stringify({
        password,
        confirm_password: confirmPassword
      })
    });
  },

  /**
   * Register a new client account
   */
  async register(payload) {
    return request('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Fetch list of available cities
   */
  async getCities() {
    return request('/api/cities', {
      method: 'GET'
    });
  }
};
