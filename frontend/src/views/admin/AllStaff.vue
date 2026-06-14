<template>
    <div class="admin-container staff-list-container">
      <AdminNavbar 
        :username="username"
        @logout="showLogoutModal = true"
      />
      
      <div class="staff-content">
        <div class="header">
          <h2>TOP STAFF PERFORMANCE</h2>
          <div class="filters">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search by name, email, position..."
              >
            </div>
            <select v-model="periodFilter" class="period-filter" @change="fetchStaffPerformance">
              <option value="overall">Overall</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Period</option>
            </select>
            <div v-if="periodFilter === 'custom'" class="date-filters">
              <input type="date" v-model="customFromDate" @change="fetchStaffPerformance" class="date-input" />
              <input type="date" v-model="customToDate" @change="fetchStaffPerformance" class="date-input" />
            </div>
            <select v-model="statusFilter" class="status-filter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <!-- Download Button -->
            <button @click="downloadStaffReport" class="download-btn" :disabled="loading || loadingPerformance">
              <i class="fas fa-download"></i>
              Download Excel
            </button>
            <!-- Delete Staff Transactions Button -->
            <button @click="showDeleteTransactionsModal = true" class="delete-transactions-btn" :disabled="loading || loadingPerformance">
              <i class="fas fa-trash-alt"></i>
              Delete Transactions
            </button>
            <!-- NEW: Create Staff Account Button -->
            <button @click="goToCreateStaff" class="create-staff-btn">
              <i class="fas fa-user-plus"></i>
              Create Staff Account
            </button>
          </div>
        </div>

        <!-- Performance Summary Cards -->
        <div v-if="loadingPerformance" class="summary-cards">
          <!-- Loading skeleton cards -->
          <div v-for="n in 4" :key="n" class="summary-card skeleton-card">
            <div class="card-icon skeleton-icon">
              <div class="skeleton-circle"></div>
            </div>
            <div class="card-content">
              <div class="skeleton-text skeleton-title"></div>
              <div class="skeleton-text skeleton-value"></div>
            </div>
          </div>
        </div>
        <div v-else-if="performanceSummary" class="summary-cards">
          <div class="summary-card">
            <div class="card-icon total-staff">
              <i class="fas fa-users"></i>
            </div>
            <div class="card-content">
              <h3>Total Staff</h3>
              <div class="count">{{ performanceSummary.totalStaff }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon total-sales">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="card-content">
              <h3>Total Sales</h3>
              <div class="amount">₱{{ formatCurrency(performanceSummary.totalSales) }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon total-orders">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="card-content">
              <h3>Total Orders</h3>
              <div class="count">{{ performanceSummary.totalOrders }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon avg-performance">
              <i class="fas fa-trophy"></i>
            </div>
            <div class="card-content">
              <h3>Avg Performance</h3>
              <div class="count">{{ formatPercentage(performanceSummary.avgPerformanceScore) }}%</div>
            </div>
          </div>
        </div>
  
        <div class="table-container">
          <!-- Loading skeleton for performance data -->
          <div v-if="loadingPerformance" class="loading-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading staff performance data...</span>
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
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
              </div>
              <div v-for="n in 5" :key="n" class="skeleton-row">
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
                <div class="skeleton-cell"></div>
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
          <table v-else-if="filteredStaffPerformance.length">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Staff Name</th>
                <th>Email</th>
                <th>Performance Score</th>
                <th>Total Sales</th>
                <th>Orders Accepted</th>
                <th>Sales Count</th>
                <th>Today Sales</th>
                <th>Week Sales</th>
                <th>Month Sales</th>
                <th>Year Sales</th>
                <th>Acceptance Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="staff in filteredStaffPerformance" :key="staff.user_id">
                <td>
                  <div class="rank-badge" :class="getRankClass(staff.rank)">
                    {{ staff.rank }}
                  </div>
                </td>
                <td>{{ staff.fullname }}</td>
                <td>{{ staff.email }}</td>
                <td>
                  <div class="performance-score">
                    {{ formatPercentage(staff.performance_score) }}%
                    <div class="score-bar">
                      <div class="score-fill" :style="{ width: staff.performance_score + '%' }"></div>
                    </div>
                  </div>
                </td>
                <td class="currency">₱{{ formatCurrency(staff.total_sales) }}</td>
                <td>{{ staff.orders_accepted }}</td>
                <td>{{ staff.total_orders }}</td>
                <td class="currency">₱{{ formatCurrency(staff.today_sales) }}</td>
                <td class="currency">₱{{ formatCurrency(staff.week_sales) }}</td>
                <td class="currency">₱{{ formatCurrency(staff.month_sales) }}</td>
                <td class="currency">₱{{ formatCurrency(staff.year_sales) }}</td>
                <td>
                  <span class="percentage-badge" :class="getAcceptanceRateClass(staff.acceptance_rate)">
                    {{ formatPercentage(staff.acceptance_rate) }}%
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="staff.status">{{ capitalizeFirst(staff.status) }}</span>
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
          
          <!-- No data state -->
          <div v-else-if="!loadingPerformance" class="no-data">
            <i class="fas fa-users"></i>
            <p>No staff performance data found</p>
            <span class="help-text">Try adjusting your filters or check back later</span>
          </div>
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

      <!-- Delete Staff Transactions Modal -->
      <div v-if="showDeleteTransactionsModal" class="modal-overlay">
        <div class="modal-content delete-transactions-modal">
          <h2>Delete Staff Transactions</h2>
          <div class="transaction-delete-form">
            <!-- Staff Selection -->
            <div class="form-group">
              <label for="selectedStaffForDeletion">Select Staff Member:</label>
              <select v-model="selectedStaffForDeletion" id="selectedStaffForDeletion" class="staff-select">
                <option value="">Choose a staff member...</option>
                <option v-for="staff in filteredStaffPerformance" :key="staff.user_id" :value="staff.user_id">
                  {{ staff.fullname }} ({{ staff.position }})
                </option>
              </select>
            </div>

            <!-- Period Selection -->
            <div class="form-group">
              <label for="deletionPeriod">Period:</label>
              <select v-model="deletionPeriod" id="deletionPeriod" class="period-select">
                <option value="overall">Overall (All Time)</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>

            <!-- Custom Date Range (if custom period selected) -->
            <div v-if="deletionPeriod === 'custom'" class="form-group custom-dates">
              <label>Custom Date Range:</label>
              <div class="date-range">
                <input type="date" v-model="deletionFromDate" class="date-input" />
                <span>to</span>
                <input type="date" v-model="deletionToDate" class="date-input" />
              </div>
            </div>

            <!-- Transaction Count Display -->
            <div v-if="selectedStaffForDeletion && transactionCount !== null" class="transaction-info">
              <div class="info-box">
                <i class="fas fa-info-circle"></i>
                <span>{{ transactionCount }} transaction(s) will be deleted for the selected period.</span>
              </div>
            </div>

            <!-- Warning Message -->
            <div class="warning-message">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Warning:</strong> This action will permanently delete all accepted orders/transactions for the selected staff member in the specified period. This action cannot be undone.
            </div>
          </div>

          <div class="modal-buttons">
            <button 
              @click="confirmDeleteTransactions" 
              class="delete-transactions-confirm-btn"
              :disabled="!selectedStaffForDeletion || deletionPeriod === '' || loading"
            >
              <i class="fas fa-trash-alt"></i>
              Delete Transactions
            </button>
            <button @click="closeDeleteTransactionsModal" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Delete Transactions Confirmation Modal -->
      <div v-if="showDeleteTransactionsConfirmModal" class="modal-overlay">
        <div class="modal-content delete-modal">
          <h2>Confirm Transaction Deletion</h2>
          <div class="confirmation-content">
            <i class="fas fa-exclamation-triangle warning-icon"></i>
            <p>{{ deleteConfirmationMessage }}</p>
          </div>
          <div class="modal-buttons">
            <button @click="executeDeleteTransactions" class="delete-btn">
              <i class="fas fa-trash-alt"></i>
              Yes, Delete
            </button>
            <button @click="showDeleteTransactionsConfirmModal = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Delete Transactions Success Modal -->
      <div v-if="showDeleteSuccessModal" class="modal-overlay">
        <div class="modal-content success-modal">
          <h2>Deletion Successful</h2>
          <div class="success-content">
            <i class="fas fa-check-circle success-icon"></i>
            <p>{{ deleteSuccessMessage }}</p>
          </div>
          <div class="modal-buttons">
            <button @click="handleSuccessModalClose" class="success-btn">
              <i class="fas fa-check"></i>
              OK
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
        staffPerformance: [],
        performanceSummary: null,
        searchQuery: '',
        statusFilter: 'all',
        periodFilter: 'overall',
        customFromDate: '',
        customToDate: '',
        loading: false,
        loadingStaff: false,
        loadingPerformance: false,
        showLogoutModal: false,
        showEditModal: false,
        showDeleteModal: false,
        selectedStaff: null,
        // Delete transactions modal data
        showDeleteTransactionsModal: false,
        showDeleteTransactionsConfirmModal: false,
        showDeleteSuccessModal: false,
        deleteConfirmationMessage: '',
        deleteSuccessMessage: '',
        selectedStaffForDeletion: '',
        deletionPeriod: 'overall',
        deletionFromDate: '',
        deletionToDate: '',
        transactionCount: null,
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
      },
      filteredStaffPerformance() {
        return this.staffPerformance.filter(staff => {
          const searchMatch = !this.searchQuery || 
            staff.fullname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            staff.email.toLowerCase().includes(this.searchQuery.toLowerCase());
          
          // Note: Assuming all staff in performance data are active staff
          // You can add status filter logic here if needed
          
          return searchMatch;
        });
      }
    },
    watch: {
      selectedStaffForDeletion() {
        this.fetchTransactionCount();
      },
      deletionPeriod() {
        this.fetchTransactionCount();
      },
      deletionFromDate() {
        if (this.deletionPeriod === 'custom') {
          this.fetchTransactionCount();
        }
      },
      deletionToDate() {
        if (this.deletionPeriod === 'custom') {
          this.fetchTransactionCount();
        }
      }
    },
    methods: {
      capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      
      // NEW: Method to navigate to create staff page
      goToCreateStaff() {
        this.$router.push('/admin/recruit-staff');
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
          const response = await this.$fetch(`/api/admin/staff/${this.selectedStaff.user_id}`, {
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
          const response = await this.$fetch(`/api/admin/staff/${this.selectedStaff.user_id}`, {
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
                this.loadingStaff = true;
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/admin/staff', {
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
            } finally {
                this.loadingStaff = false;
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
      },

      // New methods for staff performance
      async fetchStaffPerformance() {
        try {
          this.loadingPerformance = true;
          const token = localStorage.getItem('token');
          
          let params = new URLSearchParams({
            period: this.periodFilter
          });
          
          if (this.periodFilter === 'custom' && this.customFromDate && this.customToDate) {
            params.append('fromDate', this.customFromDate);
            params.append('toDate', this.customToDate);
          }
          
          const response = await this.$fetch(`/api/admin/staff-performance?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            this.staffPerformance = data.staffPerformance || [];
            this.performanceSummary = data.summary || null;
          } else {
            console.error('Failed to fetch staff performance:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching staff performance:', error);
        } finally {
          this.loadingPerformance = false;
        }
      },

      async downloadStaffReport() {
        try {
          this.loading = true;
          const token = localStorage.getItem('token');
          
          let params = new URLSearchParams({
            period: this.periodFilter,
            type: 'all'
          });
          
          if (this.periodFilter === 'custom' && this.customFromDate && this.customToDate) {
            params.append('fromDate', this.customFromDate);
            params.append('toDate', this.customToDate);
          }
          
          const response = await this.$fetch(`/api/admin/download-staff-reports?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const filename = `staff_performance_${this.periodFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('Staff performance report downloaded successfully');
          } else {
            throw new Error('Download failed');
          }
        } catch (error) {
          console.error('Error downloading staff report:', error);
        } finally {
          this.loading = false;
        }
      },

      // Delete Transactions Methods
      closeDeleteTransactionsModal() {
        this.showDeleteTransactionsModal = false;
        this.showDeleteTransactionsConfirmModal = false;
        this.showDeleteSuccessModal = false;
        this.deleteConfirmationMessage = '';
        this.deleteSuccessMessage = '';
        this.selectedStaffForDeletion = '';
        this.deletionPeriod = 'overall';
        this.deletionFromDate = '';
        this.deletionToDate = '';
        this.transactionCount = null;
      },

      async fetchTransactionCount() {
        if (!this.selectedStaffForDeletion || !this.deletionPeriod) {
          this.transactionCount = null;
          return;
        }

        try {
          const token = localStorage.getItem('token');
          let params = new URLSearchParams({
            staffId: this.selectedStaffForDeletion,
            period: this.deletionPeriod
          });

          if (this.deletionPeriod === 'custom' && this.deletionFromDate && this.deletionToDate) {
            params.append('fromDate', this.deletionFromDate);
            params.append('toDate', this.deletionToDate);
          }

          const response = await this.$fetch(`/api/admin/staff-transaction-count?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            this.transactionCount = data.count || 0;
          } else {
            this.transactionCount = 0;
          }
        } catch (error) {
          console.error('Error fetching transaction count:', error);
          this.transactionCount = 0;
        }
      },

      async confirmDeleteTransactions() {
        if (!this.selectedStaffForDeletion || !this.deletionPeriod) {
          alert('Please select a staff member and period.');
          return;
        }

        this.deleteConfirmationMessage = this.transactionCount > 0 
          ? `Are you sure you want to delete ${this.transactionCount} transaction(s) for the selected staff member? This action cannot be undone.`
          : 'No transactions found for the selected period. Continue anyway?';

        this.showDeleteTransactionsConfirmModal = true;
      },

      handleSuccessModalClose() {
        this.showDeleteSuccessModal = false;
        this.closeDeleteTransactionsModal();
      },

      async executeDeleteTransactions() {
        try {
          this.loading = true;
          this.showDeleteTransactionsConfirmModal = false;
          
          const token = localStorage.getItem('token');
          
          let params = {
            staffId: this.selectedStaffForDeletion,
            period: this.deletionPeriod
          };

          if (this.deletionPeriod === 'custom' && this.deletionFromDate && this.deletionToDate) {
            params.fromDate = this.deletionFromDate;
            params.toDate = this.deletionToDate;
          }

          const response = await this.$fetch('/api/admin/delete-staff-transactions', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
          });

          if (response.ok) {
            const result = await response.json();
            this.deleteSuccessMessage = `Successfully deleted ${result.deletedCount || 0} transaction(s).`;
            this.showDeleteSuccessModal = true;
            // Refresh the staff performance data
            await this.fetchStaffPerformance();
          } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete transactions');
          }
        } catch (error) {
          console.error('Error deleting transactions:', error);
          alert('Error deleting transactions: ' + error.message);
        } finally {
          this.loading = false;
        }
      },

      // Utility methods
      formatCurrency(value) {
        return new Intl.NumberFormat('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value || 0);
      },

      formatPercentage(value) {
        return parseFloat(value || 0).toFixed(1);
      },

      getRankClass(rank) {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return 'rank-default';
      },

      getAcceptanceRateClass(rate) {
        if (rate >= 90) return 'excellent';
        if (rate >= 75) return 'good';
        if (rate >= 60) return 'average';
        return 'poor';
      }
    },
    mounted() {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username || 'Admin';
      }
      this.fetchStaff();
      this.fetchStaffPerformance();
    }
  }
  </script>
  
  <style scoped>
  .staff-list-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    /* padding-left removed - now handled by admin-container global class */
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

/* Delete Transactions Modal Styles */
.delete-transactions-modal {
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.transaction-delete-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.transaction-delete-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-delete-form label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.staff-select, .period-select {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  transition: border-color 0.3s ease;
}

.staff-select:focus, .period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.custom-dates {
  margin-top: 0.5rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-range span {
  color: #64748b;
  font-weight: 500;
}

.transaction-info {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #0369a1;
}

.info-box i {
  font-size: 1.1rem;
  color: #0284c7;
}

.warning-message {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #92400e;
}

.warning-message i {
  font-size: 1.1rem;
  color: #f59e0b;
  margin-top: 0.1rem;
}

.delete-transactions-confirm-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.delete-transactions-confirm-btn:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);
}

.delete-transactions-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

/* Delete Transactions Confirmation Modal Styles */
.confirmation-content {
  text-align: center;
  padding: 1rem 0;
}

.warning-icon {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 1rem;
  display: block;
}

.confirmation-content p {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* Delete Transactions Success Modal Styles */
.success-modal {
  max-width: 450px;
  text-align: center;
}

.success-content {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  font-size: 3rem;
  color: #059669;
  margin-bottom: 1rem;
  display: block;
}

.success-content p {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.success-btn {
  background-color: #059669;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin: 0 auto;
}

.success-btn:hover {
  background-color: #047857;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
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

  /* NEW: Create Staff Button Styles */
  .create-staff-btn {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .create-staff-btn:hover {
    background-color: #219a52;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
  }

  .create-staff-btn i {
    font-size: 0.9rem;
  }

  /* Delete Transactions Button Styles */
  .delete-transactions-btn {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .delete-transactions-btn:hover:not(:disabled) {
    background-color: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  }

  .delete-transactions-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .delete-transactions-btn i {
    font-size: 0.9rem;
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

  /* Performance-specific styles */
  .period-filter,
  .date-input {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    background-color: white;
  }

  .date-filters {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .download-btn {
    background-color: #059669;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .download-btn:hover:not(:disabled) {
    background-color: #047857;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
  }

  .download-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Summary cards */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .summary-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: white;
  }

  .total-staff .card-icon {
    background-color: #3b82f6;
  }

  .total-sales .card-icon {
    background-color: #059669;
  }

  .total-orders .card-icon {
    background-color: #8b5cf6;
  }

  .avg-performance .card-icon {
    background-color: #f59e0b;
  }

  .card-content h3 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-content .amount,
  .card-content .count {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  /* Rank badges */
  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-weight: bold;
    font-size: 0.875rem;
  }

  .rank-gold {
    background-color: #ffd700;
    color: #8b4513;
  }

  .rank-silver {
    background-color: #c0c0c0;
    color: #2c3e50;
  }

  .rank-bronze {
    background-color: #cd7f32;
    color: white;
  }

  .rank-default {
    background-color: #e2e8f0;
    color: #64748b;
  }

  /* Performance score */
  .performance-score {
    text-align: center;
  }

  .score-bar {
    width: 60px;
    height: 6px;
    background-color: #e2e8f0;
    border-radius: 3px;
    margin: 0.25rem auto 0;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #059669 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  /* Percentage badges */
  .percentage-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .percentage-badge.excellent {
    background-color: #dcfce7;
    color: #059669;
  }

  .percentage-badge.good {
    background-color: #dbeafe;
    color: #2563eb;
  }

  .percentage-badge.average {
    background-color: #fef3c7;
    color: #d97706;
  }

  .percentage-badge.poor {
    background-color: #fee2e2;
    color: #dc2626;
  }

  /* Currency formatting */
  .currency {
    text-align: right;
    font-family: 'Monaco', monospace;
    font-weight: 500;
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
  .skeleton-cell:nth-child(1) { flex: 0.5; } /* Rank */
  .skeleton-cell:nth-child(2) { flex: 1.5; } /* Staff Name */
  .skeleton-cell:nth-child(3) { flex: 1.5; } /* Email */
  .skeleton-cell:nth-child(4) { flex: 1; } /* Performance Score */
  .skeleton-cell:nth-child(5) { flex: 1; } /* Total Sales */
  .skeleton-cell:nth-child(6) { flex: 1; } /* Orders Accepted */
  .skeleton-cell:nth-child(7) { flex: 1; } /* Sales Count */
  .skeleton-cell:nth-child(8) { flex: 1; } /* Today Sales */
  .skeleton-cell:nth-child(9) { flex: 1; } /* Week Sales */
  .skeleton-cell:nth-child(10) { flex: 1; } /* Month Sales */
  .skeleton-cell:nth-child(11) { flex: 1; } /* Year Sales */
  .skeleton-cell:nth-child(12) { flex: 1; } /* Acceptance Rate */
  .skeleton-cell:nth-child(13) { flex: 0.8; } /* Status */
  .skeleton-cell:nth-child(14) { flex: 1.2; } /* Actions */

  /* Summary card skeleton styles */
  .skeleton-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .skeleton-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
  }

  .skeleton-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  .skeleton-text {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  .skeleton-title {
    height: 0.875rem;
    width: 60%;
    margin-bottom: 0.5rem;
  }

  .skeleton-value {
    height: 1.5rem;
    width: 80%;
  }

  .no-data {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
    font-size: 1rem;
  }

  .no-data i {
    font-size: 3rem;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .no-data p {
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
  
  @media (max-width: 768px) {
    /* padding-left removed - now handled by admin-container global class */
    
    .header {
      padding: 1rem;
    }
    
    .filters {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .status-filter {
      width: 100%;
    }

    .create-staff-btn {
      width: 100%;
      justify-content: center;
    }

    .delete-transactions-btn {
      width: 100%;
      justify-content: center;
    }
  }
  </style>

