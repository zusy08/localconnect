// API Configuration for production deployment
export const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_BASE_URL || 'https://your-render-app-name.onrender.com'
  : 'http://localhost:5000';

// Helper function to create full API URLs
export function createApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

// Export the base URL for use in components
export default API_BASE_URL;
