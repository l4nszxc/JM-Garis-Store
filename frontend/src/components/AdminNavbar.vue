<template>
  <div>
    <div class="toggle-button" @click="toggleSidebar">
      <i class="fas fa-bars"></i>
    </div>
    
    <nav class="admin-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <i class="fas fa-leaf logo-icon"></i>
        <h1>JM Garis Store/Admin</h1>
      </div>
      
      <div class="sidebar-menu">
        <router-link to="/admin" class="menu-item" exact-active-class="active">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </router-link>

        <router-link to="/admin/orders" class="menu-item" exact-active-class="active">
          <i class="fas fa-shopping-cart"></i>
          <span>All Orders</span>
        </router-link>

        <router-link to="/admin/users" class="menu-item" active-class="active">
          <i class="fas fa-users"></i>
          <span>Users</span>
        </router-link>

        <router-link to="/admin/staff" class="menu-item" active-class="active">
          <i class="fas fa-id-card"></i>
          <span>Staff</span>
        </router-link>
        
        <router-link to="/admin/products" class="menu-item" active-class="active">
          <i class="fas fa-boxes"></i>
          <span>Manage Products</span>
        </router-link>
        
        <router-link to="/admin/low-stock" class="menu-item" active-class="active">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Low Stock</span>
        </router-link>

        <router-link to="/admin/insert-products" class="menu-item" active-class="active">
          <i class="fas fa-box"></i>
          <span>Insert Products</span>
        </router-link>

        <router-link to="/admin/forecast" class="menu-item" active-class="active">
          <i class="fas fa-chart-bar"></i>
          <span>Sales Forecast</span>
        </router-link>

        <router-link to="/admin/recruit-staff" class="menu-item" active-class="active">
          <i class="fas fa-user-plus"></i>
          <span>Recruit Staff</span>
        </router-link>
        
        <router-link to="/admin/rewards" class="menu-item" active-class="active">
          <i class="fas fa-gift"></i>
          <span>Rewards Management</span>
        </router-link>
      </div>

      <div class="sidebar-footer">
        <div class="admin-profile">
          <i class="fas fa-user-shield"></i>
          <span class="admin-name">{{ username }}</span>
        </div>
        
        <button @click="$emit('logout')" class="logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </nav>
    
    <div 
      v-if="showOverlay" 
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>
  
<script>
export default {
  name: 'AdminNavbar',
  props: {
    username: {
      type: String,
      default: 'Admin'
    }
  },
  data() {
    return {
      isSidebarCollapsed: window.innerWidth <= 768,
      showOverlay: false
    }
  },
  methods: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      this.updateOverlay();
      // Emit event to notify parent components
      this.$emit('sidebar-toggle', this.isSidebarCollapsed);
      // Add a body class to control the main container padding
      document.body.classList.toggle('sidebar-collapsed', this.isSidebarCollapsed);
    },
    closeSidebar() {
      if (window.innerWidth <= 768) {
        this.isSidebarCollapsed = true;
        this.showOverlay = false;
        // Emit event when sidebar is closed
        this.$emit('sidebar-toggle', true);
        document.body.classList.add('sidebar-collapsed');
      }
    },
    updateOverlay() {
      // Only show overlay on mobile when sidebar is expanded
      this.showOverlay = window.innerWidth <= 768 && !this.isSidebarCollapsed;
    },
    handleResize() {
      const wasSidebarCollapsed = this.isSidebarCollapsed;
      if (window.innerWidth <= 768) {
        this.isSidebarCollapsed = true;
        this.showOverlay = false;
      }
      // Only emit event if state changed
      if (wasSidebarCollapsed !== this.isSidebarCollapsed) {
        this.$emit('sidebar-toggle', this.isSidebarCollapsed);
        document.body.classList.toggle('sidebar-collapsed', this.isSidebarCollapsed);
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
    // Set initial body class
    document.body.classList.toggle('sidebar-collapsed', this.isSidebarCollapsed);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    // Clean up body class when component is removed
    document.body.classList.remove('sidebar-collapsed');
  }
}
</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.admin-sidebar.collapsed {
  width: 60px;
  transform: translateX(-200px);
}

.toggle-button {
  position: fixed;
  top: 15px;
  left: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.toggle-button:hover {
  background-color: #3d5368;
  transform: scale(1.05);
}

.sidebar-header {
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.sidebar-header h1 {
  margin: 0.5rem 0 0;
  font-size: 1.2rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo-icon {
  font-size: 2rem;
  color: #4CAF50;
}

.sidebar-menu {
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  color: #a0aec0;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}

.menu-item i {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.menu-item span {
  transition: opacity 0.2s ease;
}

.menu-item:hover, .menu-item.active {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.admin-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.logout-btn span {
  transition: opacity 0.2s ease;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }
  
  .admin-sidebar.collapsed {
    width: 250px;
    transform: translateX(-100%);
  }
  
  .admin-sidebar:not(.collapsed) {
    transform: translateX(0);
    width: 250px;
  }
  
  .toggle-button {
    left: 15px;
    background-color: #2c3e50;
  }
}

/* When sidebar is collapsed */
.admin-sidebar.collapsed .sidebar-header h1,
.admin-sidebar.collapsed .menu-item span,
.admin-sidebar.collapsed .admin-name,
.admin-sidebar.collapsed .logout-btn span {
  opacity: 0;
}

.admin-sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 0.75rem;
}

.admin-sidebar.collapsed .menu-item i {
  width: auto;
  font-size: 1.2rem;
}

.admin-sidebar.collapsed .admin-profile {
  justify-content: center;
}

.admin-sidebar.collapsed .logout-btn {
  padding: 0.5rem;
  justify-content: center;
}
</style>