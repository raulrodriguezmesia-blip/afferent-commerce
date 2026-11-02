const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error [${response.status}]: ${response.statusText}`);
  }

  return response.json();
}

import { type AfferentResponse } from '../types/afferent';

export async function predictTactile(objectLabel: string, imageBase64: string): Promise<AfferentResponse> {
  return fetchApi<AfferentResponse>('/api/v1/predict-tactile', {
    method: 'POST',
    body: JSON.stringify({ object_label: objectLabel, image_base64: imageBase64 }),
  });
}
