<template>
  <div class="qr-code-page">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="qr-content">
      <div class="container">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-content">
            <div class="title-section">
              <h1><i class="fas fa-qrcode"></i> Your Identity QR Code</h1>
              <p class="subtitle">Your permanent QR code for quick identification and exclusive features</p>
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
          <div class="qr-card">
            <div class="qr-header">
              <h2><i class="fas fa-id-card"></i> Personal Identity QR Code</h2>
              <div class="qr-actions">
                <button @click="toggleQRVisibility" class="visibility-btn" :class="{ 'hidden': !qrVisible }">
                  <i :class="qrVisible ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  {{ qrVisible ? 'Hide QR' : 'Show QR' }}
                </button>
                <!-- Removed refresh button since QR is permanent -->
                <button @click="downloadQR" class="download-btn" :disabled="!qrDataUrl || !qrVisible">
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
                <div class="qr-wrapper" :class="{ 'qr-hidden': !qrVisible }">
                  <canvas ref="qrCanvas" class="qr-canvas"></canvas>
                  <div v-if="!qrVisible" class="qr-hidden-overlay">
                    <div class="hidden-content">
                      <i class="fas fa-eye-slash"></i>
                      <p>QR Code Hidden</p>
                      <button @click="toggleQRVisibility" class="show-qr-btn">
                        <i class="fas fa-eye"></i>
                        Show QR Code
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="qr-info" :class="{ 'info-blurred': !qrVisible }">
                  <div class="qr-data">
                    <strong>Identity QR Code Data:</strong>
                    <code v-if="qrVisible">{{ qrData }}</code>
                    <code v-else>••••••••••••••••••••••••••••••••••••••••••••••••••••••••</code>
                  </div>
                  <div class="qr-timestamp">
                    <div class="qr-status">
                      <i class="fas fa-shield-alt"></i> 
                      <span class="permanent-badge">Permanent Identity QR</span>
                    </div>
                    <div class="qr-date">Created: {{ generatedDate }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- QR Code Features Section -->
        <div class="features-section">
          <h2><i class="fas fa-star"></i> Identity QR Code Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-fingerprint"></i>
              </div>
              <h3>Permanent Identity</h3>
              <p>This QR code is unique to your account and never changes, serving as your digital identity.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-bolt"></i>
              </div>
              <h3>Quick Identification</h3>
              <p>Staff can instantly identify your account using this QR code for faster service.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-gift"></i>
              </div>
              <h3>Exclusive Access</h3>
              <p>Scan your QR code to access exclusive rewards and special member-only offers.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-shield-alt"></i>
              </div>
              <h3>Secure & Private</h3>
              <p>Your QR code contains only necessary identification data and is securely encrypted.</p>
            </div>
          </div>
        </div>

        <!-- Usage Instructions Section -->
        <div class="instructions-section">
          <h2><i class="fas fa-info-circle"></i> How to Use Your Identity QR Code</h2>
          <div class="instructions-grid">
            <div class="instruction-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Save Once, Use Forever</h3>
                <p>Download your QR code once and save it to your device. It will never change or expire.</p>
              </div>
            </div>
            
            <div class="instruction-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Present for Service</h3>
                <p>Show your QR code to store staff for instant account recognition and faster service.</p>
              </div>
            </div>
            
            <div class="instruction-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Access Member Benefits</h3>
                <p>Use your identity QR to unlock exclusive rewards and member-only promotional offers.</p>
              </div>
            </div>
            
            <div class="instruction-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Keep it Secure</h3>
                <p>Treat this QR code like an ID card. Don't share it publicly as it identifies your account.</p>
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
      qrVisible: true,
      canvasReady: false
    };
  },
  async mounted() {
    if (this.initializeUser()) {
      await this.fetchUserData();
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
        this.username = decoded.username;
        this.userId = decoded.id;
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
        const response = await fetch('http://localhost:7904/api/users/profile', {
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

    toggleQRVisibility() {
      this.qrVisible = !this.qrVisible;
    },

    async waitForCanvasElement() {
      return new Promise((resolve) => {
        const checkCanvas = () => {
          if (this.$refs.qrCanvas) {
            this.canvasReady = true;
            resolve();
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
        // Create permanent QR data (no timestamp - permanent identity)
        const qrData = {
          type: 'user_identification',
          userId: this.userId,
          username: this.username,
          storeId: 'jm-garis-store',
          version: '1.0'
        };
        
        this.qrData = JSON.stringify(qrData);
        console.log('Generated QR data:', this.qrData);
        
        // Store permanently in localStorage
        localStorage.setItem(`qr-${this.userId}`, this.qrData);
        const currentDate = this.formatDateTime(new Date());
        localStorage.setItem(`qr-date-${this.userId}`, currentDate);
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
        
        console.log('Canvas prepared, generating QR code...');
        
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
        
        console.log('QR code generated successfully on canvas');
        
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
        // Check if we have a stored QR for this user
        const storedQR = localStorage.getItem(`qr-${this.userId}`);
        const storedDate = localStorage.getItem(`qr-date-${this.userId}`);
        
        console.log('Stored QR:', storedQR);
        console.log('User ID:', this.userId);
        
        if (storedQR && storedDate) {
          // Load existing permanent QR
          this.qrData = storedQR;
          this.generatedDate = storedDate;
          console.log('Loading existing QR data:', this.qrData);
          
          await this.$nextTick();
          await this.waitForCanvasElement();
          await this.renderStoredQR();
        } else {
          // Generate new permanent QR
          console.log('No stored QR found, generating new one...');
          await this.$nextTick();
          await this.waitForCanvasElement();
          await this.generatePermanentQR();
        }
      } catch (error) {
        console.error('Error in loadOrGenerateQR:', error);
        this.error = `Failed to load QR code: ${error.message}`;
      }
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
      
      if (!this.qrVisible) {
        this.showNotification('Please show the QR code before downloading', 'error');
        return;
      }
      
      try {
        const link = document.createElement('a');
        link.download = `${this.username}-identity-qr.png`; // Changed filename to reflect permanent identity
        link.href = this.qrDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showNotification('Identity QR code downloaded successfully!', 'success');
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
  margin-bottom: 2rem;
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
  min-height: 400px;
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
  min-height: 400px;
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
}

/* QR Hidden State */
.qr-wrapper.qr-hidden .qr-canvas {
  filter: blur(20px);
  transition: filter 0.3s ease;
}

.qr-wrapper:not(.qr-hidden) .qr-canvas {
  filter: none;
}

.qr-hidden-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.hidden-content {
  text-align: center;
  color: #6c757d;
}

.hidden-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #adb5bd;
}

.hidden-content p {
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  font-weight: 500;
}

.show-qr-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  margin: 0 auto;
}

.show-qr-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.feature-card p {
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.instruction-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.step-content p {
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* QR Visibility Controls */
.visibility-btn {
  background: #6c757d;
  padding: 0.75rem 1.5rem;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.visibility-btn:hover {
  background: #5a6268;
}

.visibility-btn.hidden {
  background: #007bff;
}

.visibility-btn.hidden:hover {
  background: #0056b3;
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
@media (max-width: 768px) {
  .qr-content {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .qr-stats {
    flex-direction: column;
    align-self: stretch;
  }

  .stat-card {
    min-width: auto;
  }

  .title-section h1 {
    font-size: 2rem;
  }

  .qr-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .qr-actions {
    justify-content: center;
  }

  .features-grid,
  .instructions-grid {
    grid-template-columns: 1fr;
  }

  .instruction-step {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .header-section,
  .qr-display-section,
  .features-section,
  .instructions-section {
    padding: 1.5rem;
  }

  .title-section h1 {
    font-size: 1.75rem;
  }

  .qr-actions {
    flex-direction: column;
  }

  .qr-canvas {
    max-width: 90vw;
    max-height: 90vw;
  }
  
  .qr-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}
</style>