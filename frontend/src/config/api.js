// API Configuration with automatic backend detection and fallbacks
const getApiBaseUrl = () => {
  // Debug information
  console.log('🔍 Environment Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VUE_APP_API_BASE_URL:', process.env.VUE_APP_API_BASE_URL);
  console.log('Current hostname:', window.location.hostname);
  
  // If explicitly set in environment, use that
  if (process.env.VUE_APP_API_BASE_URL) {
    console.log('🔧 Using environment API URL:', process.env.VUE_APP_API_BASE_URL);
    return process.env.VUE_APP_API_BASE_URL;
  }
  
  // If we're on Vercel (production), use the Render backend
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

// API Helper Functions
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for sessions
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    return response;
  } catch (error) {
    console.error(`❌ API Call failed: ${url}`, error);
    throw error;
  }
};

// Convenience methods
export const apiGet = (endpoint, options = {}) => apiCall(endpoint, { method: 'GET', ...options });
export const apiPost = (endpoint, data, options = {}) => apiCall(endpoint, { method: 'POST', body: JSON.stringify(data), ...options });
export const apiPut = (endpoint, data, options = {}) => apiCall(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options });
export const apiDelete = (endpoint, options = {}) => apiCall(endpoint, { method: 'DELETE', ...options });

// Specialized API methods
export const apiUpload = (endpoint, formData, options = {}) => {
  const uploadOptions = {
    ...options,
    headers: {
      // Don't set Content-Type for FormData, let browser set it
      ...options.headers,
    },
  };
  // Remove Content-Type for file uploads
  if (uploadOptions.headers['Content-Type']) {
    delete uploadOptions.headers['Content-Type'];
  }
  return apiCall(endpoint, { method: 'POST', body: formData, ...uploadOptions });
};

// Common URL patterns - helps replace localhost URLs quickly
export const replaceLocalhostUrl = (originalUrl) => {
  if (originalUrl.includes('localhost:7904')) {
    return originalUrl.replace('http://localhost:7904', API_BASE_URL);
  }
  return originalUrl;
};

export default API_BASE_URL;
