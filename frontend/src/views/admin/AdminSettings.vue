<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="admin-content">
            <h1><i class="fas fa-cog"></i> Admin Settings</h1>

            <!-- Change Password Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-lock"></i> Change Password</h2>
                    </div>
                </div>

                <form @submit.prevent="changePassword" class="password-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Current Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showCurrentPassword ? 'text' : 'password'"
                                    v-model="passwordData.currentPassword"
                                    placeholder="Enter current password"
                                    required
                                    class="password-input"
                                />
                                <button 
                                    type="button" 
                                    @click="showCurrentPassword = !showCurrentPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> New Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showNewPassword ? 'text' : 'password'"
                                    v-model="passwordData.newPassword"
                                    placeholder="Enter new password"
                                    required
                                    class="password-input"
                                    @input="validatePassword"
                                />
                                <button 
                                    type="button" 
                                    @click="showNewPassword = !showNewPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                            <div v-if="passwordValidation.show" class="password-requirements">
                                <div :class="['requirement', { 'valid': passwordValidation.length }]">
                                    <i :class="passwordValidation.length ? 'fas fa-check' : 'fas fa-times'"></i>
                                    At least 8 characters
                                </div>
                                <div :class="['requirement', { 'valid': passwordValidation.number }]">
                                    <i :class="passwordValidation.number ? 'fas fa-check' : 'fas fa-times'"></i>
                                    Contains at least one number
                                </div>
                                <div :class="['requirement', { 'valid': passwordValidation.letter }]">
                                    <i :class="passwordValidation.letter ? 'fas fa-check' : 'fas fa-times'"></i>
                                    Contains at least one letter
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Confirm New Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    v-model="passwordData.confirmPassword"
                                    placeholder="Confirm new password"
                                    required
                                    class="password-input"
                                />
                                <button 
                                    type="button" 
                                    @click="showConfirmPassword = !showConfirmPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                            <div v-if="passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword" class="password-error">
                                <i class="fas fa-times"></i> Passwords do not match
                            </div>
                        </div>
                    </div>

                    <div class="password-actions">
                        <button 
                            type="submit" 
                            class="password-btn"
                            :disabled="!isPasswordValid || isChangingPassword"
                        >
                            <i :class="isChangingPassword ? 'fas fa-spinner fa-spin' : 'fas fa-shield-alt'"></i>
                            {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- Add New Admin Section -->
            <div class="settings-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-user-plus"></i> Add New Admin</h2>
                    </div>
                </div>

                <form @submit.prevent="addAdmin" class="admin-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Username</label>
                            <input
                                type="text"
                                v-model="newAdminData.username"
                                placeholder="Enter username"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input
                                type="email"
                                v-model="newAdminData.email"
                                placeholder="Enter email address"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> First Name</label>
                            <input
                                type="text"
                                v-model="newAdminData.firstname"
                                placeholder="Enter first name"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> Last Name</label>
                            <input
                                type="text"
                                v-model="newAdminData.lastname"
                                placeholder="Enter last name"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showNewAdminPassword ? 'text' : 'password'"
                                    v-model="newAdminData.password"
                                    placeholder="Enter password"
                                    required
                                    class="password-input"
                                    @input="validateNewAdminPassword"
                                />
                                <button 
                                    type="button" 
                                    @click="showNewAdminPassword = !showNewAdminPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showNewAdminPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                            <div v-if="newAdminPasswordValidation.show" class="password-requirements">
                                <div :class="['requirement', { 'valid': newAdminPasswordValidation.length }]">
                                    <i :class="newAdminPasswordValidation.length ? 'fas fa-check' : 'fas fa-times'"></i>
                                    At least 8 characters
                                </div>
                                <div :class="['requirement', { 'valid': newAdminPasswordValidation.number }]">
                                    <i :class="newAdminPasswordValidation.number ? 'fas fa-check' : 'fas fa-times'"></i>
                                    Contains at least one number
                                </div>
                                <div :class="['requirement', { 'valid': newAdminPasswordValidation.letter }]">
                                    <i :class="newAdminPasswordValidation.letter ? 'fas fa-check' : 'fas fa-times'"></i>
                                    Contains at least one letter
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Confirm Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showNewAdminConfirmPassword ? 'text' : 'password'"
                                    v-model="newAdminData.confirmPassword"
                                    placeholder="Confirm password"
                                    required
                                    class="password-input"
                                />
                                <button 
                                    type="button" 
                                    @click="showNewAdminConfirmPassword = !showNewAdminConfirmPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showNewAdminConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                </button>
                            </div>
                            <div v-if="newAdminData.confirmPassword && newAdminData.password !== newAdminData.confirmPassword" class="password-error">
                                <i class="fas fa-times"></i> Passwords do not match
                            </div>
                        </div>
                    </div>

                    <div class="admin-actions">
                        <button 
                            type="submit" 
                            class="admin-btn"
                            :disabled="!isNewAdminValid || isAddingAdmin"
                        >
                            <i :class="isAddingAdmin ? 'fas fa-spinner fa-spin' : 'fas fa-user-plus'"></i>
                            {{ isAddingAdmin ? 'Creating...' : 'Create Admin Account' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            <i :class="notification.icon"></i>
            {{ notification.message }}
        </div>

        <!-- Logout Modal -->
        <div v-if="showLogoutModal" class="modal-overlay">
            <div class="logout-modal">
                <h2>Confirm Logout</h2>
                <p>Are you sure you want to logout?</p>
                <div class="modal-buttons">
                    <button @click="handleLogout" class="confirm-btn">Yes, Logout</button>
                    <button @click="showLogoutModal = false" class="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue'

export default {
    name: 'AdminSettings',
    components: {
        AdminNavbar
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            isChangingPassword: false,
            isAddingAdmin: false,
            
            // Password visibility toggles
            showCurrentPassword: false,
            showNewPassword: false,
            showConfirmPassword: false,
            showNewAdminPassword: false,
            showNewAdminConfirmPassword: false,
            
            // Password change data
            passwordData: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            
            // New admin data
            newAdminData: {
                username: '',
                email: '',
                firstname: '',
                lastname: '',
                password: '',
                confirmPassword: ''
            },
            
            // Password validation for current admin
            passwordValidation: {
                show: false,
                length: false,
                number: false,
                letter: false
            },
            
            // Password validation for new admin
            newAdminPasswordValidation: {
                show: false,
                length: false,
                number: false,
                letter: false
            },
            
            notification: {
                show: false,
                message: '',
                type: '',
                icon: ''
            }
        }
    },
    computed: {
        isPasswordValid() {
            return this.passwordValidation.length && 
                   this.passwordValidation.number && 
                   this.passwordValidation.letter &&
                   this.passwordData.newPassword === this.passwordData.confirmPassword &&
                   this.passwordData.currentPassword.length > 0;
        },
        
        isNewAdminValid() {
            return this.newAdminPasswordValidation.length && 
                   this.newAdminPasswordValidation.number && 
                   this.newAdminPasswordValidation.letter &&
                   this.newAdminData.password === this.newAdminData.confirmPassword &&
                   this.newAdminData.username &&
                   this.newAdminData.email &&
                   this.newAdminData.firstname &&
                   this.newAdminData.lastname;
        }
    },
    methods: {
        validatePassword() {
            const password = this.passwordData.newPassword;
            this.passwordValidation.show = password.length > 0;
            this.passwordValidation.length = password.length >= 8;
            this.passwordValidation.number = /\d/.test(password);
            this.passwordValidation.letter = /[a-zA-Z]/.test(password);
        },
        
        validateNewAdminPassword() {
            const password = this.newAdminData.password;
            this.newAdminPasswordValidation.show = password.length > 0;
            this.newAdminPasswordValidation.length = password.length >= 8;
            this.newAdminPasswordValidation.number = /\d/.test(password);
            this.newAdminPasswordValidation.letter = /[a-zA-Z]/.test(password);
        },
        
        async changePassword() {
            try {
                if (!this.isPasswordValid) {
                    throw new Error('Please ensure all password requirements are met');
                }

                this.isChangingPassword = true;
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/users/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: this.passwordData.currentPassword,
                        newPassword: this.passwordData.newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    this.passwordData = {
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    };
                    this.passwordValidation.show = false;
                    this.showNotification('Password updated successfully! Your account is now more secure.', 'success', 'fas fa-shield-alt');
                } else {
                    throw new Error(data.message || 'Failed to update password');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                this.showNotification(error.message || 'Failed to update password. Please try again.', 'error', 'fas fa-exclamation-triangle');
            } finally {
                this.isChangingPassword = false;
            }
        },
        
        async addAdmin() {
            try {
                if (!this.isNewAdminValid) {
                    throw new Error('Please ensure all fields are filled and password requirements are met');
                }

                this.isAddingAdmin = true;
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/admin/add-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: this.newAdminData.username,
                        email: this.newAdminData.email,
                        firstname: this.newAdminData.firstname,
                        lastname: this.newAdminData.lastname,
                        password: this.newAdminData.password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    this.newAdminData = {
                        username: '',
                        email: '',
                        firstname: '',
                        lastname: '',
                        password: '',
                        confirmPassword: ''
                    };
                    this.newAdminPasswordValidation.show = false;
                    this.showNotification('Admin account created successfully! New administrator can now access the system.', 'success', 'fas fa-user-plus');
                } else {
                    throw new Error(data.message || 'Failed to create admin account');
                }
            } catch (error) {
                console.error('Error adding admin:', error);
                this.showNotification(error.message || 'Failed to create admin account. Please try again.', 'error', 'fas fa-exclamation-triangle');
            } finally {
                this.isAddingAdmin = false;
            }
        },
        
        showNotification(message, type, icon) {
            this.notification = {
                show: true,
                message,
                type,
                icon
            };
            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
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
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username || 'Admin';
        }
    }
}
</script>

<style scoped>
.admin-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.admin-content {
    padding: 2rem;
}

.admin-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.settings-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.section-header {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.section-title h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.password-form, .admin-form {
    padding: 2rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-input {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s;
    background-color: white;
}

.form-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Password Section */
.password-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.password-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background-color: white;
    box-sizing: border-box;
}

.password-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.password-toggle {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease;
}

.password-toggle:hover {
    color: #3498db;
}

.password-requirements {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #dc3545;
    transition: color 0.2s ease;
}

.requirement.valid {
    color: #4CAF50;
}

.requirement i {
    font-size: 0.75rem;
}

.password-error {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #dc3545;
}

.password-actions, .admin-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
}

.password-btn, .admin-btn {
    padding: 0.75rem 1.5rem;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.password-btn {
    background-color: #4CAF50;
}

.password-btn:hover:not(:disabled) {
    background-color: #45a049;
    transform: translateY(-1px);
}

.admin-btn {
    background-color: #3498db;
}

.admin-btn:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-1px);
}

.password-btn:disabled, .admin-btn:disabled {
    background-color: #c8e6c9;
    cursor: not-allowed;
    transform: none;
}

.admin-btn:disabled {
    background-color: #bdc3c7;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background-color: #4CAF50;
}

.notification.error {
    background-color: #e74c3c;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.logout-modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.logout-modal h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.logout-modal p {
    margin-bottom: 1.5rem;
    color: #666;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.confirm-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.confirm-btn {
    background-color: #dc3545;
    color: white;
}

.confirm-btn:hover {
    background-color: #c82333;
}

.cancel-btn {
    background-color: #6c757d;
    color: white;
}

.cancel-btn:hover {
    background-color: #5a6268;
}

@media (max-width: 768px) {
    .admin-container {
        padding-left: 0;
    }
    
    .admin-content {
        padding: 1rem;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .password-actions, .admin-actions {
        justify-content: center;
    }
}
</style>