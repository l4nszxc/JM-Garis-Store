<template>
  <div class="register-container">
    <div class="register-card">
      <div class="form-header">
        <i class="fas fa-user-plus logo-icon"></i>
        <h2>JM Garis Store</h2>
        <p class="subtitle">Create an account</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
    <div class="form-grid">
      <!-- Left Column -->
      <div class="form-column">
        <!-- Username field -->
        <div class="form-group">
          <label for="username">Username</label>
          <div class="input-group">
            <i class="fas fa-user input-icon"></i>
            <input
              type="text"
              id="username"
              v-model="formData.username"
              required
              placeholder="Choose a username"
            />
          </div>
        </div>

        <!-- Name fields -->
        <div class="form-row">
          <div class="form-group">
            <label for="firstname">First Name</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input
                type="text"
                id="firstname"
                v-model="formData.firstname"
                required
                placeholder="First name"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="middlename">Middle Name</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input
                type="text"
                id="middlename"
                v-model="formData.middlename"
                placeholder="Middle name (optional)"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="lastname">Last Name</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input
                type="text"
                id="lastname"
                v-model="formData.lastname"
                required
                placeholder="Last name"
              />
            </div>
          </div>
        </div>

        <!-- Gender field -->
        <div class="form-group">
          <label for="gender">Gender (optional)</label>
          <div class="input-group">
            <i class="fas fa-venus-mars input-icon"></i>
            <select
              id="gender"
              v-model="formData.gender"
              class="select-input"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <!-- Birthdate field -->
        <div class="form-group">
          <label for="birthdate">Birthdate (optional)</label>
          <div class="input-group">
            <i class="fas fa-calendar input-icon"></i>
            <input
              type="date"
              id="birthdate"
              v-model="formData.birthdate"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="phoneNumber">Phone Number</label>
          <div class="input-group">
            <i class="fas fa-phone input-icon"></i>
            <input
              type="tel"
              id="phoneNumber"
              v-model="formData.phoneNumber"
              required
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="form-column">

        <!-- Address field -->
        <div class="form-group">
          <label for="address">Address</label>
          <div class="input-group">
            <i class="fas fa-home input-icon"></i>
            <input
              type="text"
              id="address"
              v-model="formData.address"
              required
              placeholder="Enter your address"
              class="input-field"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="civilStatus">Civil Status (optional)</label>
          <div class="input-group">
            <i class="fas fa-heart input-icon"></i>
            <select
              id="civilStatus"
              v-model="formData.civilStatus"
              class="select-input"
            >
              <option value="">Select civil status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
              <option value="separated">Separated</option>
            </select>
          </div>
        </div>
        
        
        <!-- Email field -->
        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-group">
            <i class="fas fa-envelope input-icon"></i>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <!-- Password field -->
        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <div class="password-input-container">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="formData.password"
                required
                placeholder="Create a password"
                @input="validatePassword"
                class="password-input"
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
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <div class="password-input-container">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                v-model="formData.confirmPassword"
                required
                placeholder="Confirm your password"
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
          </div>
          <div v-if="formData.confirmPassword && formData.password !== formData.confirmPassword" class="password-error">
            <i class="fas fa-times"></i> Passwords do not match
          </div>
        </div>
      </div>
    </div>

    <button type="submit" class="register-btn" :disabled="!isFormValid">
      <i class="fas fa-user-plus"></i>
      Create Account
    </button>
  </form>

      <p v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </p>

      <div class="form-footer">
        <p class="login-link">
          <i class="fas fa-sign-in-alt"></i>
          Already have an account? <router-link to="/login">Login here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { apiPost } from '@/config/api'

export default {
  name: 'Register',
  data() {
    return {
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
        password: '',
        confirmPassword: ''
      },
      error: '',
      
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
             this.passwordValidation.letter;
    },
    
    isFormValid() {
      return this.isPasswordValid && 
             this.formData.password === this.formData.confirmPassword &&
             this.formData.username &&
             this.formData.firstname &&
             this.formData.lastname &&
             this.formData.phoneNumber &&
             this.formData.address &&
             this.formData.email;
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
      const password = this.formData.password;
      this.passwordValidation.show = password.length > 0;
      this.passwordValidation.length = password.length >= 8;
      this.passwordValidation.number = /\d/.test(password);
      this.passwordValidation.letter = /[a-zA-Z]/.test(password);
      this.passwordValidation.uppercase = /[A-Z]/.test(password);
      this.passwordValidation.lowercase = /[a-z]/.test(password);
      this.passwordValidation.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    },
    
    async handleRegister() {
      try {
        // Check if passwords match
        if (this.formData.password !== this.formData.confirmPassword) {
          this.error = 'Passwords do not match';
          return;
        }

        // Check password requirements
        if (!this.isPasswordValid) {
          this.error = 'Password must be at least 8 characters long and contain at least one number and one letter';
          return;
        }

        // Create a copy of formData without confirmPassword
        const registrationData = { ...this.formData };
        delete registrationData.confirmPassword;
        
        // Handle empty optional fields
        if (!registrationData.gender) delete registrationData.gender;
        if (!registrationData.birthdate) delete registrationData.birthdate;
        if (!registrationData.civilStatus) delete registrationData.civilStatus;
        if (!registrationData.middlename) delete registrationData.middlename;

        const response = await apiPost('/api/users/register', registrationData);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        this.$router.push({
          path: '/verify-otp',
          query: { email: this.formData.email }
        });
      } catch (err) {
        this.error = err.message;
      }
    }
  }
}
</script>
  
  <style scoped>
.register-container {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0f2e9 100%);
}

.register-card {
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 900px; /* Increased max-width for 2 columns */
  margin: 2rem;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 1.5rem;
}
.form-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 3rem;
  color: #4CAF50;
  margin-bottom: 1rem;
}

.subtitle {
  color: #666;
  margin-top: 0.5rem;
}

.input-group {
  position: relative;
  margin-top: 0.5rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4CAF50;
  z-index: 2;
}

input {
  width: 83%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
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
  padding: 1rem 3rem 1rem 0.5rem;
  border: 2px solid #e0e0e0;
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

.register-btn {
  width: 100%;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.register-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.register-btn:disabled {
  background: #c8e6c9;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  color: #e74c3c;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #fdecea;
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-footer {
  margin-top: 2rem;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #666;
}

a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

a:hover {
  color: #45a049;
  text-decoration: underline;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.select-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  appearance: none;
}

.textarea-input {
  width: 83%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

/* Add responsive styles for form-row */
@media (max-width: 768px) {
  .register-card {
    margin: 1rem;
    padding: 1.5rem;
    max-width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .input-group input,
  .input-group select,
  .input-group textarea {
    width: 100%;
  }

  .register-btn {
    width: 100%;
  }
  
  .password-input-container {
    width: 100%;
  }
  
  .password-input {
    width: 100%;
  }
}
.input-group input,
.select-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s ease;
}
.textarea-input {
  width: 100%;
  box-sizing: border-box;
  padding-left: 2.5rem;
}

.textarea-input {
  min-height: 100px;
}
</style>