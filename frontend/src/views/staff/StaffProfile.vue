<template>
    <div class="staff-container">
        <StaffNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="staff-content">
            <h1><i class="fas fa-user-cog"></i> Staff Profile</h1>

            <!-- Profile Information Section -->
            <div class="profile-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-user-edit"></i> Personal Information</h2>
                    </div>
                    <div class="section-actions">
                        <button v-if="isEditing" @click="discardChanges" class="discard-btn">
                            <i class="fas fa-times"></i>
                            Discard Changes
                        </button>
                        <button @click="toggleEditing" class="edit-btn">
                            <i :class="isEditing ? 'fas fa-save' : 'fas fa-pen'"></i>
                            {{ isEditing ? 'Save Changes' : 'Edit Profile' }}
                        </button>
                    </div>
                </div>

                <div class="profile-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Username</label>
                            <input
                                type="text"
                                v-model="profileData.username"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> First Name</label>
                            <input
                                type="text"
                                v-model="profileData.firstname"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> Middle Name</label>
                            <input
                                type="text"
                                v-model="profileData.middlename"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> Last Name</label>
                            <input
                                type="text"
                                v-model="profileData.lastname"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-venus-mars"></i> Gender</label>
                            <select v-model="profileData.gender" :disabled="!isEditing" class="form-select">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-heart"></i> Civil Status</label>
                            <select v-model="profileData.civil_status" :disabled="!isEditing" class="form-select">
                                <option value="">Select Status</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="widowed">Widowed</option>
                                <option value="divorced">Divorced</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-phone"></i> Phone Number</label>
                            <input
                                type="tel"
                                v-model="profileData.phone_number"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input
                                type="email"
                                v-model="profileData.email"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                        <div class="form-group full-width">
                            <label><i class="fas fa-map-marker-alt"></i> Address</label>
                            <textarea
                                v-model="profileData.address"
                                :disabled="!isEditing"
                                rows="3"
                                class="form-textarea"
                            ></textarea>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Birth Date</label>
                            <input
                                type="date"
                                v-model="profileData.birthdate"
                                :disabled="!isEditing"
                                class="form-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Password Change Section -->
            <div class="profile-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-lock"></i> Change Password</h2>
                    </div>
                </div>

                <form @submit.prevent="changePassword" class="password-form">
                    <div class="form-grid password-grid">
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
import StaffNavbar from '../../components/StaffNavbar.vue'

export default {
    name: 'StaffProfile',
    components: {
        StaffNavbar
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            isEditing: false,
            isChangingPassword: false,
            
            // Password visibility toggles
            showCurrentPassword: false,
            showNewPassword: false,
            showConfirmPassword: false,
            
            profileData: {
                username: '',
                firstname: '',
                middlename: '',
                lastname: '',
                gender: '',
                civil_status: '',
                phone_number: '',
                address: '',
                birthdate: '',
                email: ''
            },
            originalProfileData: {},
            passwordData: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            
            // Password validation
            passwordValidation: {
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
        
        async fetchProfile() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.birthdate) {
                        data.birthdate = this.formatDateForInput(data.birthdate);
                    }
                    this.profileData = data;
                    this.originalProfileData = { ...data };
                    this.username = data.username;
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                this.showNotification('Error fetching profile data', 'error', 'fas fa-times-circle');
            }
        },

        toggleEditing() {
            if (this.isEditing) {
                this.saveProfile();
            } else {
                this.isEditing = true;
            }
        },

        discardChanges() {
            this.profileData = { ...this.originalProfileData };
            this.isEditing = false;
        },

        async saveProfile() {
            try {
                const updateData = {
                    username: this.profileData.username || '',
                    firstname: this.profileData.firstname || '',
                    middlename: this.profileData.middlename || null,
                    lastname: this.profileData.lastname || '',
                    gender: this.profileData.gender || '',
                    civil_status: this.profileData.civil_status || '',
                    phone_number: this.profileData.phone_number || '',
                    address: this.profileData.address || '',
                    birthdate: this.formatDateForDB(this.profileData.birthdate),
                    email: this.profileData.email || ''
                };

                const requiredFields = ['username', 'firstname', 'lastname', 'gender', 'civil_status', 'phone_number', 'address', 'email'];
                const missingFields = requiredFields.filter(field => !updateData[field]);
                
                if (missingFields.length > 0) {
                    throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
                }

                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    
                    this.isEditing = false;
                    this.originalProfileData = { ...this.profileData };
                    this.showNotification('Profile updated successfully', 'success', 'fas fa-check-circle');
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                this.showNotification(error.message || 'Failed to update profile. Please try again.', 'error', 'fas fa-times-circle');
            }
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

        formatDateForInput(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        },

        formatDateForDB(dateString) {
            if (!dateString) return null;
            return dateString;
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
            this.username = decoded.username || 'Staff';
        }
        this.fetchProfile();
    }
}
</script>

<style scoped>
.staff-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.staff-content {
    padding: 2rem;
}

.staff-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.profile-section {
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
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.section-actions {
    display: flex;
    gap: 0.5rem;
}

.edit-btn, .discard-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.edit-btn {
    background-color: #3498db;
    color: white;
}

.edit-btn:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
}

.discard-btn {
    background-color: #e74c3c;
    color: white;
}

.discard-btn:hover {
    background-color: #c0392b;
    transform: translateY(-1px);
}

.profile-form, .password-form {
    padding: 2rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.password-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group.full-width {
    grid-column: 1 / -1;
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

.form-input, .form-select, .form-textarea {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s;
    background-color: white;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-input:disabled, .form-select:disabled, .form-textarea:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
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

.password-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
}

.password-btn {
    padding: 0.75rem 1.5rem;
    background-color: #4CAF50;
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

.password-btn:hover:not(:disabled) {
    background-color: #45a049;
    transform: translateY(-1px);
}

.password-btn:disabled {
    background-color: #c8e6c9;
    cursor: not-allowed;
    transform: none;
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
    .staff-container {
        padding-left: 0;
    }
    
    .staff-content {
        padding: 1rem;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .section-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .section-actions {
        width: 100%;
        justify-content: center;
    }
    
    .password-actions {
        justify-content: center;
    }
}
</style>