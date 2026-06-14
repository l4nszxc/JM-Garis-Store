import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import { MotionPlugin } from '@vueuse/motion'
import { apiMixin } from './mixins/apiMixin'

// Suppress ResizeObserver loop errors (non-critical Chart.js warnings)
const resizeObserverErrorHandler = (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded') {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay-div');
    if (resizeObserverErrDiv) { resizeObserverErrDiv.setAttribute('style', 'display: none'); }
    if (resizeObserverErr) { resizeObserverErr.setAttribute('style', 'display: none'); }
  }
}
window.addEventListener('error', resizeObserverErrorHandler);

const app = createApp(App)
app.mixin(apiMixin) // Add global API mixin
app.use(router)
app.use(MotionPlugin) // Add this line
app.mount('#app')