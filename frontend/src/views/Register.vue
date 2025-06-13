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
            <input
              type="password"
              id="password"
              v-model="formData.password"
              required
              placeholder="Create a password"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-group">
            <i class="fas fa-lock input-icon"></i>
            <input
              type="password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              required
              placeholder="Confirm your password"
            />
          </div>
        </div>
      </div>
    </div>

    <button type="submit" class="register-btn">
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
      error: ''
    }
  },
  methods: {
    async handleRegister() {
      try {
        // Check if passwords match
        if (this.formData.password !== this.formData.confirmPassword) {
          this.error = 'Passwords do not match';
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

        const response = await fetch('http://localhost:7904/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registrationData)
        });

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

.register-btn:hover {
  background: linear-gradient(45deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
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