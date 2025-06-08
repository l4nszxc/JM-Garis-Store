<template>
    <div class="recruit-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="recruit-content">
            <div class="recruit-card">
                <h2>Recruit New Staff Member</h2>
                <form @submit.prevent="handleStaffRegistration" class="recruit-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" v-model="formData.username" required />
                    </div>
                    <div class="form-group">
                        <label for="firstname">First Name</label>
                        <input type="text" id="firstname" v-model="formData.firstname" required />
                    </div>

                    <div class="form-group">
                        <label for="middlename">Middle Name</label>
                        <input type="text" id="middlename" v-model="formData.middlename" />
                    </div>

                    <div class="form-group">
                        <label for="lastname">Last Name</label>
                        <input type="text" id="lastname" v-model="formData.lastname" required />
                    </div>

                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" v-model="formData.gender" required>
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="civilStatus">Civil Status</label>
                        <select id="civilStatus" v-model="formData.civilStatus" required>
                            <option value="">Select Civil Status</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="widowed">Widowed</option>
                            <option value="divorced">Divorced</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="phoneNumber">Phone Number</label>
                        <input type="tel" id="phoneNumber" v-model="formData.phoneNumber" required />
                    </div>

                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" v-model="formData.address" required></textarea>
                    </div>

                    <div class="form-group">
                        <label for="birthdate">Birthdate</label>
                        <input type="date" id="birthdate" v-model="formData.birthdate" required />
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" v-model="formData.email" required />
                    </div>

                    <div class="form-group">
                        <label for="password">Initial Password</label>
                        <input type="password" id="password" v-model="formData.password" required />
                    </div>

                    <button type="submit" class="submit-btn">Register Staff</button>
                </form>
                <p v-if="error" class="error-message">{{ error }}</p>
                <p v-if="success" class="success-message">{{ success }}</p>
            </div>
        </div>

        <!-- Logout Modal -->
        <LogoutModal 
            :show="showLogoutModal"
            @confirm="handleLogout"
            @cancel="showLogoutModal = false"
        />
    </div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue'
import LogoutModal from '../../components/LogoutModal.vue' // Add this import

export default {
    name: 'RecruitStaff',
    components: {
        AdminNavbar,
        LogoutModal 
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
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
            error: '',
            success: ''
        }
    },
    methods: {
        async handleStaffRegistration() {
            try {
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

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.success = 'Staff member registered successfully!';
                this.formData = {
                    fullname: '',
                    email: '',
                    position: '',
                    password: ''
                };
            } catch (err) {
                this.error = err.message;
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
    }
}
</script>

<style scoped>
.recruit-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px; /* Match sidebar width */
}

.recruit-content {
    padding: 2rem;
    margin: 0 auto;
}

.recruit-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.recruit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
textarea {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    min-height: 100px;
    resize: vertical;
}
label {
    font-weight: bold;
    color: #333;
}

input, select {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.submit-btn {
    background-color: #27ae60;
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
}

.submit-btn:hover {
    background-color: #219a52;
}

.error-message {
    color: #e74c3c;
    margin-top: 1rem;
}

.success-message {
    color: #27ae60;
    margin-top: 1rem;
}

/* Modal Styles */
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
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    text-align: center;
}

.modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.confirm-btn, .cancel-btn {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
}

.confirm-btn {
    background-color: #e74c3c;
    color: white;
}

.cancel-btn {
    background-color: #95a5a6;
    color: white;
}

.confirm-btn:hover {
    background-color: #c0392b;
}

.cancel-btn:hover {
    background-color: #7f8c8d;
}
@media (max-width: 768px) {
    .recruit-container {
        padding-left: 0;
    }
    
    .recruit-content {
        padding: 1rem;
    }
    
    .recruit-card {
        padding: 1rem;
    }
}
</style>