<template>
    <div class="staff-list-container">
      <AdminNavbar 
        :username="username"
        @logout="showLogoutModal = true"
      />
      
      <div class="staff-content">
        <div class="header">
          <h2>ALL STAFF</h2>
          <div class="filters">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search by name, email, position..."
              >
            </div>
            <select v-model="statusFilter" class="status-filter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                <th>Civil Status</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="staff in filteredStaff" :key="staff.user_id">
                <td>{{ staff.username }}</td>
                <td>{{ staff.fullname }}</td>
                <td>{{ capitalizeFirst(staff.gender) }}</td>
                <td>{{ capitalizeFirst(staff.civil_status) }}</td>
                <td>{{ staff.phone_number }}</td>
                <td>{{ staff.email }}</td>
                <td>{{ staff.address }}</td>
                <td>
                  <span :class="['status-badge', staff.status.toLowerCase()]">
                    {{ staff.status }}
                  </span>
                </td>
                <td>
                  <button class="action-btn edit" @click="editStaff(staff)">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button class="action-btn delete" @click="deleteStaff(staff)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
       <!-- Add Edit Modal -->
      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Edit Staff Information</h2>
          <form @submit.prevent="handleEditSubmit" class="edit-form">
            <div class="form-group">
              <label for="edit-username">Username</label>
              <input type="text" id="edit-username" v-model="editFormData.username" required />
            </div>
            <div class="form-group">
              <label for="edit-firstname">First Name</label>
              <input type="text" id="edit-firstname" v-model="editFormData.firstname" required />
            </div>
            <div class="form-group">
              <label for="edit-middlename">Middle Name</label>
              <input type="text" id="edit-middlename" v-model="editFormData.middlename" />
            </div>
            <div class="form-group">
              <label for="edit-lastname">Last Name</label>
              <input type="text" id="edit-lastname" v-model="editFormData.lastname" required />
            </div>
            <div class="form-group">
              <label for="edit-gender">Gender</label>
              <select id="edit-gender" v-model="editFormData.gender" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-civilStatus">Civil Status</label>
              <select id="edit-civilStatus" v-model="editFormData.civilStatus" required>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-phone">Phone Number</label>
              <input type="tel" id="edit-phone" v-model="editFormData.phoneNumber" required />
            </div>
            <div class="form-group">
              <label for="edit-address">Address</label>
              <textarea id="edit-address" v-model="editFormData.address" required></textarea>
            </div>
            <div class="form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" v-model="editFormData.email" required />
            </div>
            <div class="modal-buttons">
              <button type="submit" class="save-btn">Save Changes</button>
              <button type="button" @click="showEditModal = false" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-content delete-modal">
          <h2>Confirm Delete</h2>
          <p>Are you sure you want to delete this staff member?</p>
          <div class="modal-buttons">
            <button @click="confirmDelete" class="delete-btn">Yes, Delete</button>
            <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
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
    name: 'AllStaff',
    components: {
      AdminNavbar,
      LogoutModal
    },
    data() {
      return {
        username: '',
        staff: [],
        searchQuery: '',
        statusFilter: 'all',
        showLogoutModal: false,
        showEditModal: false,
        showDeleteModal: false,
        selectedStaff: null,
        editFormData: {
          username: '',
          firstname: '',
          middlename: '',
          lastname: '',
          gender: '',
          civilStatus: '',
          phoneNumber: '',
          address: '',
          email: '',
        }
      }
    },
    computed: {
      filteredStaff() {
        return this.staff.filter(staff => {
          const searchMatch = !this.searchQuery || 
            staff.fullname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            staff.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            staff.position.toLowerCase().includes(this.searchQuery.toLowerCase());
          
          const statusMatch = this.statusFilter === 'all' || 
            staff.status.toLowerCase() === this.statusFilter;
          
          return searchMatch && statusMatch;
        });
      }
    },
    methods: {
      capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      editStaff(staff) {
        this.selectedStaff = staff;
        // Properly populate edit form data
        this.editFormData = {
          username: staff.username,
          firstname: staff.firstname,
          middlename: staff.middlename,
          lastname: staff.lastname,
          gender: staff.gender,
          civilStatus: staff.civil_status,
          phoneNumber: staff.phone_number,
          address: staff.address,
          email: staff.email
        };
        this.showEditModal = true;
      },

      async handleEditSubmit() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:7904/api/admin/staff/${this.selectedStaff.user_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(this.editFormData)
          });

          if (response.ok) {
            this.showEditModal = false;
            await this.fetchStaff(); // Refresh staff list
          } else {
            throw new Error('Failed to update staff');
          }
        } catch (error) {
          console.error('Error updating staff:', error);
        }
      },

      deleteStaff(staff) {
        this.selectedStaff = staff;
        this.showDeleteModal = true;
      },

      async confirmDelete() {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:7904/api/admin/staff/${this.selectedStaff.user_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            this.showDeleteModal = false;
            await this.fetchStaff(); // Refresh staff list
          } else {
            throw new Error('Failed to delete staff');
          }
        } catch (error) {
          console.error('Error deleting staff:', error);
        }
      },
        async fetchStaff() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/admin/staff', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.staff = data;
                    console.log('Fetched staff:', this.staff); // For debugging
                } else {
                    console.error('Failed to fetch staff:', await response.text());
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        },
        async handleLogout() {
          try {
              const token = localStorage.getItem('token');
              const response = await fetch('http://localhost:7904/api/users/logout', {
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
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Admin';
      }
      this.fetchStaff();
    }
  }
  </script>
  
  <style scoped>
  .staff-list-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
  }
  
  .staff-content {
    padding: 2rem;
    margin: 0 auto;
  }
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
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #45a049;
}

.delete-modal {
  max-width: 400px;
  text-align: center;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #c82333;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}
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
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
  }
  
  .status-filter {
    width: 20%;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
  }
  
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
.search-box input {
  width: 98%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
  .status-badge {
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .active {
    background-color: #dcfce7;
    color: #166534;
  }
  
  .inactive {
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    margin-right: 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  tbody tr:hover {
  background-color: #f8fafc;
}
  .edit {
    background-color: #3b82f6;
    color: white;
  }
  
  .delete {
    background-color: #ef4444;
    color: white;
  }
  
  .edit:hover {
    background-color: #2563eb;
  }
  
  .delete:hover {
    background-color: #dc2626;
  }
  
  @media (max-width: 768px) {
    .staff-list-container {
      padding-left: 60px;
    }
    
    .header {
      padding: 1rem;
    }
    
    .filters {
      flex-direction: column;
    }
    
    .status-filter {
      width: 100%;
    }
  }
  </style>