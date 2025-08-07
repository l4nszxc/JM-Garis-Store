<template>
  <nav class="navbar">
    <!-- Brand/Logo -->
    <div class="navbar-brand">
      <router-link to="/home" class="logo">
        <i class="fas fa-store"></i>
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
// ...existing script remains the same...
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
      const count = this.notifications.filter(notification => !notification.read).length;
      return count > 99 ? 99 : count;
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
    async fetchActiveOrdersOnly() {
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
          // Don't call updateOrderNotifications to preserve user's read status
        }
      } catch (error) {
        console.error('Error fetching active orders:', error);
        this.activeOrders = [];
      }
    },
    async checkForNewNotifications() {
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
          
          // Only add truly new notifications (never seen before)
          const savedNotifications = this.getSavedNotifications();
          const savedNotificationIds = new Set(savedNotifications.map(n => n.id));
          
          let hasNewNotifications = false;
          
          orders.forEach(order => {
            const notificationId = `order-${order.order_id}-${order.status}`;
            
            // Skip if deleted or already exists
            if (this.deletedNotificationIds.has(notificationId) || savedNotificationIds.has(notificationId)) {
              return;
            }
            
            // This is a truly new notification
            const newNotification = {
              id: notificationId,
              type: 'order',
              orderId: order.order_id,
              status: order.status,
              read: false,
              timestamp: new Date().toISOString(),
              message: this.getOrderStatusMessage(order)
            };
            
            this.notifications.unshift(newNotification);
            hasNewNotifications = true;
          });
          
          if (hasNewNotifications) {
            // Keep only the 20 most recent notifications
            this.notifications = this.notifications.slice(0, 20);
            this.saveNotifications();
          }
        }
      } catch (error) {
        console.error('Error checking for new notifications:', error);
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
      
      // Get saved notifications to preserve read status and avoid recreation
      const savedNotifications = this.getSavedNotifications();
      const savedNotificationMap = new Map(savedNotifications.map(n => [n.id, n]));
      
      // Process orders to create/update notifications
      orders.forEach(order => {
        const notificationId = `order-${order.order_id}-${order.status}`;
        
        // Skip if this notification was previously deleted
        if (this.deletedNotificationIds.has(notificationId)) {
          return;
        }
        
        // Check if notification already exists in current notifications
        const existingNotificationIndex = currentNotifications.findIndex(
          n => n.id === notificationId
        );
        
        // If notification doesn't exist in current notifications, check if we should add it
        if (existingNotificationIndex === -1) {
          // If we had this notification before (check saved), preserve its state
          const savedNotification = savedNotificationMap.get(notificationId);
          
          if (savedNotification) {
            // Use the saved notification to preserve read status and timestamp
            currentNotifications.unshift(savedNotification);
          } else {
            // Create new notification only if it's truly new
            const newNotification = {
              id: notificationId,
              type: 'order',
              orderId: order.order_id,
              status: order.status,
              read: false,
              timestamp: new Date().toISOString(),
              message: this.getOrderStatusMessage(order)
            };
            
            currentNotifications.unshift(newNotification);
          }
        }
      });
      
      // Remove duplicates based on ID
      const uniqueNotifications = currentNotifications.filter((notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
      );
      
      // Keep only the 20 most recent notifications
      this.notifications = uniqueNotifications.slice(0, 20);
      
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
    getSavedNotifications() {
      try {
        const saved = localStorage.getItem('userNotifications');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Error getting saved notifications:', error);
        return [];
      }
    },
    loadNotifications() {
      try {
        const saved = localStorage.getItem('userNotifications');
        if (saved) {
          // Parse the saved notifications
          const parsedNotifications = JSON.parse(saved);
          
          // Simply use the saved notifications to preserve all states (read/unread)
          this.notifications = parsedNotifications;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
    document.addEventListener('click', this.closeNotifications);
    
    // Load deleted notification IDs first
    this.loadDeletedNotificationIds();
    
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