<template>
    <div class="recruit-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="recruit-content">
            <h1><i class="fas fa-user-plus"></i> Recruit Staff</h1>

            <!-- Staff Registration Section -->
            <div class="recruit-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><i class="fas fa-id-badge"></i> New Staff Information</h2>
                    </div>
                </div>

                <form @submit.prevent="handleStaffRegistration" class="recruit-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> Username</label>
                            <input
                                type="text"
                                v-model="formData.username"
                                placeholder="Enter username"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-envelope"></i> Email</label>
                            <input
                                type="email"
                                v-model="formData.email"
                                placeholder="Enter email address"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> First Name</label>
                            <input
                                type="text"
                                v-model="formData.firstname"
                                placeholder="Enter first name"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> Middle Name</label>
                            <input
                                type="text"
                                v-model="formData.middlename"
                                placeholder="Enter middle name (optional)"
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-user-circle"></i> Last Name</label>
                            <input
                                type="text"
                                v-model="formData.lastname"
                                placeholder="Enter last name"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-venus-mars"></i> Gender</label>
                            <select v-model="formData.gender" required class="form-select">
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-heart"></i> Civil Status</label>
                            <select v-model="formData.civilStatus" required class="form-select">
                                <option value="">Select Civil Status</option>
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
                                v-model="formData.phoneNumber"
                                placeholder="Enter phone number"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> Birth Date</label>
                            <input
                                type="date"
                                v-model="formData.birthdate"
                                required
                                class="form-input"
                            />
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> Initial Password</label>
                            <div class="password-input-container">
                                <input
                                    :type="showPassword ? 'text' : 'password'"
                                    v-model="formData.password"
                                    placeholder="Enter initial password"
                                    required
                                    class="password-input"
                                    @input="validatePassword"
                                />
                                <button 
                                    type="button" 
                                    @click="showPassword = !showPassword"
                                    class="password-toggle"
                                >
                                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
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

                        <div class="form-group full-width">
                            <label><i class="fas fa-map-marker-alt"></i> Address</label>
                            <textarea
                                v-model="formData.address"
                                placeholder="Enter complete address"
                                required
                                rows="3"
                                class="form-textarea"
                            ></textarea>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button 
                            type="submit" 
                            class="submit-btn"
                            :disabled="!isFormValid || isSubmitting"
                        >
                            <i :class="isSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-user-plus'"></i>
                            {{ isSubmitting ? 'Registering...' : 'Register Staff Member' }}
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
    name: 'RecruitStaff',
    components: {
        AdminNavbar
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            isSubmitting: false,
            showPassword: false,
            
            formData: {
                username: '', 
                firstname: '',
                middlename: '',
                lastname: '',
                gender: '',
                civilStatus: '',
                phoneNumber: '',
                address: '',
                birthdate: '',
                email: '',
                password: ''
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
        isFormValid() {
            const requiredFields = ['username', 'firstname', 'lastname', 'gender', 'civilStatus', 'phoneNumber', 'address', 'birthdate', 'email', 'password'];
            const allFieldsFilled = requiredFields.every(field => this.formData[field]);
            const passwordValid = this.passwordValidation.length && this.passwordValidation.number && this.passwordValidation.letter;
            
            return allFieldsFilled && passwordValid;
        }
    },
    methods: {
        validatePassword() {
            const password = this.formData.password;
            this.passwordValidation.show = password.length > 0;
            this.passwordValidation.length = password.length >= 8;
            this.passwordValidation.number = /\d/.test(password);
            this.passwordValidation.letter = /[a-zA-Z]/.test(password);
        },
        
        async handleStaffRegistration() {
            try {
                if (!this.isFormValid) {
                    throw new Error('Please fill in all required fields and ensure password requirements are met');
                }

                this.isSubmitting = true;
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/admin/recruit-staff', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Reset form
                    this.formData = {
                        username: '', 
                        firstname: '',
                        middlename: '',
                        lastname: '',
                        gender: '',
                        civilStatus: '',
                        phoneNumber: '',
                        address: '',
                        birthdate: '',
                        email: '',
                        password: ''
                    };
                    this.passwordValidation.show = false;
                    this.showNotification('Staff member registered successfully! They can now access the system with their credentials.', 'success', 'fas fa-user-check');
                } else {
                    throw new Error(data.message || 'Failed to register staff member');
                }
            } catch (error) {
                console.error('Error registering staff:', error);
                this.showNotification(error.message || 'Failed to register staff member. Please try again.', 'error', 'fas fa-exclamation-triangle');
            } finally {
                this.isSubmitting = false;
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
    }
}
</script>

<style scoped>
.recruit-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
}

.recruit-content {
    padding: 2rem;
}

.recruit-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.recruit-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.recruit-form {
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

.form-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
}

.submit-btn {
    padding: 0.875rem 2rem;
    background-color: #27ae60;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    min-width: 200px;
    justify-content: center;
}

.submit-btn:hover:not(:disabled) {
    background-color: #219a52;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

.submit-btn:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
    max-width: 400px;
}

.notification.success {
    background-color: #27ae60;
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
    .recruit-container {
        padding-left: 0;
    }
    
    .recruit-content {
        padding: 1rem;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .form-actions {
        justify-content: stretch;
    }
    
    .submit-btn {
        width: 100%;
    }
}
</style>