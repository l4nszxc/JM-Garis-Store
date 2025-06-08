<template>
    <div class="forgot-password-container">
        <!-- Step 1: Email Entry -->
        <div v-if="step === 1" class="forgot-password-card">
            <h2>Forgot Password</h2>
            <p>Enter your email address to receive a verification code.</p>
            <form @submit.prevent="handleEmailSubmit" class="forgot-password-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        v-model="email"
                        required
                        placeholder="Enter your email"
                    />
                </div>
                <button type="submit" class="submit-btn">Send Code</button>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>
            <p class="login-link">
                Remember your password? <router-link to="/login">Login here</router-link>
            </p>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-if="step === 2" class="forgot-password-card">
            <h2>Verify OTP</h2>
            <p>Enter the verification code sent to {{ email }}</p>
            <form @submit.prevent="handleOTPSubmit" class="forgot-password-form">
                <div class="form-group">
                    <input
                        type="text"
                        v-model="otp"
                        maxlength="6"
                        required
                        placeholder="Enter OTP"
                    />
                </div>
                <button type="submit" class="submit-btn">Verify Code</button>
                <button @click="resendOTP" class="resend-btn">Resend Code</button>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>
            <p v-if="success" class="success-message">{{ success }}</p>
        </div>

        <!-- Step 3: New Password -->
        <div v-if="step === 3" class="forgot-password-card">
            <h2>Reset Password</h2>
            <form @submit.prevent="handlePasswordReset" class="forgot-password-form">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        v-model="password"
                        required
                        placeholder="Enter new password"
                    />
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        v-model="confirmPassword"
                        required
                        placeholder="Confirm new password"
                    />
                </div>
                <button type="submit" class="submit-btn">Reset Password</button>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ForgotPassword',
    data() {
        return {
            step: 1,
            email: '',
            otp: '',
            password: '',
            confirmPassword: '',
            error: '',
            success: ''
        }
    },
    methods: {
        async handleEmailSubmit() {
            try {
                const response = await fetch('http://localhost:7904/api/users/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.step = 2;
                this.error = '';
            } catch (err) {
                this.error = err.message;
            }
        },

        async handleOTPSubmit() {
            try {
                const response = await fetch('http://localhost:7904/api/users/verify-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: this.email,
                        otp: this.otp 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.step = 3;
                this.error = '';
            } catch (err) {
                this.error = err.message;
            }
        },

        async handlePasswordReset() {
            try {
                if (this.password !== this.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                const response = await fetch('http://localhost:7904/api/users/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.$router.push('/login');
            } catch (err) {
                this.error = err.message;
            }
        },

        async resendOTP() {
            try {
                const response = await fetch('http://localhost:7904/api/users/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.success = 'New OTP sent successfully';
                setTimeout(() => {
                    this.success = '';
                }, 3000);
            } catch (err) {
                this.error = err.message;
            }
        }
    }
}
</script>

<style scoped>
.forgot-password-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.forgot-password-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
}

.forgot-password-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

label {
    font-weight: bold;
    color: #333;
}

input {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.submit-btn {
    background-color: #4CAF50;
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
}

.resend-btn {
    background-color: #2196F3;
    color: white;
    padding: 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.submit-btn:hover {
    background-color: #45a049;
}

.resend-btn:hover {
    background-color: #1976D2;
}

.error-message {
    color: #e74c3c;
    margin-top: 1rem;
}

.success-message {
    color: #4CAF50;
    margin-top: 1rem;
}

.login-link {
    margin-top: 1rem;
    text-align: center;
}

a {
    color: #4CAF50;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}
</style>