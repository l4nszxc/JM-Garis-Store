<template>
    <div class="forgot-password-container">
        <!-- Step 1: Email Entry -->
        <div v-if="step === 1" class="forgot-password-card">
            <div class="form-header">
                <i class="fas fa-key logo-icon"></i>
                <h2>Forgot Password</h2>
                <p class="subtitle">Enter your email address to receive a verification code</p>
            </div>
            
            <form @submit.prevent="handleEmailSubmit" class="forgot-password-form">
                <div class="form-group">
                    <label for="email"><i class="fas fa-envelope"></i> Email Address</label>
                    <div class="input-group">
                        <i class="fas fa-envelope input-icon"></i>
                        <input
                            type="email"
                            id="email"
                            v-model="email"
                            required
                            placeholder="Enter your email"
                            class="form-input"
                            :disabled="isLoading"
                        />
                    </div>
                </div>
                <button type="submit" class="submit-btn" :disabled="!email || isLoading">
                    <i v-if="!isLoading" class="fas fa-paper-plane"></i>
                    <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                    {{ isLoading ? 'Sending...' : 'Send Verification Code' }}
                </button>
            </form>
            
            <div v-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ error }}
            </div>
            
            <div class="form-footer">
                <p class="login-link">
                    <i class="fas fa-arrow-left"></i>
                    Remember your password? <router-link to="/login">Back to Login</router-link>
                </p>
            </div>
        </div>

        <!-- Step 2: OTP Verification -->
        <div v-if="step === 2" class="forgot-password-card">
            <div class="form-header">
                <i class="fas fa-shield-alt logo-icon"></i>
                <h2>Verify Code</h2>
                <p class="subtitle">Enter the 6-digit verification code sent to <strong>{{ email }}</strong></p>
            </div>
            
            <form @submit.prevent="handleOTPSubmit" class="forgot-password-form">
                <div class="form-group">
                    <label for="otp"><i class="fas fa-lock"></i> Verification Code</label>
                    <div class="input-group">
                        <i class="fas fa-hashtag input-icon"></i>
                        <input
                            type="text"
                            id="otp"
                            v-model="otp"
                            maxlength="6"
                            required
                            placeholder="Enter 6-digit code"
                            class="form-input otp-input"
                            :disabled="isLoading"
                        />
                    </div>
                </div>
                <button type="submit" class="submit-btn" :disabled="otp.length !== 6 || isLoading">
                    <i v-if="!isLoading" class="fas fa-check-circle"></i>
                    <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                    {{ isLoading ? 'Verifying...' : 'Verify Code' }}
                </button>
                <button type="button" @click="resendOTP" class="resend-btn" :disabled="isLoading">
                    <i class="fas fa-redo-alt"></i>
                    Resend Code
                </button>
            </form>
            
            <div v-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ error }}
            </div>
            
            <div v-if="success" class="success-message">
                <i class="fas fa-check-circle"></i>
                {{ success }}
            </div>
        </div>

        <!-- Step 3: New Password -->
        <div v-if="step === 3" class="forgot-password-card">
            <div class="form-header">
                <i class="fas fa-user-shield logo-icon"></i>
                <h2>Reset Password</h2>
                <p class="subtitle">Create a new secure password for your account</p>
            </div>
            
            <form @submit.prevent="handlePasswordReset" class="forgot-password-form">
                <div class="form-group">
                    <label for="password"><i class="fas fa-lock"></i> New Password</label>
                    <div class="input-group">
                        <i class="fas fa-lock input-icon"></i>
                        <div class="password-input-container">
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                id="password"
                                v-model="password"
                                required
                                placeholder="Enter new password"
                                class="password-input"
                                @input="validatePassword"
                                :disabled="isLoading"
                            />
                            <button 
                                type="button" 
                                @click="showPassword = !showPassword"
                                class="password-toggle"
                            >
                                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Password Requirements -->
                    <div v-if="passwordValidation.show" class="password-requirements">
                        <div class="password-strength">
                            <div class="strength-label">Password Strength: 
                                <span :class="['strength-text', passwordStrengthClass]">
                                    {{ passwordStrengthText }}
                                </span>
                            </div>
                            <div class="strength-bar">
                                <div 
                                    :class="['strength-fill', passwordStrengthClass]"
                                    :style="{ width: passwordStrengthWidth + '%' }"
                                ></div>
                            </div>
                        </div>
                        <div class="requirements-list">
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
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword"><i class="fas fa-lock"></i> Confirm Password</label>
                    <div class="input-group">
                        <i class="fas fa-lock input-icon"></i>
                        <div class="password-input-container">
                            <input
                                :type="showConfirmPassword ? 'text' : 'password'"
                                id="confirmPassword"
                                v-model="confirmPassword"
                                required
                                placeholder="Confirm new password"
                                class="password-input"
                                :disabled="isLoading"
                            />
                            <button 
                                type="button" 
                                @click="showConfirmPassword = !showConfirmPassword"
                                class="password-toggle"
                            >
                                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                        </div>
                    </div>
                    <div v-if="confirmPassword && password !== confirmPassword" class="password-error">
                        <i class="fas fa-times"></i> Passwords do not match
                    </div>
                </div>
                
                <button type="submit" class="submit-btn" :disabled="!isPasswordValid || isLoading">
                    <i v-if="!isLoading" class="fas fa-shield-alt"></i>
                    <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                    {{ isLoading ? 'Resetting...' : 'Reset Password' }}
                </button>
            </form>
            
            <div v-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                {{ error }}
            </div>
        </div>

        <!-- Progress Steps -->
        <div class="progress-steps">
            <div :class="['step', { active: step >= 1, completed: step > 1 }]">
                <div class="step-number">1</div>
                <span>Email</span>
            </div>
            <div class="step-line" :class="{ completed: step > 1 }"></div>
            <div :class="['step', { active: step >= 2, completed: step > 2 }]">
                <div class="step-number">2</div>
                <span>Verify</span>
            </div>
            <div class="step-line" :class="{ completed: step > 2 }"></div>
            <div :class="['step', { active: step >= 3 }]">
                <div class="step-number">3</div>
                <span>Reset</span>
            </div>
        </div>
    </div>
</template>

<script>
import { apiPost } from '@/config/api'

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
            success: '',
            
            // Loading states
            isLoading: false,
            
            // Password visibility toggles
            showPassword: false,
            showConfirmPassword: false,
            
            // Password validation
            passwordValidation: {
                show: false,
                length: false,
                number: false,
                letter: false,
                uppercase: false,
                lowercase: false,
                special: false
            }
        }
    },
    computed: {
        isPasswordValid() {
            return this.passwordValidation.length && 
                   this.passwordValidation.number && 
                   this.passwordValidation.letter &&
                   this.password === this.confirmPassword &&
                   this.password.length > 0;
        },
        
        passwordStrengthScore() {
            let score = 0;
            if (this.passwordValidation.length) score += 1;
            if (this.passwordValidation.number) score += 1;
            if (this.passwordValidation.letter) score += 1;
            if (this.passwordValidation.uppercase) score += 1;
            if (this.passwordValidation.lowercase) score += 1;
            if (this.passwordValidation.special) score += 1;
            return score;
        },
        
        passwordStrengthText() {
            const score = this.passwordStrengthScore;
            if (score <= 2) return 'Weak';
            if (score <= 4) return 'Medium';
            if (score <= 5) return 'Strong';
            return 'Very Strong';
        },
        
        passwordStrengthClass() {
            const score = this.passwordStrengthScore;
            if (score <= 2) return 'weak';
            if (score <= 4) return 'medium';
            if (score <= 5) return 'strong';
            return 'very-strong';
        },
        
        passwordStrengthWidth() {
            return (this.passwordStrengthScore / 6) * 100;
        }
    },
    methods: {
        validatePassword() {
            const password = this.password;
            this.passwordValidation.show = password.length > 0;
            this.passwordValidation.length = password.length >= 8;
            this.passwordValidation.number = /\d/.test(password);
            this.passwordValidation.letter = /[a-zA-Z]/.test(password);
            this.passwordValidation.uppercase = /[A-Z]/.test(password);
            this.passwordValidation.lowercase = /[a-z]/.test(password);
            this.passwordValidation.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        },
        
        async handleEmailSubmit() {
            try {
                this.error = '';
                this.isLoading = true;
                const response = await apiPost('/api/users/forgot-password', { email: this.email });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.step = 2;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async handleOTPSubmit() {
            try {
                this.error = '';
                this.isLoading = true;
                const response = await apiPost('/api/users/verify-password-reset', { 
                        email: this.email,
                        otp: this.otp 
                    });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.step = 3;
            } catch (err) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async handlePasswordReset() {
            try {
                this.error = '';
                this.isLoading = true;
                
                if (!this.isPasswordValid) {
                    throw new Error('Please ensure all password requirements are met');
                }
                const response = await apiPost('/api/users/reset-password', {
                        email: this.email,
                        password: this.password
                    });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                // Show success message and redirect
                this.$router.push({
                    path: '/login',
                    query: { message: 'Password reset successfully! Please login with your new password.' }
                });
            } catch (err) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async resendOTP() {
            try {
                this.error = '';
                this.success = '';
                this.isLoading = true;
                
                const response = await apiPost('/api/users/forgot-password', { email: this.email });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                this.success = 'New verification code sent successfully!';
                setTimeout(() => {
                    this.success = '';
                }, 5000);
            } catch (err) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        }
    }
}
</script>

<style scoped>
.forgot-password-container {
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0f2e9 100%);
    padding: 2rem 1rem;
}

.forgot-password-card {
    background: white;
    padding: 2.5rem;
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 450px;
    margin-bottom: 2rem;
    animation: slideIn 0.3s ease-out;
}

.form-header {
    text-align: center;
    margin-bottom: 2rem;
}

.logo-icon {
    font-size: 3rem;
    color: #4CAF50;
    margin-bottom: 1rem;
    display: block;
}

.form-header h2 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 600;
}

.subtitle {
    color: #64748b;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
}

.forgot-password-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input-group {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #4CAF50;
    z-index: 2;
}

.form-input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.form-input:focus {
    border-color: #4CAF50;
    outline: none;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #d1d5db;
}

.otp-input {
    text-align: center;
    font-size: 1.25rem;
    letter-spacing: 0.5rem;
    font-weight: 600;
}

/* Password Input Specific Styles */
.password-input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.password-input {
    width: 100%;
    padding: 1rem 3rem 1rem 3rem; /* Changed from 0.5rem to 3rem for left padding */
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.password-input:focus {
    border-color: #4CAF50;
    outline: none;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.password-input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #d1d5db;
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
    z-index: 2;
}

.password-toggle:hover {
    color: #4CAF50;
}

/* Password Requirements */
.password-requirements {
    margin-top: 0.75rem;
}

.password-strength {
    margin-bottom: 0.75rem;
}

.strength-label {
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
    color: #374151;
}

.strength-text {
    font-weight: 600;
}

.strength-text.weak {
    color: #dc3545;
}

.strength-text.medium {
    color: #f59e0b;
}

.strength-text.strong {
    color: #10b981;
}

.strength-text.very-strong {
    color: #059669;
}

.strength-bar {
    width: 100%;
    height: 4px;
    background-color: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
}

.strength-fill.weak {
    background-color: #dc3545;
}

.strength-fill.medium {
    background-color: #f59e0b;
}

.strength-fill.strong {
    background-color: #10b981;
}

.strength-fill.very-strong {
    background-color: #059669;
}

.requirements-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #dc3545;
    transition: color 0.2s ease;
}

.requirement.valid {
    color: #4CAF50;
}

.requirement i {
    font-size: 0.7rem;
}

.password-error {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #dc3545;
}

.submit-btn {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
    background: linear-gradient(45deg, #45a049, #3d8b40);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.submit-btn:disabled {
    background: #c8e6c9;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.resend-btn {
    background-color: #f8f9fa;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.resend-btn:hover {
    background-color: #4CAF50;
    color: white;
    transform: translateY(-1px);
}

.resend-btn:disabled {
    background-color: #f5f5f5;
    color: #9ca3af;
    border-color: #d1d5db;
    cursor: not-allowed;
    transform: none;
}

.error-message {
    color: #dc3545;
    background-color: #fdecea;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
}

.success-message {
    color: #059669;
    background-color: #f0fdf4;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
}

.form-footer {
    margin-top: 1.5rem;
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.login-link {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.login-link a {
    color: #4CAF50;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.login-link a:hover {
    color: #45a049;
    text-decoration: underline;
}

/* Progress Steps */
.progress-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    max-width: 450px;
    width: 100%;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.step.active {
    color: #4CAF50;
}

.step.completed {
    color: #059669;
}

.step-number {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.step.active .step-number {
    background-color: #4CAF50;
    color: white;
}

.step.completed .step-number {
    background-color: #059669;
    color: white;
}

.step-line {
    flex: 1;
    height: 2px;
    background-color: #e2e8f0;
    transition: all 0.3s ease;
}

.step-line.completed {
    background-color: #059669;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.fa-spin {
    animation: spin 1s linear infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
    .forgot-password-container {
        padding: 1rem;
    }
    
    .forgot-password-card {
        padding: 2rem;
        max-width: 100%;
    }
    
    .form-header h2 {
        font-size: 1.5rem;
    }
    
    .logo-icon {
        font-size: 2.5rem;
    }
    
    .progress-steps {
        gap: 0.5rem;
    }
    
    .step {
        font-size: 0.75rem;
    }
    
    .step-number {
        width: 2rem;
        height: 2rem;
        font-size: 0.8rem;
    }
}

@media (max-width: 480px) {
    .forgot-password-card {
        padding: 1.5rem;
    }
    
    .form-input {
        padding: 0.875rem 0.875rem 0.875rem 2.5rem;
    }
    
    .password-input {
        padding: 0.875rem 2.5rem 0.875rem 2.5rem; /* Fixed mobile padding too */
    }
    
    .submit-btn, .resend-btn {
        padding: 0.875rem 1.25rem;
    }
}
</style>

