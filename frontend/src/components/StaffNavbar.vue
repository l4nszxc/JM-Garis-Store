<template>
    <div>
        <div class="toggle-button" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
        </div>
        
        <nav class="staff-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
            <div class="sidebar-header">
                <i class="fas fa-store logo-icon"></i>
                <h1>JM Garis Store</h1>
            </div>

            <div class="sidebar-menu">
                <router-link to="/staff" class="menu-item" exact-active-class="active">
                    <div class="icon-container all-orders-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <span>All Orders</span>
                </router-link>
                
                <router-link to="/staff/accepted-orders" class="menu-item" exact-active-class="active">
                    <div class="icon-container accepted-orders-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <span>Accepted Orders</span>
                </router-link>

                <router-link to="/staff/orders/create" class="menu-item" exact-active-class="active">
                    <div class="icon-container create-order-icon">
                        <i class="fas fa-cash-register"></i>
                    </div>
                    <span>Create Order</span>
                </router-link>

                <router-link to="/staff/analytics" class="menu-item" exact-active-class="active">
                    <div class="icon-container analytics-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <span>Analytics</span>
                </router-link>

                <router-link to="/staff/profile" class="menu-item" exact-active-class="active">
                    <div class="icon-container profile-management-icon">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <span>Profile</span>
                </router-link>
            </div>

            <div class="sidebar-footer">
                <div class="staff-profile">
                    <div class="icon-container profile-icon">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="staff-name">{{ username }}</span>
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
    name: 'StaffNavbar',
    props: {
        username: {
            type: String,
            default: 'Staff'
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
            this.$emit('sidebar-toggle', this.isSidebarCollapsed);
        },
        closeSidebar() {
            if (window.innerWidth <= 768) {
                this.isSidebarCollapsed = true;
                this.showOverlay = false;
                this.$emit('sidebar-toggle', true);
            }
        },
        updateOverlay() {
            this.showOverlay = window.innerWidth <= 768 && !this.isSidebarCollapsed;
        },
        handleResize() {
            const wasSidebarCollapsed = this.isSidebarCollapsed;
            if (window.innerWidth <= 768) {
                this.isSidebarCollapsed = true;
                this.showOverlay = false;
            }
            if (wasSidebarCollapsed !== this.isSidebarCollapsed) {
                this.$emit('sidebar-toggle', this.isSidebarCollapsed);
            }
        }
    },
    mounted() {
        window.addEventListener('resize', this.handleResize);
        this.$emit('sidebar-toggle', this.isSidebarCollapsed);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
}
</script>

<style scoped>
.staff-sidebar {
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

.staff-sidebar.collapsed {
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

.icon-container {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s;
}

.menu-item:hover .icon-container {
    transform: scale(1.1);
}

.all-orders-icon {
    background-color: #3498db;
    color: white;
}

.accepted-orders-icon {
    background-color: #2ecc71;
    color: white;
}

.create-order-icon {
    background-color: #f39c12;
    color: white;
}

.analytics-icon {
    background-color: #9b59b6;
    color: white;
}

.profile-management-icon {
    background-color: #8e44ad;
    color: white;
}

.profile-icon {
    background-color: #9b59b6;
    color: white;
}

.menu-item i {
    text-align: center;
    font-size: 0.95rem;
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

.staff-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
}

.staff-name {
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

@media (max-width: 768px) {
    .staff-sidebar {
        transform: translateX(-100%);
    }
    
    .staff-sidebar.collapsed {
        width: 250px;
        transform: translateX(-100%);
    }
    
    .staff-sidebar:not(.collapsed) {
        transform: translateX(0);
        width: 250px;
    }
    
    .toggle-button {
        left: 15px;
        background-color: #2c3e50;
    }
}

.staff-sidebar.collapsed .sidebar-header h1,
.staff-sidebar.collapsed .menu-item span,
.staff-sidebar.collapsed .staff-name,
.staff-sidebar.collapsed .logout-btn span {
    opacity: 0;
}

.staff-sidebar.collapsed .menu-item {
    justify-content: center;
    padding: 0.75rem;
}

.staff-sidebar.collapsed .menu-item .icon-container {
    margin: 0 auto;
}

.staff-sidebar.collapsed .staff-profile {
    justify-content: center;
}

.staff-sidebar.collapsed .logout-btn {
    padding: 0.5rem;
    justify-content: center;
}
</style>


