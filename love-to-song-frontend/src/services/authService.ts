// file: love-to-song-frontend/src/services/authService.ts
const API_BASE = 'http://localhost:3000';  // assume backend runs here

export interface LoginResponse {
  token: string;
  user: { id: number; name: string; role: string };
}

// Send login request to backend
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  const data = await res.json();
  // Save JWT to localStorage for later use
  localStorage.setItem('authToken', data.token);
  return data;
}

// Utility to get the current JWT (if needed by other services)
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}
