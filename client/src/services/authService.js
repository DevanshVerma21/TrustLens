import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth';

const KEYS = {
  ACCESS:  'tl_access_token',
  REFRESH: 'tl_refresh_token',
  USER:    'tl_user',
};

// ── Token storage ─────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess:    ()       => localStorage.getItem(KEYS.ACCESS),
  getRefresh:   ()       => localStorage.getItem(KEYS.REFRESH),
  getUser:      ()       => { try { return JSON.parse(localStorage.getItem(KEYS.USER)); } catch { return null; } },

  setTokens: (access, refresh) => {
    localStorage.setItem(KEYS.ACCESS,  access);
    localStorage.setItem(KEYS.REFRESH, refresh);
  },
  setUser: (user) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(KEYS.ACCESS);
    localStorage.removeItem(KEYS.REFRESH);
    localStorage.removeItem(KEYS.USER);
  },
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new account.
   * Returns { accessToken, refreshToken, user }
   */
  async register(email, password, name = '') {
    const { data } = await axios.post(`${BASE_URL}/register`, { email, password, name });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    tokenStore.setUser(data.user);
    return data;
  },

  /**
   * Log in with email + password.
   * Returns { accessToken, refreshToken, user }
   */
  async login(email, password) {
    const { data } = await axios.post(`${BASE_URL}/login`, { email, password });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    tokenStore.setUser(data.user);
    return data;
  },

  /**
   * Use a refresh token to get a new access token.
   * Automatically updates storage.
   */
  async refreshAccessToken() {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) throw new Error('No refresh token available');

    const { data } = await axios.post(`${BASE_URL}/refresh`, { refreshToken });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  },

  /**
   * Revoke refresh token and clear local storage.
   */
  async logout() {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) {
        await axios.post(`${BASE_URL}/logout`, { refreshToken });
      }
    } catch (_) { /* best-effort */ }
    tokenStore.clear();
  },

  /**
   * Fetch the authenticated user's profile.
   * Requires a valid access token in storage.
   */
  async me() {
    const token = tokenStore.getAccess();
    const { data } = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    tokenStore.setUser(data.user);
    return data.user;
  },

  /** True if an access token exists in storage */
  isAuthenticated: () => !!tokenStore.getAccess(),
};

export default authService;
