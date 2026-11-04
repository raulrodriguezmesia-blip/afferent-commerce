/* API Error class and utilities */
export class ApiError extends Error {
  status: number;
  code?: string;
  detail?: string;

  constructor(message: string, status: number = 500, code?: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new ApiError('Request was cancelled or timed out', 408, 'TIMEOUT');
    }
    return new ApiError(error.message, 500);
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const message = typeof err.message === 'string' ? err.message : 'An unexpected error occurred';
    const status = typeof err.status === 'number' ? err.status : 500;
    const code = typeof err.code === 'string' ? err.code : undefined;
    const detail = typeof err.detail === 'string' ? err.detail : undefined;
    return new ApiError(message, status, code, detail);
  }

  return new ApiError('An unexpected error occurred', 500);
}

/* Generic API wrapper */
import type { AfferentResponse } from '../types/afferent';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface FetchApiOptions extends RequestInit {
  timeout?: number;
}

export async function fetchApi<T>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options;
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail: string | undefined;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorData.error;
      } catch {
        // ignore json parse error
      }
      throw new ApiError(
        errorDetail || `API Error [${response.status}]: ${response.statusText}`,
        response.status,
        `HTTP_${response.status}`,
        errorDetail
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    throw normalizeError(error);
  }
}

export async function predictTactile(objectLabel: string, imageBase64: string): Promise<AfferentResponse> {
  return fetchApi<AfferentResponse>('/api/v1/predict-tactile', {
    method: 'POST',
    body: JSON.stringify({ object_label: objectLabel, image_base64: imageBase64 }),
  });
}