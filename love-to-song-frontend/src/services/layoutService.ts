// file: love-to-song-frontend/src/services/layoutService.ts
import { getAuthToken } from './authService';
const API_BASE = 'http://localhost:3000';

interface LayoutData {
  layout: Array<Object>;
  components: Array<Object>;
}

// Fetch the saved layout for the current user
export async function getLayout(): Promise<LayoutData | null> {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/layout`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch layout');
  }
  return res.json();
}

// Save the current layout for the user
export async function saveLayout(layout: Array<Object>, components: Array<Object>): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  await fetch(`${API_BASE}/layout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ layout, components })
  });
  // We assume the backend will handle saving; no need to parse response for this example
}
