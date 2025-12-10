<template>
  <div class="admin-container users-list-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="users-content">
      <div class="header">
        <div class="header-top">
          <h2>ALL USERS</h2>
          <div class="user-counts">
            <div class="count-item verified-count">
              <i class="fas fa-user-check"></i>
              <span class="count-label">Verified:</span>
              <span class="count-value">{{ verifiedCount }}</span>
            </div>
            <div class="count-item unverified-count">
              <i class="fas fa-user-times"></i>
              <span class="count-label">Unverified:</span>
              <span class="count-value">{{ unverifiedCount }}</span>
            </div>
            <div class="count-item total-count">
              <i class="fas fa-users"></i>
              <span class="count-label">Total:</span>
              <span class="count-value">{{ users.length }}</span>
            </div>
          </div>
        </div>
        <div class="filters">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by name, username, email, gender, phone, address..."
            >
          </div>
          <select v-model="statusFilter" class="status-filter">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <!-- Loading skeleton -->
        <div v-if="isLoadingUsers" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading users data...</span>
          </div>
          <!-- Skeleton table -->
          <div class="skeleton-table">
            <div class="skeleton-header">
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
            </div>
            <div v-for="n in 6" :key="n" class="skeleton-row">
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
              <div class="skeleton-cell"></div>
            </div>
          </div>
        </div>
        
        <!-- Actual data table -->
        <table v-else-if="filteredUsers.length">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Contact Info</th>
              <th>Address</th>
              <th>Birthdate</th>
              <th>Registration Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.username }}</td>
              <td>
                {{ formatFullName(user.firstname, user.middlename, user.lastname) }}
              </td>
              <td>{{ capitalizeFirst(user.gender) }}</td>
              <td>
                <div class="contact-info">
                  <div>{{ user.email }}</div>
                  <div>{{ formatPhoneNumber(user.phone_number) }}</div>
                </div>
              </td>
              <td>{{ user.address }}</td>
              <td>{{ formatDate(user.birthdate, 'short') }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(user)]">
                  {{ user.email_verified ? 'Verified' : 'Unverified' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- No data state -->
        <div v-else-if="!isLoadingUsers" class="no-results">
          <i class="fas fa-users"></i>
          <p>No users found matching your search criteria</p>
          <span class="help-text">Try adjusting your search filters</span>
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
import AdminNavbar from '../../components/AdminNavbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'

export default {
  name: 'UsersList',
  components: {
      AdminNavbar,
      LogoutModal
  },
  data() {
      return {
          username: '',
          users: [],
          searchQuery: '',
          statusFilter: 'all',
          showLogoutModal: false,
          isLoadingUsers: false
      }
  },
  computed: {
  filteredUsers() {
    return this.users.filter(user => {
      const searchTerms = this.searchQuery.toLowerCase();
      const matchesSearch = !this.searchQuery || 
        // Basic info
        user.username?.toLowerCase().includes(searchTerms) ||
        user.email?.toLowerCase().includes(searchTerms) ||
        
        // Full name search
        this.formatFullName(user.firstname, user.middlename, user.lastname).toLowerCase().includes(searchTerms) ||
        user.firstname?.toLowerCase().includes(searchTerms) ||
        user.middlename?.toLowerCase().includes(searchTerms) ||
        user.lastname?.toLowerCase().includes(searchTerms) ||
        
        // Additional fields
        user.gender?.toLowerCase().includes(searchTerms) ||
        user.phone_number?.toLowerCase().includes(searchTerms) ||
        user.address?.toLowerCase().includes(searchTerms) ||
        user.birthdate?.includes(searchTerms);

      // Status filter
      const matchesStatus = this.statusFilter === 'all' || 
        (this.statusFilter === 'verified' && user.email_verified) ||
        (this.statusFilter === 'unverified' && !user.email_verified);

      return matchesSearch && matchesStatus;
    });
  },
  verifiedCount() {
    return this.users.filter(user => user.email_verified).length;
  },
  unverifiedCount() {
    return this.users.filter(user => !user.email_verified).length;
  }
},
    methods: {
      formatPhoneNumber(phone) {
        if (!phone) return '';
        // Add your phone formatting logic here
        return phone;
      },
      formatFullName(firstname, middlename, lastname) {
        const middle = middlename ? ` ${middlename} ` : ' ';
        return firstname && lastname 
            ? `${firstname}${middle}${lastname}`
            : 'N/A';
     },
     capitalizeFirst(str) {
        if (!str) return 'N/A';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
     },
    
      formatDate(date, format = 'full') {
        if (!date) return '';
        const options = format === 'short' 
          ? { year: 'numeric', month: 'short', day: 'numeric' }
          : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleDateString('en-US', options);
      },
      getStatusClass(user) {
        return user.email_verified ? 'verified' : 'unverified';
      },
    async fetchUsers() {
      try {
        this.isLoadingUsers = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.users = data.map(user => ({
            ...user,
            email_verified: Boolean(user.email_verified)
          }));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        this.isLoadingUsers = false;
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
          console.error('Logout failed:', error);
      } finally {
          this.showLogoutModal = false;
      }
  }
    },
    mounted() {
      const token = localStorage.getItem('token')
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        this.username = decoded.username || 'Admin'
      }
      this.fetchUsers()
    }
  }
  </script>
  
  <style scoped>
.users-list-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  /* padding-left removed - now handled by admin-container global class */
}

.users-content {
  padding: 2rem;
  margin: 0 auto;
}

/* Header and Filters */
.header {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
}

.user-counts {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.count-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
}

.count-item i {
  font-size: 1.1rem;
}

.count-label {
  font-weight: 500;
  color: #64748b;
}

.count-value {
  font-weight: 700;
  font-size: 1.1rem;
}

.verified-count {
  background-color: #dcfce7;
  color: #166534;
}

.verified-count .count-value {
  color: #166534;
}

.unverified-count {
  background-color: #fee2e2;
  color: #dc2626;
}

.unverified-count .count-value {
  color: #dc2626;
}

.total-count {
  background-color: #e0f2fe;
  color: #0369a1;
}

.total-count .count-value {
  color: #0369a1;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.search-box {
  flex: 1;
}
.search-box input {
  width: 98%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.status-filter {
  width: 20%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.status-filter {
  background-color: white;
  cursor: pointer;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: auto;
  max-height: calc(100vh - 200px);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 1rem;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.95rem;
}

/* Status Badge */
.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
}

.verified {
  background-color: #dcfce7;
  color: #166534;
}

.unverified {
  background-color: #fee2e2;
  color: #dc2626;
}

/* Loading styles */
.loading-container {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  color: #3b82f6;
  font-size: 1rem;
  font-weight: 500;
}

.loading-spinner i {
  font-size: 1.5rem;
}

.skeleton-table {
  width: 100%;
  border-collapse: collapse;
}

.skeleton-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.skeleton-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.skeleton-cell {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-header .skeleton-cell {
  height: 1.25rem;
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
  background-size: 200% 100%;
}

/* Skeleton cells for different columns */
.skeleton-cell:nth-child(1) { flex: 1; } /* Username */
.skeleton-cell:nth-child(2) { flex: 1.5; } /* Full Name */
.skeleton-cell:nth-child(3) { flex: 0.8; } /* Gender */
.skeleton-cell:nth-child(4) { flex: 1.7; } /* Contact Info */
.skeleton-cell:nth-child(5) { flex: 2; } /* Address */
.skeleton-cell:nth-child(6) { flex: 1; } /* Birthdate */
.skeleton-cell:nth-child(7) { flex: 1.2; } /* Registration Date */
.skeleton-cell:nth-child(8) { flex: 0.8; } /* Status */

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 1rem;
}

.no-results i {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.no-results p {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Table Column Widths for Desktop */
@media (min-width: 1024px) {
  table th:nth-child(1), table td:nth-child(1) { width: 10%; }
  table th:nth-child(2), table td:nth-child(2) { width: 15%; }
  table th:nth-child(3), table td:nth-child(3) { width: 8%; }
  table th:nth-child(4), table td:nth-child(4) { width: 17%; }
  table th:nth-child(5), table td:nth-child(5) { width: 20%; }
  table th:nth-child(6), table td:nth-child(6) { width: 10%; }
  table th:nth-child(7), table td:nth-child(7) { width: 12%; }
  table th:nth-child(8), table td:nth-child(8) { width: 8%; }
}

/* Responsive Breakpoints */
@media (max-width: 1200px) {
  .users-content {
    padding: 1.5rem;
  }
  
  td, th {
    padding: 0.75rem;
  }
}

@media (max-width: 1024px) {
  .filters {
    flex-direction: column;
  }

  .search-box,
  .status-filter {
    width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    min-width: 900px;
  }
}

@media (max-width: 768px) {
  /* padding-left removed - now handled by admin-container global class */

  .header {
    padding: 1rem;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-counts {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .count-item {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .count-item i {
    font-size: 1rem;
  }

  .count-value {
    font-size: 1rem;
  }

  .header h2 {
    font-size: 1.25rem;
  }

  .contact-info {
    font-size: 0.9rem;
  }

  .status-badge {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .users-content {
    padding: 1rem;
  }

  .header {
    margin-bottom: 1rem;
  }

  .table-container {
    border-radius: 8px;
  }

  th {
    font-size: 0.8rem;
  }

  td {
    font-size: 0.85rem;
  }
}

/* Hover States and Interactions */
.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

tbody tr:hover {
  background-color: #f8fafc;
}

/* No Results Message */
.no-results {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
}
</style>

