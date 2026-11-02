export const env = {
  /** Real REST backend. Unused while the mock API is active. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
  /** Backend proxy for AI calls. No provider keys ever live in the frontend. */
  aiProxyUrl: import.meta.env.VITE_AI_PROXY_URL as string | undefined,
}
