<template>
  <nav class="navbar">
    <!-- Brand/Logo -->
    <div class="navbar-brand">
      <router-link to="/home" class="logo">
        <img src="/img/icons/app-logo.png" alt="JM Garis Logo" class="logo-image">
        <span class="store-name">JM GARIS</span>
      </router-link>
    </div>

    <!-- Mobile Menu Toggle -->
    <button class="mobile-menu-toggle" @click="toggleMobileMenu" :class="{ active: showMobileMenu }">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Desktop Navigation -->
    <div class="navbar-menu" :class="{ active: showMobileMenu }">
      <router-link to="/home" class="nav-link" @click="closeMobileMenu">
        <i class="fas fa-home"></i>
        <span>Home</span>
      </router-link>
      <router-link to="/products" class="nav-link" @click="closeMobileMenu">
        <i class="fas fa-box"></i>
        <span>Products</span>
      </router-link>
      <router-link to="/rewards" class="nav-link" @click="closeMobileMenu">
        <i class="fas fa-gift"></i>
        <span>Rewards</span>
      </router-link>
    </div>

    <!-- Right Side Actions -->
    <div class="navbar-actions">
      <!-- Cart -->
      <router-link to="/cart" class="action-btn cart-btn" title="Shopping Cart">
        <i class="fas fa-shopping-cart"></i>
        <span v-if="cartItemCount > 0" class="badge">{{ cartItemCount }}</span>
      </router-link>

      <!-- Orders -->
      <router-link to="/track-orders" class="action-btn orders-btn" title="Track Orders">
        <i class="fas fa-truck"></i>
        <span v-if="activeOrdersCount > 0" class="badge">{{ activeOrdersCount }}</span>
      </router-link>
      
      <!-- Notifications -->
      <div class="notifications-dropdown" ref="notificationsDropdown">
        <button class="action-btn notifications-btn" @click="toggleNotifications" title="Notifications">
          <i class="fas fa-bell"></i>
          <span v-if="unreadNotificationsCount > 0" class="badge">
            {{ unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount }}
          </span>        
        </button>
        
        <div v-show="showNotificationsDropdown" class="notifications-menu">
          <div class="notifications-header">
            <h3>Notifications</h3>
            <button v-if="unreadNotificationsCount > 0" @click="markAllAsRead" class="mark-all-read">
              Mark all read
            </button>
          </div>
          
          <div v-if="notifications.length > 0" class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.is_read }"
              @click="viewNotification(notification)"
            >
              <div class="notification-icon" :class="getNotificationIconClass(notification)">
                <i :class="notification.icon || getNotificationIcon(notification)"></i>
              </div>
              <div class="notification-content">
                <p class="notification-text">{{ notification.message }}</p>
                <span class="notification-time">{{ formatNotificationTime(notification.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>No notifications</p>
          </div>
        </div>
      </div>

      <!-- Profile -->
      <div class="profile-dropdown" ref="profileDropdown">
        <button class="profile-trigger" @click="toggleDropdown">
          <img
            :src="profileImage"
            alt="Profile"
            class="profile-image"
            @error="handleImageError"
          >
          <span class="username">{{ username }}</span>
          <i class="fas fa-chevron-down dropdown-icon" :class="{ rotated: showDropdown }"></i>
        </button>

        <div v-show="showDropdown" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item" @click="closeDropdowns">
            <i class="fas fa-user"></i>
            <span>Profile</span>
          </router-link>
          <router-link to="/notifications" class="dropdown-item" @click="closeDropdowns">
            <i class="fas fa-bell"></i>
            <span>Notifications</span>
          </router-link>
          <router-link to="/qr-code" class="dropdown-item" @click="closeDropdowns">
            <i class="fas fa-qrcode"></i>
            <span>QR Code</span>
          </router-link>
          <router-link to="/order-history" class="dropdown-item" @click="closeDropdowns">
            <i class="fas fa-history"></i>
            <span>Order History</span>
          </router-link>
          <div class="dropdown-divider"></div>
          <button @click="handleLogout" class="dropdown-item logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div v-show="showMobileMenu" class="mobile-menu-overlay" @click="closeMobileMenu"></div>
  </nav>
</template>

<script>
import { getAvatarUrl } from '../utils/avatarHandler.js';

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
      showMobileMenu: false,
      profilePicture: null,
      cartItems: [],
      activeOrders: [],
      notifications: [],
      notificationCheckInterval: null,
    }
  },
  computed: {
    cartItemCount() {
      return this.cartItems.length;
    },
    activeOrdersCount() {
      return this.activeOrders.filter(order => 
        order && order.status && ['pending', 'preparing', 'ready for pickup', 'to verify'].includes(order.status.toLowerCase())
      ).length;
    },
    profileImage() {
      if (this.profilePicture) {
        return this.profilePicture;
      }
      return getAvatarUrl(this.username);
    },
    unreadNotificationsCount() {
      return this.notifications.filter(notification => notification && !notification.is_read).length;
    }
  },
  methods: {
    // Mobile menu methods
    toggleMobileMenu() {
      this.showMobileMenu = !this.showMobileMenu;
      if (this.showMobileMenu) {
        this.closeDropdowns();
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
    closeMobileMenu() {
      this.showMobileMenu = false;
      document.body.style.overflow = '';
    },
    closeDropdowns() {
      this.showDropdown = false;
      this.showNotificationsDropdown = false;
    },
    handleLogout() {
      this.closeDropdowns();
      this.closeMobileMenu();
      this.$emit('logout');
    },
    
    loadDeletedNotificationIds() {
      // This method is no longer needed as deletion is handled by the backend
    },

    saveDeletedNotificationIds() {
      // This method is no longer needed as deletion is handled by the backend
    },
    handleImageError(e) {
      e.target.onerror = null; // Prevent infinite loop
      e.target.src = getAvatarUrl(this.username);
    },
    async fetchActiveOrders() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/orders/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const orders = await response.json();
          // Ensure orders is an array and filter out null/undefined values
          this.activeOrders = Array.isArray(orders) ? orders.filter(order => order != null) : [];
          
          // Load existing notifications first to prevent duplicates
          await this.loadNotifications();
          
          // Create notifications for orders that don't have them yet
          await this.createNotificationsForOrders(this.activeOrders);
        }
      } catch (error) {
        console.error('Error fetching active orders:', error);
        this.activeOrders = [];
      }
    },
    async createNotificationsForOrders(orders) {
      const token = localStorage.getItem('token');
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Only check orders from last 24 hours
      
      for (const order of orders) {
        // Skip if order is undefined or doesn't have required properties
        if (!order || !order.order_id) {
          continue;
        }
        
        // Skip orders that are too old (more than 24 hours)
        const orderDate = new Date(order.created_at || order.updated_at);
        if (orderDate < oneDayAgo) {
          continue;
        }
        
        const notificationId = `order-${order.order_id}-${order.status}`;
        
        // Check if notification already exists in database
        const existingNotification = this.notifications.find(n => n && (n.id === notificationId || n.custom_id === notificationId));
        
        if (!existingNotification) {
          // Create new notification via API
          const newNotification = {
            custom_id: notificationId, // Include custom ID to prevent duplicates
            title: `Order Update`,
            message: this.getOrderStatusMessage(order),
            type: 'order',
            icon: this.getNotificationIcon({ type: 'order', status: order.status }),
            related_order_id: order.order_id,
            action_url: `/order-details/${order.order_id}`
          };
          
          try {
            const createResponse = await this.$fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newNotification)
            });
            
            if (createResponse.ok) {
              const responseData = await createResponse.json();
              this.notifications.unshift(responseData.notification);
            }
          } catch (createError) {
            console.error('Error creating notification:', createError);
          }
        }
      }
      
      // Keep only the 20 most recent notifications
      this.notifications = this.notifications.slice(0, 20);
    },
    async checkForNewNotifications() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/orders/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const orders = await response.json();
          // Ensure orders is an array and filter out null/undefined values
          this.activeOrders = Array.isArray(orders) ? orders.filter(order => order != null) : [];
          
          // Only create notifications for truly new orders (status changes)
          await this.createNotificationsForNewOrderStatuses(this.activeOrders);
        }
      } catch (error) {
        console.error('Error checking for new notifications:', error);
      }
    },
    async createNotificationsForNewOrderStatuses(orders) {
      const token = localStorage.getItem('token');
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Only check orders from last 24 hours
      
      for (const order of orders) {
        // Skip if order is undefined or doesn't have required properties
        if (!order || !order.order_id) {
          continue;
        }
        
        // Skip orders that are too old (more than 24 hours)
        const orderDate = new Date(order.created_at || order.updated_at);
        if (orderDate < oneDayAgo) {
          continue;
        }
        
        const notificationId = `order-${order.order_id}-${order.status}`;
        
        // Check if notification already exists in database
        const existingNotification = this.notifications.find(n => n && (n.id === notificationId || n.custom_id === notificationId));
        
        if (!existingNotification) {
          // This is a new status for this order, create notification
          const newNotification = {
            custom_id: notificationId, // Include custom ID to prevent duplicates
            title: `Order Update`,
            message: this.getOrderStatusMessage(order),
            type: 'order',
            icon: this.getNotificationIcon({ type: 'order', status: order.status }),
            related_order_id: order.order_id,
            action_url: `/order-details/${order.order_id}`
          };
          
          try {
            const createResponse = await this.$fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newNotification)
            });
            
            if (createResponse.ok) {
              const responseData = await createResponse.json();
              this.notifications.unshift(responseData.notification);
              
              // Keep only the 20 most recent notifications
              this.notifications = this.notifications.slice(0, 20);
            }
          } catch (createError) {
            console.error('Error creating notification:', createError);
          }
        }
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
      if (this.showDropdown) {
        this.showNotificationsDropdown = false;
        this.showMobileMenu = false;
      }
    },
    toggleNotifications() {
      this.showNotificationsDropdown = !this.showNotificationsDropdown;
      if (this.showNotificationsDropdown) {
        this.showDropdown = false;
        this.showMobileMenu = false;
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
        const response = await this.$fetch('/api/users/profile', {
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
    async fetchCart() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const cartData = await response.json();
          this.cartItems = cartData.items || cartData;
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        this.cartItems = [];
      }
    },
    async updateOrderNotifications(orders) {
      // Create a copy of existing notifications
      let currentNotifications = [...this.notifications];
      
      // Process orders to create/update notifications
      for (const order of orders) {
        const notificationId = `order-${order.order_id}-${order.status}`;
        
        // Check if notification already exists in current notifications
        const existingNotificationIndex = currentNotifications.findIndex(
          n => n.id === notificationId || n.custom_id === notificationId
        );
        
        // If notification doesn't exist in current notifications, check if we should add it
        if (existingNotificationIndex === -1) {
          // Create new notification via API
          const newNotification = {
            custom_id: notificationId, // Include custom ID to prevent duplicates
            title: `Order Update`,
            message: this.getOrderStatusMessage(order),
            type: 'order',
            icon: this.getNotificationIcon({ type: 'order', status: order.status }),
            related_order_id: order.order_id,
            action_url: `/order-details/${order.order_id}`
          };
          
          try {
            const token = localStorage.getItem('token');
            const createResponse = await this.$fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newNotification)
            });
            
            if (createResponse.ok) {
              const responseData = await createResponse.json();
              currentNotifications.unshift(responseData.notification);
            }
          } catch (createError) {
            console.error('Error creating notification:', createError);
          }
        }
      }
      
      // Remove duplicates based on ID
      const uniqueNotifications = currentNotifications.filter((notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
      );
      
      // Keep only the 20 most recent notifications
      this.notifications = uniqueNotifications.slice(0, 20);
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
      
      const status = notification.status ? notification.status.toLowerCase() : '';
      if (status === 'pending') return 'fas fa-hourglass-half';
      if (status === 'preparing') return 'fas fa-utensils';
      if (status === 'ready for pickup') return 'fas fa-check-circle';
      if (status === 'paid') return 'fas fa-money-bill-wave';
      return 'fas fa-bell';
    },

    getNotificationIconClass(notification) {
      if (notification.type === 'reward') return 'reward-icon';
      if (notification.type !== 'order') return '';
      
      const status = notification.status ? notification.status.toLowerCase() : '';
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
    async viewNotification(notification) {
      try {
        // Mark as read via API
        const token = localStorage.getItem('token');
        await this.$fetch(`/api/notifications/mark-read/${notification.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Update local state
        notification.is_read = true;
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('notifications-updated', {
          detail: { notifications: this.notifications }
        }));
        
        // Navigate based on notification type
        if (notification.type === 'order') {
          this.$router.push('/order-details/' + notification.related_order_id);
        } else if (notification.action_url) {
          this.$router.push(notification.action_url);
        }
        
        this.showNotificationsDropdown = false;
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    async markAllAsRead() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/notifications/mark-all-read', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update local state
          this.notifications.forEach(notification => {
            notification.is_read = true;
          });
          
          // Dispatch an event to notify other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { notifications: this.notifications }
          }));
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },
    async saveNotifications() {
      // This method is now handled by the backend API
      // Notifications are automatically saved when created
    },
    getSavedNotifications() {
      // This method is no longer needed as notifications are loaded from API
      return this.notifications;
    },
    async loadNotifications() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter out any null or undefined values
          this.notifications = Array.isArray(data) ? data.filter(n => n != null) : [];
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
    document.addEventListener('click', this.closeNotifications);
    
    // Load deleted notification IDs first
    this.loadNotifications();
    
    this.fetchProfilePicture();
    this.fetchCart();
    this.fetchActiveOrders();
    
    // Add event listeners for updates
    window.addEventListener('cart-updated', this.fetchCart);
    window.addEventListener('orders-updated', this.fetchActiveOrders);
    
    // Listen for profile picture updates
    window.addEventListener('profile-updated', (event) => {
      if (event.detail && event.detail.profilePicture) {
        this.profilePicture = event.detail.profilePicture;
      } else {
        // Refetch profile picture from server
        this.fetchProfilePicture();
      }
    });
    
    // Listen for notification updates with custom event
   window.addEventListener('notifications-updated', (event) => {
      if (event.detail) {
        // Update notifications from the event
        if (event.detail.notifications) {
          this.notifications = event.detail.notifications;
        }
      } else {
        // Just reload notifications from API
        this.loadNotifications();
      }
    });
    
    // Check for new order status changes periodically
    this.notificationCheckInterval = setInterval(() => {
      // Check for truly new notifications without overriding existing read status
      this.checkForNewNotifications();
    }, 60000); // Every minute
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown);
    document.removeEventListener('click', this.closeNotifications);
    
    window.removeEventListener('cart-updated', this.fetchCart);
    window.removeEventListener('orders-updated', this.fetchActiveOrders);
    window.removeEventListener('profile-updated', this.fetchProfilePicture);
    window.removeEventListener('notifications-updated', this.loadNotifications);
    
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }
    
    // Clean up mobile menu
    document.body.style.overflow = '';
  }
}
</script>

<style scoped>
/* Base Navbar Styles */
.navbar {
  background-color: #ffffff;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #e9ecef;
}

/* Brand/Logo */
.navbar-brand {
  display: flex;
  align-items: center;
  z-index: 1001;
}

.logo {
  color: #4CAF50;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.logo:hover {
  color: #45a049;
}

.logo-image {
  height: 32px;
  width: auto;
  border-radius: 4px;
}

.store-name {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.5px;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.25rem;
  z-index: 1001;
}

.mobile-menu-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background-color: #4CAF50;
  transition: all 0.3s ease;
  border-radius: 1px;
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Navigation Menu */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link {
  color: #6c757d;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.nav-link:hover,
.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.nav-link i {
  font-size: 0.875rem;
}

/* Actions Container */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Action Buttons */
.action-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: #6c757d;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 1.1rem;
}

.action-btn:hover {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

/* Badge */
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #dc3545;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Notifications Dropdown */
.notifications-dropdown {
  position: relative;
}

.notifications-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  z-index: 1002;
  border: 1px solid #e9ecef;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.notifications-header h3 {
  font-size: 1rem;
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.mark-all-read {
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.mark-all-read:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.notifications-list {
  max-height: 300px;
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

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: #f0f8ff;
}

.notification-item.unread:hover {
  background-color: #e6f3ff;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
  font-size: 0.875rem;
}

.pending-icon {
  background-color: #fff3cd;
  color: #856404;
}

.preparing-icon {
  background-color: #e3f2fd;
  color: #1976d2;
}

.ready-icon {
  background-color: #d4edda;
  color: #155724;
}

.paid-icon {
  background-color: #d1e7dd;
  color: #0f5132;
}

.reward-icon {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #2c3e50;
  line-height: 1.4;
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

/* Profile Dropdown */
.profile-dropdown {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  background: none;
  border: none;
}

.profile-trigger:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.profile-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e9ecef;
}

.username {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.875rem;
}

.dropdown-icon {
  color: #6c757d;
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 180px;
  padding: 0.5rem 0;
  z-index: 1002;
  border: 1px solid #e9ecef;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
  transition: background-color 0.3s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.dropdown-item i {
  font-size: 0.875rem;
  width: 16px;
}

.dropdown-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 0.5rem 0;
}

.logout-btn {
  color: #dc3545;
}

.logout-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 1rem;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-menu-overlay {
    display: block;
  }

  .navbar-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background-color: white;
    flex-direction: column;
    align-items: flex-start;
    padding: 5rem 1.5rem 1.5rem 1.5rem;
    gap: 1rem;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  }

  .navbar-menu.active {
    transform: translateX(0);
  }

  .nav-link {
    width: 100%;
    padding: 1rem 0.75rem;
    font-size: 1rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .nav-link:last-child {
    border-bottom: none;
  }

  .nav-link span {
    margin-left: 0.5rem;
  }

  .username {
    display: none;
  }

  .navbar-actions {
    gap: 0.25rem;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .notifications-menu {
    width: calc(100vw - 2rem);
    right: -1rem;
    max-width: 300px;
  }

  .dropdown-menu {
    right: -1rem;
    min-width: 160px;
  }

  .store-name {
    font-size: 0.9rem;
  }

  .logo {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.5rem 0.75rem;
  }

  .navbar-menu {
    width: 100vw;
    padding: 4rem 1rem 1rem 1rem;
  }

  .notifications-menu {
    width: calc(100vw - 1rem);
    right: -0.5rem;
  }

  .dropdown-menu {
    right: -0.5rem;
  }
}

/* Smooth animations */
.navbar-menu,
.dropdown-menu,
.notifications-menu {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>