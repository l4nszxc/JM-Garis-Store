// Global API Mixin for all components
import API_BASE_URL, { apiGet, apiPost, apiPut, apiDelete, apiUpload, replaceLocalhostUrl } from '@/config/api'

export const apiMixin = {
  data() {
    return {
      API_BASE_URL: API_BASE_URL
    }
  },
  methods: {
    // API helper methods available in all components
    async $apiGet(endpoint, options = {}) {
      return await apiGet(endpoint, options);
    },
    
    async $apiPost(endpoint, data = {}, options = {}) {
      return await apiPost(endpoint, data, options);
    },
    
    async $apiPut(endpoint, data = {}, options = {}) {
      return await apiPut(endpoint, data, options);
    },
    
    async $apiDelete(endpoint, options = {}) {
      return await apiDelete(endpoint, options);
    },
    
    async $apiUpload(endpoint, formData, options = {}) {
      return await apiUpload(endpoint, formData, options);
    },
    
    // Helper to quickly replace any remaining localhost URLs
    $replaceUrl(url) {
      return replaceLocalhostUrl(url);
    },
    
    // Quick fetch replacement that automatically uses correct base URL
    async $fetch(url, options = {}) {
      const fullUrl = url.startsWith('http') ? this.$replaceUrl(url) : `${API_BASE_URL}${url}`;
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };
      
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };
      
      console.log(`🌐 $fetch: ${options.method || 'GET'} ${fullUrl}`);
      const response = await fetch(fullUrl, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  }
}

export default apiMixin;
