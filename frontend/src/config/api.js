// API Configuration with automatic backend detection and fallbacks
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:7904';
  }
  
  // In production, try environment variable first
  if (process.env.VUE_APP_API_BASE_URL) {
    console.log('Using environment variable API URL:', process.env.VUE_APP_API_BASE_URL);
    return process.env.VUE_APP_API_BASE_URL;
  }
  
  // Fallback to the current production backend URL
  const currentBackendUrl = 'https://backend-a21vvhb4l-l4nszxcs-projects.vercel.app';
  console.log('Using fallback API URL:', currentBackendUrl);
  return currentBackendUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Final API Base URL:', API_BASE_URL);

export default API_BASE_URL;
