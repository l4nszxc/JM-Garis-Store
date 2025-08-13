// API Configuration with automatic backend detection and fallbacks
const getApiBaseUrl = () => {
  // Debug information
  console.log('🔍 Environment Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VUE_APP_API_BASE_URL:', process.env.VUE_APP_API_BASE_URL);
  console.log('Current hostname:', window.location.hostname);
  
  // If we're on Vercel (production), always use the Render backend
  if (window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production') {
    const productionUrl = 'https://jm-garis-backend.onrender.com';
    console.log('🚀 Using production API URL:', productionUrl);
    return productionUrl;
  }
  
  // Local development
  const localUrl = 'http://localhost:7904';
  console.log('🏠 Using local API URL:', localUrl);
  return localUrl;
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Final API Base URL:', API_BASE_URL);

export default API_BASE_URL;
