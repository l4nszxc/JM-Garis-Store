import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import { MotionPlugin } from '@vueuse/motion'

const app = createApp(App)
app.use(router)
app.use(MotionPlugin) // Add this line
app.mount('#app')