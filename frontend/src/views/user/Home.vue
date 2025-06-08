<template>
    <div class="home-container">
      <Navbar 
        :username="username"
        @logout="showLogoutModal = true"
      />
      
      <div class="content">
        <p>USER HOMEPAGE</p>
      </div>
  
      <LogoutModal 
        :show="showLogoutModal"
        @confirm="handleLogout"
        @cancel="showLogoutModal = false"
      />
    </div>
</template>
  
<script>
import Navbar from '../../components/Navbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'
  
export default {
    name: 'Home',
    components: {
        Navbar,
        LogoutModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false
        }
    },
    methods: {
        async handleLogout() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/users/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                } else {
                    throw new Error('Logout failed');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            } finally {
                this.showLogoutModal = false;
            }
        },
            async getUserData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                const response = await fetch('http://localhost:7904/api/users/getUsername', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    this.username = data.username;
                }
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        }
    },
    async mounted() {
        await this.getUserData();
    },
    beforeMount() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
        }
    }
}
</script>
  
  <style scoped>
  .home-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
  }
  
  .content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  </style>