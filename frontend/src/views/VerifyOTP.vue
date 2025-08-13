<template>
    <div class="verify-container">
        <div class="verify-card">
            <h2>Verify Your Email</h2>
            <p>Please enter the OTP sent to {{ email }}</p>
            <form @submit.prevent="handleVerify" class="verify-form">
                <div class="form-group">
                    <input
                        type="text"
                        v-model="otp"
                        maxlength="6"
                        placeholder="Enter OTP"
                        required
                    />
                </div>
                <button type="submit" class="verify-btn">Verify OTP</button>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>
            <p v-if="success" class="success-message">{{ success }}</p>
        </div>
    </div>
</template>

<script>
import { apiPost } from '@/config/api'

export default {
    name: 'VerifyOTP',
    data() {
        return {
            email: '',
            otp: '',
            error: '',
            success: '',
            fromLogin: false // Add this to track where user came from
        }
    },
    created() {
        this.email = this.$route.query.email;
        this.fromLogin = this.$route.query.fromLogin === 'true'; // Get the source
        if (!this.email) {
            this.$router.push('/register');
        }
    },
    methods: {
        async handleVerify() {
            try {
                const response = await apiPost('/api/users/verify-otp', {
                        email: this.email,
                        otp: this.otp
                    });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                this.success = 'Email verified successfully!';

                if (this.fromLogin) {
                    // If came from login, attempt to log in automatically
                    const loginResponse = await apiPost('/api/users/login', {
                            email: this.email,
                            password: localStorage.getItem('tempPassword') // Get stored password
                        });

                    const loginData = await loginResponse.json();

                    if (loginResponse.ok) {
                        localStorage.removeItem('tempPassword'); // Clear stored password
                        localStorage.setItem('token', loginData.token);
                        
                        // Redirect based on role
                        const decodedToken = JSON.parse(atob(loginData.token.split('.')[1]));
                        switch(decodedToken.role) {
                            case 'admin':
                                this.$router.push('/admin');
                                break;
                            case 'staff':
                                this.$router.push('/staff');
                                break;
                            default:
                                this.$router.push('/user/home');
                        }
                    } else {
                        this.$router.push('/login');
                    }
                } else {
                    // If came from register, redirect to login after 2 seconds
                    setTimeout(() => {
                        this.$router.push('/login');
                    }, 2000);
                }

            } catch (err) {
                this.error = err.message;
            }
        }
    }
}
</script>

<style scoped>
.verify-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.verify-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.verify-form {
    margin-top: 2rem;
}

.form-group input {
    padding: 0.8rem;
    width: 200px;
    font-size: 1.5rem;
    text-align: center;
    letter-spacing: 0.5rem;
}

.verify-btn {
    background-color: #4CAF50;
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
    width: 200px;
}

.error-message {
    color: red;
    margin-top: 1rem;
}
.success-message {
    color: #4CAF50;
    margin-top: 1rem;
}
</style>