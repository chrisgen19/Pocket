export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:3000';

export const LOGIN_URL = `${API_BASE_URL}/login`;
export const REGISTER_URL = `${API_BASE_URL}/register`;
export const SAVES_URL = `${API_BASE_URL}/saves`;
