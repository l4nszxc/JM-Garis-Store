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
      
      <div class="notifications-dropdown" ref="notificationsDropdown">
        <div class="notifications-trigger" @click="toggleNotifications">
          <i class="fas fa-bell"></i>
          <span v-if="unreadNotificationsCount > 0" class="count-badge">
            {{ unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount }}
          </span>        
        </div>
        
        <div v-show="showNotificationsDropdown" class="notifications-menu">
          <div class="notifications-header">
            <h3>Notifications</h3>
            <button v-if="unreadNotificationsCount > 0" @click="markAllAsRead" class="mark-all-read">
              Mark all as read
            </button>
          </div>
          
          <div v-if="notifications.length > 0" class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click="viewNotification(notification)"
            >
              <div class="notification-icon" :class="getNotificationIconClass(notification)">
                <i :class="getNotificationIcon(notification)"></i>
              </div>
              <div class="notification-content">
                <p class="notification-text">{{ notification.message }}</p>
                <span class="notification-time">{{ formatNotificationTime(notification.timestamp) }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>No notifications</p>
          </div>
        </div>
      </div>

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
          <router-link to="/notifications" class="dropdown-item">
            <i class="fas fa-bell"></i> Notifications
            <span v-if="unreadNotificationsCount > 0" class="menu-badge">
              {{ unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount }}
            </span>
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
      showNotificationsDropdown: false,
      profilePicture: null,
      cartItems: [],
      activeOrders: [],
      notifications: [],
      notificationCheckInterval: null,
      deletedNotificationIds: new Set(),
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
      if (this.profilePicture) {
        return this.profilePicture;
      }
      return `https://ui-avatars.com/api/?name=${this.username}&background=random`;
    },
    unreadNotificationsCount() {
      return this.notifications.filter(notification => !notification.read).length;
    }
  },
  methods: {
    loadDeletedNotificationIds() {
      try {
        const saved = localStorage.getItem('deletedNotificationIds');
        if (saved) {
          const ids = JSON.parse(saved);
          this.deletedNotificationIds = new Set(ids);
        }
      } catch (error) {
        console.error('Error loading deleted notification IDs:', error);
      }
    },

    saveDeletedNotificationIds() {
      try {
        const idsArray = Array.from(this.deletedNotificationIds);
        localStorage.setItem('deletedNotificationIds', JSON.stringify(idsArray));
      } catch (error) {
        console.error('Error saving deleted notification IDs:', error);
      }
    },
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
          const orders = await response.json();
          this.activeOrders = orders;
          this.updateOrderNotifications(orders);
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
      if (this.showDropdown) {
        this.showNotificationsDropdown = false;
      }
    },
    toggleNotifications() {
      this.showNotificationsDropdown = !this.showNotificationsDropdown;
      if (this.showNotificationsDropdown) {
        this.showDropdown = false;
      }
    },
    closeDropdown(event) {
      if (!this.$refs.profileDropdown?.contains(event.target)) {
        this.showDropdown = false;
      }
    },
    closeNotifications(event) {
      if (!this.$refs.notificationsDropdown?.contains(event.target)) {
        this.showNotificationsDropdown = false;
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
    },
    updateOrderNotifications(orders) {
      // Create a copy of existing notifications
      let currentNotifications = [...this.notifications];
      
      // Load deleted notification IDs from localStorage
      this.loadDeletedNotificationIds();
      
      // Process orders to create/update notifications
      orders.forEach(order => {
        const notificationId = `order-${order.order_id}-${order.status}`;
        
        // Skip if this notification was previously deleted
        if (this.deletedNotificationIds.has(notificationId)) {
          return;
        }
        
        // Check if notification already exists for this order status
        const existingNotificationIndex = currentNotifications.findIndex(
          n => n.type === 'order' && n.orderId === order.order_id && n.status === order.status
        );
        
        // If notification doesn't exist for this order status, create it
        if (existingNotificationIndex === -1) {
          const newNotification = {
            id: notificationId,
            type: 'order',
            orderId: order.order_id,
            status: order.status,
            read: false,
            timestamp: new Date().toISOString(),
            message: this.getOrderStatusMessage(order)
          };
          
          currentNotifications.unshift(newNotification); // Add to beginning of array
        }
      });
      
      // Keep only the 20 most recent notifications
      this.notifications = currentNotifications.slice(0, 20);
      
      // Save to localStorage
      this.saveNotifications();
    },
    getOrderStatusMessage(order) {
      const status = order.status.toLowerCase();
      if (status === 'pending') return `Order #${order.order_id} has been placed and is pending.`;
      if (status === 'preparing') return `Order #${order.order_id} is now being prepared.`;
      if (status === 'ready for pickup') return `Order #${order.order_id} is ready for pickup!`;
      if (status === 'paid') return `Order #${order.order_id} has been paid and completed.`;
      return `Order #${order.order_id} status updated to ${status}.`;
    },
    getNotificationIcon(notification) {
      if (notification.type === 'reward') return 'fas fa-gift';
      if (notification.type !== 'order') return 'fas fa-bell';
      
      const status = notification.status.toLowerCase();
      if (status === 'pending') return 'fas fa-hourglass-half';
      if (status === 'preparing') return 'fas fa-utensils';
      if (status === 'ready for pickup') return 'fas fa-check-circle';
      if (status === 'paid') return 'fas fa-money-bill-wave';
      return 'fas fa-bell';
    },

    getNotificationIconClass(notification) {
      if (notification.type === 'reward') return 'reward-icon';
      if (notification.type !== 'order') return '';
      
      const status = notification.status.toLowerCase();
      if (status === 'pending') return 'pending-icon';
      if (status === 'preparing') return 'preparing-icon';
      if (status === 'ready for pickup') return 'ready-icon';
      if (status === 'paid') return 'paid-icon';
      return '';
    },
    formatNotificationTime(timestamp) {
      const now = new Date();
      const date = new Date(timestamp);
      const diffInMinutes = Math.floor((now - date) / 60000);
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    },
    viewNotification(notification) {
      // Mark as read
      notification.read = true;
      this.saveNotifications();
      
      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('notifications-updated', {
        detail: { notifications: this.notifications }
      }));
      
      // Navigate based on notification type
      if (notification.type === 'order') {
        this.$router.push('/order-details/' + notification.orderId);
      } else if (notification.link) {
        this.$router.push(notification.link);
      }
      
      this.showNotificationsDropdown = false;
    },
    markAllAsRead() {
      // Update each notification to be marked as read
      this.notifications.forEach(notification => {
        notification.read = true;
      });
      
      // Save to localStorage to persist
      this.saveNotifications();
      
      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('notifications-updated', {
        detail: { notifications: this.notifications }
      }));
    },
    saveNotifications() {
      try {
        localStorage.setItem('userNotifications', JSON.stringify(this.notifications));
      } catch (error) {
        console.error('Error saving notifications:', error);
      }
    },
    loadNotifications() {
      try {
        const saved = localStorage.getItem('userNotifications');
        if (saved) {
          // Parse the saved notifications
          const parsedNotifications = JSON.parse(saved);
          
          // If we have existing notifications, we need to merge them with the new ones
          // while preserving the read status
          if (this.notifications.length > 0) {
            // Create a map of notification IDs to their read status
            const readStatusMap = {};
            parsedNotifications.forEach(notification => {
              readStatusMap[notification.id] = notification.read;
            });
            
            // Update current notifications with the saved read status
            this.notifications.forEach(notification => {
              if (readStatusMap[notification.id] !== undefined) {
                notification.read = readStatusMap[notification.id];
              }
            });
          } else {
            // No existing notifications, just use the saved ones
            this.notifications = parsedNotifications;
          }
          
          // Save the updated notifications
          this.saveNotifications();
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
    document.addEventListener('click', this.closeNotifications);
    
    this.fetchProfilePicture();
    this.fetchCart();
    this.fetchActiveOrders();
    this.loadNotifications();
    
    // Add event listeners for updates
    window.addEventListener('cart-updated', this.fetchCart);
    window.addEventListener('orders-updated', this.fetchActiveOrders);
    
    // Listen for notification updates with custom event
   window.addEventListener('notifications-updated', (event) => {
      if (event.detail) {
        // Update notifications from the event
        if (event.detail.notifications) {
          this.notifications = event.detail.notifications;
          this.saveNotifications();
        }
        
        // Update deleted notification IDs
        if (event.detail.deletedIds) {
          event.detail.deletedIds.forEach(id => {
            this.deletedNotificationIds.add(id);
          });
          this.saveDeletedNotificationIds();
        }
      } else {
        // Just reload notifications from localStorage
        this.loadNotifications();
      }
    });
    
    // Check for new order status changes periodically
    this.notificationCheckInterval = setInterval(this.fetchActiveOrders, 60000); // Every minute
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
    document.removeEventListener('click', this.closeNotifications);
    
    window.removeEventListener('cart-updated', this.fetchCart);
    window.removeEventListener('orders-updated', this.fetchActiveOrders);
    window.removeEventListener('notifications-updated', this.loadNotifications);
    
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }
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
.notifications-dropdown {
  position: relative;
  margin-right: 1rem;
}

.notifications-trigger {
  background: none;
  border: none;
  color: #34495e;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-menu {
  position: absolute;
  top: 100%;
  right: -10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  width: 350px;
  max-height: 500px;
  overflow-y: auto;
  z-index: 100;
  padding: 0.75rem 0;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;
}

.notifications-header h3 {
  font-size: 1.1rem;
  margin: 0;
  color: #2c3e50;
}

.mark-all-read {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}

.mark-all-read:hover {
  text-decoration: underline;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #ebf5ff;
}

.notification-item.unread:hover {
  background-color: #e1efff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.pending-icon {
  background-color: #fff3cd;
  color: #856404;
}

.preparing-icon {
  background-color: #cce5ff;
  color: #004085;
}

.ready-icon {
  background-color: #d4edda;
  color: #155724;
}

.paid-icon {
  background-color: #d1e7dd;
  color: #0f5132;
}

.notification-content {
  flex: 1;
}

.notification-text {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: #2c3e50;
}

.notification-time {
  font-size: 0.75rem;
  color: #6c757d;
}

.empty-notifications {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
}

.empty-notifications i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.menu-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #e74c3c;
  color: white;
  font-size: 0.7rem;
  height: 18px;
  min-width: 18px;
  border-radius: 9px;
  padding: 0 6px;
  margin-left:  2rem;
}

.navbar-end {
  display: flex;
  align-items: center;
}

.count-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reward-icon {
  background-color: #e8f5e9; 
  color: #2e7d32;
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
  .notifications-menu {
    width: 300px;
    right: -100px;
  }
  
  .notifications-trigger {
    padding: 0.5rem;
  }
}
</style>