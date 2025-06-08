<template>
  <nav class="navbar">
    <div class="navbar-brand">
  <router-link to="/home" class="logo">
    <i class="fas fa-store"></i>
    <span class="store-name">JM GARIS STORE</span>
  </router-link>
</div>

    <div class="navbar-menu">
      <router-link to="/home" class="nav-link">Home</router-link>
      <router-link to="/products" class="nav-link">Products</router-link>
      <router-link to="/rewards" class="nav-link">
        <i class="fas fa-gift"></i> Rewards
      </router-link>
    </div>

    <div class="navbar-end">
      <router-link to="/cart" class="cart-button">
        <i class="fas fa-shopping-cart"></i> 
        <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
      </router-link>

      <router-link to="/view-orders" class="orders-button">
        <i class="fas fa-truck"></i> 
        <span v-if="activeOrdersCount > 0" class="count-badge">{{ activeOrdersCount }}</span>
      </router-link>
      <div class="profile-dropdown" ref="profileDropdown">
        <div class="profile-trigger" @click="toggleDropdown">
          <img
              :src="profileImage"
              alt="Profile"
              class="profile-image"
              @error="handleImageError"
          >
          <span class="username">{{ username }}</span>
          <i class="fas fa-chevron-down dropdown-icon"></i>
        </div>

        <div v-show="showDropdown" class="dropdown-menu">
        <router-link to="/profile" class="dropdown-item">
            <i class="fas fa-user"></i> Profile
        </router-link>
        <router-link to="/order-history" class="dropdown-item">
            <i class="fas fa-history"></i> Order History
        </router-link>
        <div class="dropdown-divider"></div>
        <button @click="$emit('logout')" class="dropdown-item" data-action="logout">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  props: {
    username: {
      type: String,
      default: 'User'
    }
  },
  data() {
    return {
      showDropdown: false,
      profilePicture: null,
      cartItems: [],
      activeOrders: []
    }
  },
  computed: {
    
    cartItemCount() {
      return this.cartItems.length;
    },
    activeOrdersCount() {
      return this.activeOrders.filter(order => 
        ['pending', 'preparing', 'ready for pickup'].includes(order.status.toLowerCase())
      ).length;
    },
    profileImage() {
        // Use ImgBB URL directly if available, otherwise use fallback
        if (this.profilePicture) {
            return this.profilePicture; // ImgBB URL
        }
        return `https://ui-avatars.com/api/?name=${this.username}&background=random`;
    }
  },
  methods: {
    handleImageError(e) {
        e.target.src = `https://ui-avatars.com/api/?name=${this.username}&background=random`;
    },
    async fetchActiveOrders() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/orders/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          this.activeOrders = await response.json();
        }
      } catch (error) {
        console.error('Error fetching active orders:', error);
        this.activeOrders = [];
      }
    },
    async fetchCart() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          this.cartItems = await response.json();
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        this.cartItems = [];
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    closeDropdown(event) {
      if (!this.$refs.profileDropdown.contains(event.target)) {
        this.showDropdown = false;
      }
    },
    async fetchProfilePicture() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.profilePicture = data.profile_picture;
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
    this.fetchProfilePicture();
    this.fetchCart();
    this.fetchActiveOrders(); // Fetch active orders on mount
    
    // Add event listeners for updates
    window.addEventListener('cart-updated', () => {
      this.fetchCart();
    });
    window.addEventListener('orders-updated', () => {
      this.fetchActiveOrders();
    });
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
    window.removeEventListener('cart-updated', this.fetchCart);
    window.removeEventListener('orders-updated', this.fetchActiveOrders);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
    window.removeEventListener('cart-updated', this.fetchCart);
  }
}
</script>

<style scoped>
.navbar {
  background-color: #ffffff;
  padding: 0.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-brand {
  display: flex;
  align-items: center;
}
.orders-button {
  background: none;
  border: none;
  color: #34495e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  position: relative;
  transition: color 0.3s ease;
  text-decoration: none;
  margin-right: 0.5rem;
}
.count-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #4CAF50;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.orders-button:hover {
  color: #2980b9;
}
.logo {
  color: #4CAF50;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo i {
  font-size: 1.25rem;
}

.navbar-menu {
  display: flex;
  gap: 1.5rem;
}
.store-name {
  font-family: Arial, sans-serif;
}
.nav-link {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #4CAF50;
  background-color: #f5f5f5;
}

.navbar-end {
  display: flex;
  align-items: center;
}

.profile-dropdown {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 25px;
  transition: background-color 0.3s ease;
}

.profile-trigger:hover {
  background-color: #f5f5f5;
}

.profile-image {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  color: #333;
  font-weight: 500;
}

.dropdown-icon {
  color: #666;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.profile-trigger:hover .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-top: 0.5rem;
  min-width: 200px;
  padding: 0.5rem 0;
  animation: dropdownFade 0.2s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 1rem;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #4CAF50;
}

.dropdown-divider {
  height: 1px;
  background-color: #eee;
  margin: 0.5rem 0;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.dropdown-item[data-action="logout"],
button.dropdown-item {
  color: #dc3545; /* Red text color */
}

.dropdown-item[data-action="logout"]:hover,
button.dropdown-item:hover {
  background-color: #fdf1f2; /* Light red background on hover */
  color: #dc3545; /* Keep text red on hover */
}

/* Cart button styles */
.cart-button {
  background: none;
  border: none;
  color: #34495e;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  position: relative;
  transition: color 0.3s ease;
  text-decoration: none;
}

.cart-button:hover {
  color: #2980b9;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive styles */
@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 1rem;
  }

  .navbar-menu {
    display: none;
  }

  .username {
    display: none;
  }
  .orders-button {
    padding: 0.5rem;
  }

  .cart-button {
    padding: 0.5rem;
  }
}
</style>