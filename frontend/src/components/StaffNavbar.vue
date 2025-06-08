<template>
    <nav class="staff-sidebar">
        <div class="sidebar-header">
            <i class="fas fa-store logo-icon"></i>
            <h1>JM Garis Store</h1>
        </div>

        <div class="sidebar-menu">
            <router-link to="/staff" class="menu-item" exact-active-class="active">
                <i class="fas fa-clipboard-list"></i>
                <span>All Orders</span>
            </router-link>
            
            <router-link to="/staff/accepted-orders" class="menu-item" exact-active-class="active">
                <i class="fas fa-tasks"></i>
                <span>Accepted Orders</span>
            </router-link>

            <router-link to="/staff/orders/create" class="menu-item" exact-active-class="active">
                <i class="fas fa-cash-register"></i>
                <span>Create Order</span>
            </router-link>
        </div>

        <div class="sidebar-footer">
            <div class="staff-profile">
                <i class="fas fa-user"></i>
                <span class="staff-name">{{ username }}</span>
            </div>
            <button @click="$emit('logout')" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    </nav>
</template>

<script>
export default {
    name: 'StaffNavbar',
    props: {
        username: {
            type: String,
            default: 'Staff'
        }
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
}

.menu-item i {
    width: 20px;
    text-align: center;
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

.logout-btn:hover {
    background-color: #c0392b;
}

@media (max-width: 768px) {
    .staff-sidebar {
        width: 60px;
    }

    .sidebar-header h1,
    .menu-item span,
    .staff-name,
    .logout-btn span {
        display: none;
    }

    .menu-item {
        justify-content: center;
        padding: 0.75rem;
    }

    .menu-item i {
        width: auto;
        font-size: 1.2rem;
    }

    .staff-profile {
        justify-content: center;
        padding: 0.5rem;
    }

    .logout-btn {
        padding: 0.5rem;
    }
}
</style>