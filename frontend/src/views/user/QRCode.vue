<template>
  <div class="qr-code-page">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="qr-content">
      <div class="container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-content">
            <div class="title-section">
              <h1><i class="fas fa-qrcode"></i> Points Redemption QR Code</h1>
              <p class="subtitle">Your secure QR code for redeeming points at our physical store location</p>
            </div>
            
            <div class="qr-stats">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-user"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ username }}</div>
                  <div class="stat-label">Account Name</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ memberSince }}</div>
                  <div class="stat-label">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- QR Code Display Section -->
        <div class="qr-display-section">
          <div class="qr-header">
            <h2><i class="fas fa-id-card"></i> Personal Identity QR Code</h2>
            <div class="qr-actions">
              <button @click="clearAndRegenerate" class="refresh-btn">
                <i class="fas fa-refresh"></i>
                Regenerate
              </button>
              <button @click="downloadQR" class="download-btn" :disabled="!qrDataUrl">
                <i class="fas fa-download"></i>
                Download
              </button>
            </div>
          </div>
            
            <div class="qr-container">
              <div v-if="loading" class="qr-loading">
                <div class="spinner"></div>
                <p>Loading your identity QR code...</p>
              </div>
              
              <div v-else-if="error" class="qr-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>{{ error }}</p>
                <button @click="generatePermanentQR" class="retry-btn">
                  <i class="fas fa-redo"></i>
                  Try Again
                </button>
              </div>
              
              <div v-else class="qr-display">
                <div class="qr-secure-message">
                  <div class="secure-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <h3>QR Code Ready for Download</h3>
                  <p>Your secure points redemption QR code has been generated and is ready for download. For security purposes, the QR code is not displayed here.</p>
                </div>
                
                <!-- Hidden canvas for QR generation -->
                <canvas ref="qrCanvas" class="qr-canvas-hidden" width="300" height="300"></canvas>
              </div>
            </div>
        </div>

        <!-- QR Code Features Section -->
        <div class="features-section">
          <h2><i class="fas fa-star"></i> Points Redemption QR Code Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-coins"></i>
              </div>
              <h3>Points Redemption</h3>
              <p>Use this QR code to redeem your earned points when making purchases at our physical store.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-store"></i>
              </div>
              <h3>In-Store Only</h3>
              <p>This QR code is exclusively for use at our physical store location for secure point transactions.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-user-check"></i>
              </div>
              <h3>Account Verification</h3>
              <p>Instantly verifies your identity and points balance for quick and accurate redemption.</p>
            </div>
          </div>
        </div>

        <!-- Usage Instructions Section -->
        <div class="instructions-section">
          <h2><i class="fas fa-info-circle"></i> How to Use Your Points Redemption QR Code</h2>
          <div class="instructions-grid">
            <div class="instruction-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Download & Save</h3>
                <p>Download your QR code and save it to your phone or print it out. This QR code is permanent and unique to your account.</p>
              </div>
            </div>
            
            <div class="instruction-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Visit Physical Store</h3>
                <p>Bring your QR code when shopping at our physical store location to redeem your accumulated points.</p>
              </div>
            </div>
          </div>
          
          <div class="instructions-grid">
            <div class="instruction-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Show at Checkout</h3>
                <p>Present your QR code to the cashier during checkout. They will scan it to apply your points discount.</p>
              </div>
            </div>
            
            <div class="instruction-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Points Applied</h3>
                <p>Admin will verify your account and apply the points redemption to your purchase total automatically.</p>
              </div>
            </div>
          </div>
        </div>
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
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import QRCode from 'qrcode';

export default {
  name: 'QRCodePage',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      userId: null,
      showLogoutModal: false,
      loading: false,
      error: null,
      qrData: '',
      qrDataUrl: '',
      generatedDate: '', // Changed from lastGenerated to generatedDate
      memberSince: '',
      canvasReady: false
    };
  },
  async mounted() {
    console.log('QRCode component mounted');
    if (this.initializeUser()) {
      await this.fetchUserData();
      // Use nextTick to ensure DOM is ready
      await this.$nextTick();
      // Check if QR was already generated for this user
      await this.loadOrGenerateQR();
    }
  },
  methods: {
    initializeUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return false;
      }
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded token:', decoded);
        this.username = decoded.username;
        this.userId = decoded.userId;
        console.log('Initialized - Username:', this.username, 'UserId:', this.userId);
        
        if (!this.userId || !this.username) {
          throw new Error('User information incomplete in token');
        }
        
        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        this.$router.push('/login');
        return false;
      }
    },

    async fetchUserData() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          this.memberSince = this.formatDate(userData.created_at);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    },

    async clearAndRegenerate() {
      try {
        console.log('Clearing stored QR data and regenerating...');
        
        // Clear all stored QR data for this user
        const userQRKey = `qr-user-${this.userId}-${this.username}`;
        localStorage.removeItem(userQRKey);
        localStorage.removeItem(`qr-date-user-${this.userId}`);
        
        // Reset component state
        this.qrData = '';
        this.qrDataUrl = '';
        this.generatedDate = '';
        this.error = null;
        this.canvasReady = false;
        
        // Clear canvas
        const canvas = this.$refs.qrCanvas;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Generate new QR
        await this.$nextTick();
        await this.waitForCanvasElement();
        await this.generatePermanentQR();
        
        this.showNotification('QR code regenerated successfully!', 'success');
      } catch (error) {
        console.error('Error regenerating QR:', error);
        this.error = `Failed to regenerate QR code: ${error.message}`;
      }
    },

    async waitForCanvasElement() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // Wait max 5 seconds
        
        const checkCanvas = () => {
          attempts++;
          console.log(`Checking for canvas element, attempt ${attempts}`);
          
          if (this.$refs.qrCanvas) {
            console.log('Canvas element found!');
            this.canvasReady = true;
            resolve();
          } else if (attempts >= maxAttempts) {
            console.error('Canvas element not found after maximum attempts');
            reject(new Error('Canvas element not available'));
          } else {
            setTimeout(checkCanvas, 50);
          }
        };
        checkCanvas();
      });
    },

    async renderStoredQR() {
      try {
        this.loading = true;
        
        // Ensure canvas is ready
        if (!this.canvasReady) {
          await this.waitForCanvasElement();
        }
        
        const canvas = this.$refs.qrCanvas;
        if (!canvas) {
          throw new Error('Canvas element not found');
        }
        
        // Validate QR data
        if (!this.qrData || this.qrData.trim() === '') {
          throw new Error('No QR data to render');
        }
        
        console.log('Rendering QR with data:', this.qrData);
        
        // Set canvas size before generating QR
        canvas.width = 300;
        canvas.height = 300;
        
        // Generate QR code directly to canvas with proper options
        await QRCode.toCanvas(canvas, this.qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#2c3e50',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        
        console.log('QR code rendered successfully');
        
        // Create designed QR code for download
        await this.createDesignedQR();
        
      } catch (error) {
        console.error('Error rendering stored QR code:', error);
        this.error = `Failed to load your QR code: ${error.message}. Please refresh the page.`;
      } finally {
        this.loading = false;
      }
    },

    async generatePermanentQR(retryCount = 0) {
      const maxRetries = 3;
      
      this.loading = true;
      this.error = null;
      
      try {
        // Create unique permanent QR data for this specific user
        const timestamp = Date.now();
        const qrData = {
          type: 'user_identification',
          userId: this.userId,
          username: this.username,
          accountId: `jmg-${this.userId}-${timestamp}`,
          storeId: 'jm-garis-store',
          version: '1.0',
          createdAt: new Date().toISOString(),
          hash: this.generateUserHash(this.userId, this.username, timestamp)
        };
        
        this.qrData = JSON.stringify(qrData);
        console.log('Generated unique QR data for user:', this.qrData);
        
        // Store permanently in localStorage with user-specific key
        const userQRKey = `qr-user-${this.userId}-${this.username}`;
        localStorage.setItem(userQRKey, this.qrData);
        const currentDate = this.formatDateTime(new Date());
        localStorage.setItem(`qr-date-user-${this.userId}`, currentDate);
        this.generatedDate = currentDate;
        
        // Ensure canvas is ready
        if (!this.canvasReady) {
          await this.waitForCanvasElement();
        }
        
        // Double-check canvas exists
        const canvas = this.$refs.qrCanvas;
        if (!canvas) {
          if (retryCount < maxRetries) {
            console.warn(`Canvas not found, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            return this.generatePermanentQR(retryCount + 1);
          }
          throw new Error('Canvas element not available after retries');
        }
        
        console.log('Canvas prepared, generating unique QR code...');
        
        // Set canvas size before generating QR
        canvas.width = 300;
        canvas.height = 300;
        
        // Generate QR code directly to canvas
        await QRCode.toCanvas(canvas, this.qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#2c3e50',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        
        console.log('Unique QR code generated successfully on canvas');
        
        // Create designed QR code for download
        await this.createDesignedQR();
        
      } catch (error) {
        console.error('Error generating permanent QR code:', error);
        
        if (retryCount < maxRetries) {
          console.warn(`QR generation failed, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return this.generatePermanentQR(retryCount + 1);
        }
        
        this.error = `Failed to generate your permanent QR code: ${error.message}. Please refresh the page and try again.`;
      } finally {
        this.loading = false;
      }
    },

    async loadOrGenerateQR() {
      try {
        console.log('Starting loadOrGenerateQR...');
        console.log('User ID:', this.userId, 'Username:', this.username);
        
        // Check if we have a stored QR for this specific user
        const userQRKey = `qr-user-${this.userId}-${this.username}`;
        const storedQR = localStorage.getItem(userQRKey);
        const storedDate = localStorage.getItem(`qr-date-user-${this.userId}`);
        
        console.log('Stored QR key:', userQRKey);
        console.log('Stored QR:', storedQR);
        
        if (storedQR && storedDate) {
          // Verify the stored QR is for the current user and valid
          try {
            const parsedQR = JSON.parse(storedQR);
            if (parsedQR.userId === this.userId && parsedQR.username === this.username && parsedQR.userId !== undefined) {
              // Load existing permanent QR
              this.qrData = storedQR;
              this.generatedDate = storedDate;
              console.log('Loading existing user-specific QR data:', this.qrData);
              
              await this.$nextTick();
              await this.waitForCanvasElement();
              await this.renderStoredQR();
              return;
            } else {
              console.log('Stored QR is invalid or does not match current user, clearing and generating new one...');
              // Clear invalid stored data
              localStorage.removeItem(userQRKey);
              localStorage.removeItem(`qr-date-user-${this.userId}`);
            }
          } catch (parseError) {
            console.log('Invalid stored QR data, clearing and generating new one...');
            localStorage.removeItem(userQRKey);
            localStorage.removeItem(`qr-date-user-${this.userId}`);
          }
        }
        
        // Generate new permanent QR for this user
        console.log('No valid stored QR found, generating new unique QR...');
        await this.$nextTick();
        await this.waitForCanvasElement();
        await this.generatePermanentQR();
      } catch (error) {
        console.error('Error in loadOrGenerateQR:', error);
        this.error = `Failed to load QR code: ${error.message}`;
        this.loading = false;
      }
    },

    generateUserHash(userId, username, timestamp) {
      // Simple hash function to create unique identifier
      const str = `${userId}-${username}-${timestamp}-jmgaris`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    },

    async createDesignedQR() {
      try {
        // Ensure we have QR data
        if (!this.qrData) {
          throw new Error('No QR data available');
        }

        // Create a new canvas for the designed version
        const designCanvas = document.createElement('canvas');
        const ctx = designCanvas.getContext('2d');
        
        // Set canvas size for the designed version
        const canvasSize = 400;
        designCanvas.width = canvasSize;
        designCanvas.height = canvasSize + 120; // Extra space for text
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize + 120);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasSize, canvasSize + 120);
        
        // Header section
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, canvasSize, 60);
        
        // Store name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('JM GARIS STORE', canvasSize / 2, 35);
        
        // QR code background
        const qrBgSize = 320;
        const qrBgX = (canvasSize - qrBgSize) / 2;
        const qrBgY = 80;
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillRect(qrBgX, qrBgY, qrBgSize, qrBgSize);
        ctx.shadowColor = 'transparent';
        
        // Generate QR code data URL
        const qrDataUrl = await QRCode.toDataURL(this.qrData, {
          width: 280,
          margin: 2,
          color: {
            dark: '#2c3e50',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        
        // Load and draw QR code
        await new Promise((resolve, reject) => {
          const qrImage = new Image();
          qrImage.onload = () => {
            try {
              const qrSize = 280;
              const qrX = (canvasSize - qrSize) / 2;
              const qrY = 100;
              
              ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
              
              // Logo overlay (optional)
              const logoSize = 40;
              const logoX = (canvasSize - logoSize) / 2;
              const logoY = 100 + (qrSize - logoSize) / 2;
              
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
              
              ctx.fillStyle = '#4CAF50';
              ctx.font = 'bold 24px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('🏪', logoX + logoSize / 2, logoY + logoSize / 2 + 8);
              
              // User information
              ctx.fillStyle = '#2c3e50';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(this.username, canvasSize / 2, canvasSize + 40);
              
              ctx.font = '12px Arial';
              ctx.fillStyle = '#6c757d';
              ctx.fillText(`Member since ${this.memberSince}`, canvasSize / 2, canvasSize + 60);
              
              // Use generatedDate instead of current time for permanent QR
              ctx.fillText(`Identity QR Code`, canvasSize / 2, canvasSize + 80);
              
              // Convert to data URL for download
              this.qrDataUrl = designCanvas.toDataURL('image/png', 1.0);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          
          qrImage.onerror = () => {
            reject(new Error('Failed to load QR code image'));
          };
          
          qrImage.src = qrDataUrl;
        });
        
      } catch (error) {
        console.error('Error creating designed QR code:', error);
        // Don't throw here, as the main QR display should still work
      }
    },

    downloadQR() {
      if (!this.qrDataUrl) {
        this.error = 'QR code not ready for download';
        return;
      }
      
      try {
        const link = document.createElement('a');
        link.download = `${this.username}-points-redemption-qr.png`; // Updated filename
        link.href = this.qrDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showNotification('Points Redemption QR code downloaded successfully!', 'success');
      } catch (error) {
        console.error('Error downloading QR code:', error);
        this.error = 'Failed to download QR code';
      }
    },

    showNotification(message, type = 'success') {
      // Simple notification - you can enhance this
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
      `;
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
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
        console.error('Logout failed:', error);
      } finally {
        this.showLogoutModal = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    formatDateTime(date) {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.qr-code-page {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: Arial, sans-serif;
}

.qr-content {
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header Section */
.header-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.title-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-section h1 i {
  color: #4CAF50;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

.qr-stats {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.stat-card {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 200px;
}

.stat-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* QR Display Section */
.qr-display-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.qr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.qr-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qr-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.refresh-btn, .download-btn, .retry-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.refresh-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #495057;
}

.download-btn {
  background: #4CAF50;
  color: white;
}

.download-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.retry-btn {
  background: #dc3545;
  color: white;
}

.retry-btn:hover {
  background: #c82333;
}

.refresh-btn:disabled, .download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: auto;
  width: 100%;
}

.qr-loading {
  text-align: center;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.qr-error {
  text-align: center;
  color: #dc3545;
}

.qr-error i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.qr-display {
  text-align: center;
  width: 100%;
}

.qr-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 2rem;
  text-align: center;
}

.qr-canvas {
  border: 4px solid #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: filter 0.3s ease;
  background-color: #ffffff;
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
  width: 300px;
}

.qr-canvas-hidden {
  display: none;
}

.qr-secure-message {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
}

.secure-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.secure-icon i {
  display: block;
  line-height: 1;
}

.qr-secure-message h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.qr-secure-message p {
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
}

.qr-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: left;
}

.qr-data {
  margin-bottom: 0.5rem;
}

.qr-data code {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
}

.qr-timestamp {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.qr-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.permanent-badge {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.qr-date {
  font-size: 0.875rem;
  color: #6c757d;
}

.info-blurred .qr-data code {
  filter: blur(3px);
  user-select: none;
  transition: filter 0.3s ease;
}

/* Features Section */
.features-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.features-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin: 0 auto 1rem;
}

.feature-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
}

.feature-card p {
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
  font-size: 0.875rem;
}

/* Instructions Section */
.instructions-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.instructions-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.instructions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.instructions-grid:last-child {
  margin-bottom: 0;
}

.instruction-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 0.875rem;
}

.step-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.step-content p {
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
  font-size: 0.875rem;
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

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .container {
    max-width: 100%;
    padding: 0 1rem;
  }
  
  .qr-content {
    padding: 1.5rem 0.75rem;
  }
  
  .header-section,
  .qr-display-section,
  .features-section,
  .instructions-section {
    padding: 1.75rem;
  }
}

@media (max-width: 768px) {
  .qr-content {
    padding: 0.875rem 0.5rem;
  }

  .header-section,
  .qr-display-section,
  .features-section,
  .instructions-section {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .qr-stats {
    flex-direction: column;
    align-self: stretch;
    gap: 0.75rem;
  }

  .stat-card {
    min-width: auto;
    padding: 1rem;
    gap: 0.75rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .title-section h1 {
    font-size: 1.5rem;
    gap: 0.5rem;
  }

  .subtitle {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .qr-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 0;
  }

  .qr-header h2 {
    font-size: 1.25rem;
  }

  .qr-actions {
    justify-content: center;
    gap: 0.75rem;
  }

  .refresh-btn, .download-btn, .retry-btn {
    padding: 0.65rem 1rem;
    font-size: 0.875rem;
    flex: 1;
    justify-content: center;
  }

  .qr-container {
    min-height: auto;
  }

  .qr-secure-message {
    padding: 1.25rem;
  }

  .secure-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 3px 8px rgba(76, 175, 80, 0.3);
  }

  .qr-secure-message h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .qr-secure-message p {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .features-section h2,
  .instructions-section h2 {
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    padding: 1.25rem;
  }

  .feature-icon {
    width: 45px;
    height: 45px;
    font-size: 1.125rem;
  }

  .feature-card h3 {
    font-size: 1rem;
  }

  .feature-card p {
    font-size: 0.85rem;
  }

  .instructions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .instruction-step {
    padding: 1rem;
    gap: 0.75rem;
  }

  .step-number {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }

  .step-content h3 {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .step-content p {
    font-size: 0.85rem;
    line-height: 1.4;
  }
}

@media (max-width: 480px) {
  .qr-content {
    padding: 0.5rem 0.25rem;
  }

  .header-section,
  .qr-display-section,
  .features-section,
  .instructions-section {
    padding: 1rem;
    border-radius: 8px;
  }

  .container {
    gap: 1.25rem;
  }

  .title-section h1 {
    font-size: 1.25rem;
    gap: 0.4rem;
  }

  .title-section h1 i {
    font-size: 1.125rem;
  }

  .subtitle {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .stat-card {
    padding: 0.875rem;
    gap: 0.6rem;
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 0.9rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .qr-header h2 {
    font-size: 1.1rem;
  }

  .qr-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .refresh-btn, .download-btn, .retry-btn {
    padding: 0.625rem;
    width: 100%;
    justify-content: center;
    font-size: 0.8rem;
  }

  .qr-container {
    min-height: auto;
  }

  .qr-secure-message {
    padding: 1rem;
  }

  .secure-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
    margin-bottom: 0.875rem;
    box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
  }

  .qr-secure-message h3 {
    font-size: 1.1rem;
    margin-bottom: 0.6rem;
  }

  .qr-secure-message p {
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .features-section h2,
  .instructions-section h2 {
    font-size: 1.2rem;
    margin-bottom: 1.25rem;
  }

  .feature-card {
    padding: 1rem;
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .feature-card h3 {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }

  .feature-card p {
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .instruction-step {
    padding: 0.875rem;
    gap: 0.6rem;
  }

  .step-number {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }

  .step-content h3 {
    font-size: 0.875rem;
    margin-bottom: 0.4rem;
  }

  .step-content p {
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .qr-canvas {
    max-width: 85vw;
    max-height: 85vw;
  }
  
  .qr-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .spinner {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }

  .qr-info {
    padding: 0.75rem;
    font-size: 0.8rem;
  }

  .permanent-badge {
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
  }
}

@media (max-width: 360px) {
  .qr-content {
    padding: 0.375rem 0.125rem;
  }

  .header-section,
  .qr-display-section,
  .features-section,
  .instructions-section {
    padding: 0.875rem;
  }

  .container {
    gap: 1rem;
  }

  .title-section h1 {
    font-size: 1.125rem;
    gap: 0.3rem;
  }

  .title-section h1 i {
    font-size: 1rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .stat-card {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .stat-icon {
    font-size: 1.125rem;
  }

  .stat-value {
    font-size: 0.85rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .qr-header h2 {
    font-size: 1rem;
  }

  .refresh-btn, .download-btn, .retry-btn {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .qr-secure-message {
    padding: 0.875rem;
  }

  .secure-icon {
    width: 45px;
    height: 45px;
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
  }

  .qr-secure-message h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .qr-secure-message p {
    font-size: 0.75rem;
  }

  .features-section h2,
  .instructions-section h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .feature-card {
    padding: 0.875rem;
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
    margin-bottom: 0.6rem;
  }

  .feature-card h3 {
    font-size: 0.875rem;
    margin-bottom: 0.4rem;
  }

  .feature-card p {
    font-size: 0.75rem;
  }

  .instruction-step {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .step-number {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }

  .step-content h3 {
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
  }

  .step-content p {
    font-size: 0.7rem;
  }

  .qr-canvas {
    max-width: 80vw;
    max-height: 80vw;
  }

  .spinner {
    width: 25px;
    height: 25px;
    border-width: 2px;
  }

  .qr-info {
    padding: 0.625rem;
    font-size: 0.75rem;
  }

  .permanent-badge {
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
  }

  .qr-date {
    font-size: 0.7rem;
  }
}
</style>

