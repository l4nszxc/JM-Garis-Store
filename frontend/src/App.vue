<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { setupInactivityTimer } from './utils/auth';
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
    name: 'App',
    setup() {
        const router = useRouter();
        let cleanup;

        onMounted(() => {
            // Setup inactivity timer with router instance
            cleanup = setupInactivityTimer(router);
        });

        onBeforeUnmount(() => {
            // Clean up when component is destroyed
            if (cleanup) {
                cleanup();
            }
        });

        return {};
    }
}
</script>
