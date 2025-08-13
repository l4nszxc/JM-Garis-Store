<template>
  <div class="users-list-container">
    <AdminNavbar 
      :username="username"
      @logout="showLogoutModal = true"
    />
    
    <div class="users-content">
      <div class="header">
        <h2>ALL USERS</h2>
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
    <table>
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
    <div v-if="filteredUsers.length === 0" class="no-results">
      No users found matching your search criteria
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
          showLogoutModal: false
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
  padding-left: 250px;
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

.header h2 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
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
  .users-list-container {
    padding-left: 60px;
  }

  .header {
    padding: 1rem;
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

