import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import { MotionPlugin } from '@vueuse/motion'
import { apiMixin } from './mixins/apiMixin'

const app = createApp(App)
app.mixin(apiMixin) // Add global API mixin
app.use(router)
app.use(MotionPlugin) // Add this line
app.mount('#app') //helo sach