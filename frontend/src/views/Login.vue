<template>
    <div class="login-container">
      <div class="login-card">
        <div class="form-header">
          <i class="fas fa-leaf logo-icon"></i>
          <h2>JM Garis Store</h2>
          <p class="subtitle">Login to your account</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group" style="padding-bottom: 15px;">
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
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-group">
              <i class="fas fa-lock input-icon"></i>
              <input
                type="password"
                id="password"
                v-model="formData.password"
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          
  
          <button type="submit" class="login-btn">
            <i class="fas fa-sign-in-alt"></i>
            Login
          </button>
        </form>
  
        <p v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </p>
  
        <div class="form-footer">
                <p class="forgot-password-link">
                    <i class="fas fa-key"></i>
                    <router-link to="/forgot-password">Forgot password?</router-link>
                </p>
                <p class="register-link">
                    <i class="fas fa-user-plus"></i>
                    Don't have an account? <router-link to="/register">Register here</router-link>
                </p>
            </div>
        </div>
        

        <!-- Verification Dialog -->
        <div v-if="showVerificationDialog" class="modal-overlay">
            <div class="modal-content">
                <h3>Account Not Verified</h3>
                <p>Your account is not verified yet. Would you like to receive a new verification code?</p>
                <div class="modal-buttons">
                    <button @click="resendVerification" class="confirm-btn">Yes, Send Code</button>
                    <button @click="cancelVerification" class="cancel-btn">No, Go Back</button>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>
export default {
    name: 'Login',
    data() {
        return {
            formData: {
                email: '',
                password: ''
            },
            error: '',
            showVerificationDialog: false,
            unverifiedEmail: ''
        }
    },
    methods: {
        
      async handleLogin() {
        try {
            const response = await fetch('http://localhost:7904/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(this.formData)
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if it's an invalid credentials error
                if (data.message === 'Invalid email or password') {
                    throw new Error('Invalid email or password');
                }
                
                // If credentials are correct but user is not verified
                if (data.needsVerification && data.validCredentials) {
                    this.unverifiedEmail = data.email;
                    // Store password temporarily
                    localStorage.setItem('tempPassword', this.formData.password);
                    this.showVerificationDialog = true;
                    return;
                }

                throw new Error(data.message || 'Login failed');
            }

            // Store the token
            localStorage.setItem('token', data.token);
            
            // Check for stored redirect path
            const redirectPath = localStorage.getItem('redirectPath');
            
            // Check user role and redirect accordingly
            const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
            
            if (redirectPath) {
                localStorage.removeItem('redirectPath'); // Clear stored path
                this.$router.push(redirectPath);
            } else {
                // Default role-based routing
                switch(decodedToken.role) {
                    case 'admin':
                        this.$router.push('/admin');
                        break;
                    case 'staff':
                        this.$router.push('/staff');
                        break;
                    default:
                        this.$router.push('/home');
                }
            }
        } catch (err) {
            this.error = err.message;
        }
    },
    cancelVerification() {
            this.showVerificationDialog = false;
            this.error = ''; // Clear any existing error messages
            localStorage.removeItem('tempPassword'); // Clean up stored password
        },
    

    async resendVerification() {
        try {
            const response = await fetch('http://localhost:7904/api/users/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: this.unverifiedEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            this.showVerificationDialog = false;
            this.$router.push({
                path: '/verify-otp',
                query: { 
                    email: this.unverifiedEmail,
                    fromLogin: 'true' // Add this parameter
                }
            });
        } catch (err) {
            this.error = err.message;
        }
        
    }
    
    
}

}
</script>
  
<style scoped>
.login-container {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0f2e9 100%);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  transition: transform 0.3s ease;
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

.login-btn {
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

.login-btn:hover {
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
}

.form-footer {
  margin-top: 2rem;
  text-align: center;
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.register-link, .forgot-password-link {
  margin: 0.5rem 0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  transform: translateY(0);
  animation: modalSlideIn 0.3s ease;
}

.modal-content h3 {
  color: #2c3e50;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.modal-content p {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.confirm-btn, .cancel-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-width: 120px;
}

.confirm-btn {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
  border: 2px solid #e0e0e0;
}

.confirm-btn:hover {
  background: linear-gradient(45deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.cancel-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>