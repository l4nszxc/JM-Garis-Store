<template>
  <div class="notifications-container">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="notifications-content">
      <h1><i class="fas fa-bell"></i> Notifications</h1>
      
      <div class="notifications-actions">
        <div class="select-all-container" v-if="showCheckboxes">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              :checked="allSelected" 
              @change="toggleSelectAll" 
              :disabled="notifications.length === 0"
            />
            <span>Select All</span>
          </label>
        </div>
        
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            :class="{ active: filterType === 'all' }"
            @click="setFilter('all')"
          >
            All
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: filterType === 'unread' }"
            @click="setFilter('unread')"
          >
            Unread 
            <span v-if="unreadNotificationsCount > 0" class="filter-badge">
              {{ unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount }}
            </span>
          </button>
        </div>

        <div class="action-buttons">
          <div class="dropdown-menu">
            <button class="menu-trigger" @click="toggleDropdown" :disabled="isLoadingNotifications">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="dropdown-content" v-if="dropdownOpen">
              <button 
                v-if="unreadNotificationsCount > 0"
                @click="markAllAsRead"
                class="dropdown-item"
              >
                <i class="fas fa-check-double"></i> Mark all as read
              </button>
              <button 
                @click="enterDeleteMode"
                class="dropdown-item"
              >
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          
          <button 
            v-if="showCheckboxes && selectedNotifications.length > 0" 
            @click="showDeleteConfirmation" 
            class="delete-selected-btn"
          >
            <i class="fas fa-trash"></i> Delete Selected
          </button>
          <button 
            v-if="showCheckboxes" 
            @click="cancelDeleteMode" 
            class="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingNotifications" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p class="loading-text">Loading notifications...</p>
      </div>

      <!-- Notifications List -->
      <div v-else-if="filteredNotifications.length > 0" class="notifications-list">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-card"
          :class="{ unread: !notification.is_read, selected: selectedNotificationIds.has(notification.id) }"
          @click="viewNotificationDetails(notification)"
        >
          <div v-if="showCheckboxes" class="notification-checkbox" @click.stop>
            <input 
              type="checkbox" 
              :checked="selectedNotificationIds.has(notification.id)" 
              @change="toggleSelect(notification.id)"
            />
          </div>
          <div class="notification-icon" :class="getNotificationIconClass(notification)">
            <i :class="getNotificationIcon(notification)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h3>{{ getNotificationTitle(notification) }}</h3>
              <div class="notification-controls">
                <span class="notification-time">{{ formatNotificationTime(notification.created_at) }}</span>
                <div class="notification-menu">
                  <button class="notification-menu-trigger" @click.stop="toggleNotificationMenu(notification.id)">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeNotificationMenu === notification.id" class="notification-dropdown">
                    <button v-if="!notification.read" @click.stop="markAsRead(notification)" class="notification-dropdown-item">
                      <i class="fas fa-check"></i> Mark as read
                    </button>
                    <button v-else @click.stop="markAsUnread(notification)" class="notification-dropdown-item">
                      <i class="fas fa-envelope"></i> Mark as unread
                    </button>
                    <button @click.stop="deleteNotification(notification)" class="notification-dropdown-item notification-delete-item">
                      <i class="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
          </div>
        </div>
      </div>
      
      <!-- No Notifications -->
      <div v-else-if="!isLoadingNotifications" class="empty-notifications">
        <i class="fas fa-bell-slash"></i>
        <p>You don't have any notifications</p>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Delete Notifications</h3>
        <p>Are you sure you want to delete {{ deleteTarget ? 'this notification' : selectedNotifications.length === 1 ? 'this notification' : 'these notifications' }}?</p>
        <p class="warning-text">This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="cancel-btn">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button @click="confirmDelete" class="delete-confirm-btn">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
    
    <LogoutModal 
      :show="showLogoutModal"
      @confirm="handleLogout"
      @cancel="showLogoutModal = false"
    />
  </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';

export default {
  name: 'Notifications',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      notifications: [],
      showLogoutModal: false,
      selectedNotificationIds: new Set(),
      showDeleteModal: false,
      filterType: 'all',
      showCheckboxes: false,
      dropdownOpen: false,
      activeNotificationMenu: null, 
      deleteTarget: null,
      isLoadingNotifications: false
    }
  },
  computed: {
    unreadNotificationsCount() {
      const count = this.notifications.filter(notification => !notification.is_read).length;
      return count > 99 ? 99 : count;
    },
    allSelected() {
      return this.filteredNotifications.length > 0 && 
        this.selectedNotificationIds.size === this.filteredNotifications.length;
    },
    selectedNotifications() {
      return this.notifications.filter(notification => 
        this.selectedNotificationIds.has(notification.id)
      );
    },
    filteredNotifications() {
      // Return filtered notifications based on current filter type
      if (this.filterType === 'unread') {
        return this.notifications.filter(notification => !notification.is_read);
      }
      return this.notifications;
    }
  },
  methods: {
    toggleDropdown(event) {
      if (event) event.stopPropagation();
      this.dropdownOpen = !this.dropdownOpen;
      this.activeNotificationMenu = null;
    },
    
    enterDeleteMode() {
      this.showCheckboxes = true;
      this.dropdownOpen = false;
    },
    
    cancelDeleteMode() {
      this.showCheckboxes = false;
      this.selectedNotificationIds.clear();
    },
    
    closeDropdownOnOutsideClick(event) {
      const dropdown = this.$el.querySelector('.dropdown-menu');
      if (dropdown && !dropdown.contains(event.target)) {
        this.dropdownOpen = false;
      }
    },
    
    toggleNotificationMenu(id) {
      if (this.activeNotificationMenu === id) {
        this.activeNotificationMenu = null;
      } else {
        this.activeNotificationMenu = id;
        this.dropdownOpen = false;
      }
      // Prevent event propagation
      event.stopPropagation();
    },
    
    markAsUnread(notification) {
      this.markNotificationAsUnread(notification.id);
      this.activeNotificationMenu = null;
    },
    
    deleteNotification(notification) {
      this.deleteTarget = notification;
      this.showDeleteModal = true;
      this.activeNotificationMenu = null;
    },
    
    setFilter(type) {
      this.filterType = type;
      // Clear selection when changing filters
      this.selectedNotificationIds.clear();
    },
    
    getNotificationIcon(notification) {
      if (notification.icon) return notification.icon;
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

    getNotificationTitle(notification) {
      if (notification.type === 'order') {
        return `Order #${notification.related_order_id}`;
      }
      if (notification.type === 'reward') {
        return 'Reward Redeemed';
      }
      return notification.title || 'Notification';
    },
    
    formatNotificationTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    viewNotificationDetails(notification) {
      // Mark as read when viewing details
      this.markAsRead(notification);
      
      // Navigate based on notification type
      if (notification.type === 'order') {
        this.$router.push(`/order-details/${notification.related_order_id}`);
      } else if (notification.type === 'reward') {
        this.$router.push('/rewards');
      } else if (notification.action_url) {
        this.$router.push(notification.action_url);
      }
    },
    
    toggleSelect(notificationId) {
      if (this.selectedNotificationIds.has(notificationId)) {
        this.selectedNotificationIds.delete(notificationId);
      } else {
        this.selectedNotificationIds.add(notificationId);
      }
    },
    
    toggleSelectAll() {
      if (this.allSelected) {
        // Deselect all
        this.selectedNotificationIds.clear();
      } else {
        // Select all (but only those currently filtered)
        this.selectedNotificationIds = new Set(
          this.filteredNotifications.map(notification => notification.id)
        );
      }
    },
    
    markAsRead(notification) {
      this.markNotificationAsRead(notification.id);
    },
    
    async markNotificationAsRead(notificationId) {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update local notification state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.is_read = true;
          }
          
          // Dispatch event to update other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { notifications: this.notifications }
          }));
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    
    async markNotificationAsUnread(notificationId) {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/notifications/${notificationId}/unread`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update local notification state
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.is_read = false;
          }
          
          // Dispatch event to update other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { notifications: this.notifications }
          }));
        }
      } catch (error) {
        console.error('Error marking notification as unread:', error);
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
          // Update all notifications as read
          this.notifications.forEach(notification => {
            notification.is_read = true;
          });
          
          this.dropdownOpen = false;
          
          // Dispatch event to update other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { notifications: this.notifications }
          }));
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },
    
    showDeleteConfirmation() {
      if (this.selectedNotifications.length > 0) {
        this.showDeleteModal = true;
      }
    },
    
    cancelDelete() {
      this.showDeleteModal = false;
      this.deleteTarget = null;
    },
    
    closeAllMenus(event) {
      // Don't close if clicking on a menu trigger
      if (
        event.target.closest('.menu-trigger') || 
        event.target.closest('.notification-menu-trigger')
      ) {
        return;
      }
      this.activeNotificationMenu = null;
    },
    
    confirmDelete() {
      if (this.deleteTarget) {
        // Delete single notification
        this.deleteNotificationById(this.deleteTarget.id);
        this.deleteTarget = null;
      } else {
        // Delete selected notifications
        const selectedIds = Array.from(this.selectedNotificationIds);
        this.deleteMultipleNotifications(selectedIds);
        this.selectedNotificationIds.clear();
      }
      
      // Close modal
      this.showDeleteModal = false;
    },
    
    async deleteNotificationById(notificationId) {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Remove from local notifications array
          this.notifications = this.notifications.filter(notification => 
            notification.id !== notificationId
          );
          
          // Dispatch event to update other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { 
              notifications: this.notifications,
              deletedIds: [notificationId]
            }
          }));
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    
    async deleteMultipleNotifications(notificationIds) {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/notifications', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: notificationIds })
        });
        
        if (response.ok) {
          // Remove from local notifications array
          this.notifications = this.notifications.filter(notification => 
            !notificationIds.includes(notification.id)
          );
          
          // Dispatch event to update other components
          window.dispatchEvent(new CustomEvent('notifications-updated', {
            detail: { 
              notifications: this.notifications,
              deletedIds: notificationIds
            }
          }));
        }
      } catch (error) {
        console.error('Error deleting multiple notifications:', error);
      }
    },
    saveDeletedNotificationIds(newDeletedIds) {
      // This method is no longer needed since we're using the database
      // Keeping it for compatibility but it doesn't do anything
    },
        
    saveNotifications() {
      // This method is no longer needed since we're using the database
      // Keeping it for compatibility but it doesn't do anything
    },
    
    async loadNotifications() {
      this.isLoadingNotifications = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await this.$fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const notifications = await response.json();
          this.notifications = notifications;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        this.isLoadingNotifications = false;
      }
    },
    
    async getUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        // Get username from token
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username;
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    },
    
    async handleLogout() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/logout', {
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
    }
  },
  mounted() {
    this.getUserData();
    this.loadNotifications();
    
    // Listen for notification updates
    window.addEventListener('notifications-updated', this.loadNotifications);
    
    // Add event listeners for dropdown menus
    document.addEventListener('click', this.closeDropdownOnOutsideClick);
    document.addEventListener('click', this.closeAllMenus);
  },
  beforeUnmount() {
    window.removeEventListener('notifications-updated', this.loadNotifications);
    document.removeEventListener('click', this.closeDropdownOnOutsideClick);
    document.removeEventListener('click', this.closeAllMenus);
  }
}
</script>

<style scoped>
.notifications-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.notifications-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.notifications-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.select-all-container {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-weight: 500;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.mark-all-read-btn, .delete-selected-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.mark-all-read-btn {
  background-color: #3498db;
  color: white;
}

.mark-all-read-btn:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.delete-selected-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-selected-btn:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  cursor: pointer;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.notification-card.unread {
  border-left-color: #3498db;
}

.notification-card.selected {
  background-color: #f0f8ff;
}

.notification-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
}

.notification-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  font-size: 1.5rem;
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
  padding: 1.5rem;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.notification-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.notification-time {
  color: #6c757d;
  font-size: 0.85rem;
}

.notification-message {
  color: #495057;
  margin-bottom: 1rem;
}

.notification-actions {
  display: flex;
  gap: 0.75rem;
}

.read-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background-color: #6c757d;
  color: white;
}

.read-btn:hover {
  background-color: #5a6268;
}

.empty-notifications {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-notifications i {
  font-size: 3rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
}

.empty-notifications p {
  color: #6c757d;
  font-size: 1.1rem;
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.loading-spinner i {
  font-size: 3rem;
  color: #3498db;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.menu-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1rem;
}

.warning-text {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.delete-confirm-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.delete-confirm-btn:hover {
  background-color: #c0392b;
}
.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  color: #4a5568;
}

.filter-btn:hover {
  background-color: #f7fafc;
}

.filter-btn.active {
  background-color: #ebf8ff;
  border-color: #90cdf4;
  color: #3182ce;
  font-weight: 500;
}

.filter-badge {
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropdown-menu {
  position: relative;
}

.menu-trigger {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #4a5568;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-trigger:hover {
  background-color: #f1f5f9;
}

.dropdown-content {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 6px;
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
}

.dropdown-item i {
  width: 18px;
  text-align: center;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.notification-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-menu {
  position: relative;
}

.notification-menu-trigger {
  background: none;
  border: none;
  font-size: 1rem;
  color: #6c757d;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.notification-menu-trigger:hover {
  background-color: #f1f5f9;
  color: #4a5568;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  min-width: 180px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 6px;
  z-index: 15;
  overflow: hidden;
}

.notification-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  border: none;
  background: none;
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-dropdown-item:hover {
  background-color: #f1f5f9;
}

.notification-dropdown-item i {
  width: 16px;
  text-align: center;
}

.notification-delete-item {
  color: #e74c3c;
}

.notification-delete-item:hover {
  background-color: #fdf2f2;
}
.reward-icon {
  background-color: #e8f5e9;
  color: #2e7d32;
}
@media (max-width: 768px) {
  .notifications-content {
    padding: 0.75rem;
  }
  
  h1 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .notifications-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    padding: 0.75rem;
  }
  
  .select-all-container {
    order: 2;
  }
  
  .filter-buttons {
    order: 1;
    width: 100%;
    justify-content: center;
  }
  
  .filter-btn {
    flex: 1;
    justify-content: center;
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .action-buttons {
    order: 3;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .dropdown-content {
    right: 0;
    min-width: 160px;
  }
  
  .notification-card {
    margin-bottom: 0.75rem;
  }
  
  .notification-checkbox {
    padding: 0.75rem 1rem 0 1rem;
    justify-content: flex-start;
  }
  
  .notification-icon {
    width: 60px;
    font-size: 1.25rem;
  }
  
  .notification-content {
    padding: 1rem 0.75rem;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .notification-header h3 {
    font-size: 1rem;
  }
  
  .notification-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .notification-time {
    font-size: 0.8rem;
  }
  
  .notification-message {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }
  
  .notification-dropdown {
    right: 0;
    min-width: 150px;
  }
  
  .notification-dropdown-item {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  
  .empty-notifications {
    padding: 2rem 1rem;
  }
  
  .empty-notifications i {
    font-size: 2.5rem;
  }
  
  .empty-notifications p {
    font-size: 1rem;
  }
  
  .modal-content {
    width: 95%;
    padding: 1.25rem;
    margin: 1rem;
  }
  
  .modal-content h3 {
    font-size: 1.25rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .cancel-btn,
  .delete-confirm-btn,
  .delete-selected-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .notifications-content {
    padding: 0.5rem;
  }
  
  h1 {
    font-size: 1.25rem;
    gap: 0.5rem;
  }
  
  .notifications-actions {
    padding: 0.5rem;
  }
  
  .filter-btn {
    padding: 0.5rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .filter-badge {
    min-width: 16px;
    height: 16px;
    font-size: 0.7rem;
  }
  
  .notification-card {
    margin-bottom: 0.5rem;
  }
  
  .notification-content {
    padding: 0.75rem 0.5rem;
  }
  
  .notification-header h3 {
    font-size: 0.95rem;
  }
  
  .notification-time {
    font-size: 0.75rem;
  }
  
  .notification-message {
    font-size: 0.85rem;
  }
  
  .modal-content {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .dropdown-item,
  .notification-dropdown-item {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}
</style>

