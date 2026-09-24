/**
 * ReachInbox Base API Client
 * Centralizes HTTP requests, headers, and error handling.
 * Consumes NEXT_PUBLIC_API_URL from environment variables.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Attach auth token from localStorage if present
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('reachinbox_auth_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage access error
    }
  }

  const config: RequestInit = {
    credentials: 'include',
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  // If sending FormData (e.g. file uploads), remove Content-Type to let browser set boundary
  if (config.body instanceof FormData) {
    const headerObj = config.headers as Record<string, string>;
    delete headerObj['Content-Type'];
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    // If running in development and backend is unreachable, throw ApiError or handle downstream
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(503, 'Backend service unreachable or network error', error);
  }
}
