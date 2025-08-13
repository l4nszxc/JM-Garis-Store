<template>
  <div class="profile-container">
    <Navbar
      :username="username"
      @logout="showLogoutModal = true"
    />

    <div class="profile-content">
      <!-- Enhanced Notification -->
      <div v-if="notification.show" class="notification" :class="notification.type">
        <div class="notification-content">
          <i :class="notification.icon"></i>
          {{ notification.message }}
        </div>
        <button class="notification-close" @click="hideNotification">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="profile-layout">
        <!-- Single Column Layout -->
        <div class="profile-main">
          <!-- Personal Information Card with Profile Picture -->
          <div class="profile-card">
            <div class="card-header">
              <h3><i class="fas fa-user-edit"></i> Personal Information</h3>
              <div class="button-group">
                <button v-if="isEditing" @click="discardChanges" class="discard-button">
                  <i class="fas fa-times"></i>
                  Discard Changes
                </button>
                <button @click="toggleEditing" class="edit-button" :disabled="isUpdatingProfile">
                  <i :class="isUpdatingProfile ? 'fas fa-spinner fa-spin' : (isEditing ? 'fas fa-save' : 'fas fa-pen')"></i>
                  {{ isUpdatingProfile ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile') }}
                </button>
              </div>
            </div>

            <!-- Profile Picture Section -->
            <div class="profile-picture-section">
              <div class="profile-picture-wrapper">
                <div class="profile-picture-container">
                  <img
                    :src="profileImageUrl"
                    :alt="username"
                    class="profile-picture"
                    @error="handleImageError"
                    crossorigin="anonymous"
                  />
                </div>
                
                <div class="picture-buttons">
                  <label for="profile-picture-input" class="upload-button">
                    <i class="fas fa-camera"></i>
                    Change Picture
                  </label>
                  <button 
                    v-if="profileData.profile_picture" 
                    @click="removeProfilePicture" 
                    class="remove-picture-button"
                  >
                    <i class="fas fa-trash"></i>
                    Remove Picture
                  </button>
                  <input
                    type="file"
                    id="profile-picture-input"
                    accept="image/*"
                    @change="handleProfilePictureChange"
                    style="display: none"
                  >
                </div>
              </div>
            </div>

            <!-- Profile Information Grid -->
            <div class="profile-grid">
              <!-- Basic Information -->
              <div class="info-section">
                <div class="info-group">
                  <label><i class="fas fa-user"></i> Username</label>
                  <input
                    type="text"
                    v-model="profileData.username"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-user-circle"></i> First Name</label>
                  <input
                    type="text"
                    v-model="profileData.firstname"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-user-circle"></i> Middle Name</label>
                  <input
                    type="text"
                    v-model="profileData.middlename"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-user-circle"></i> Last Name</label>
                  <input
                    type="text"
                    v-model="profileData.lastname"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-venus-mars"></i> Gender</label>
                  <select
                    v-model="profileData.gender"
                    :disabled="!isEditing"
                    class="select-input"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="info-section">
                <div class="info-group">
                  <label><i class="fas fa-phone"></i> Phone Number</label>
                  <input
                    type="text"
                    v-model="profileData.phone_number"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-home"></i> Address</label>
                  <input
                    type="text"
                    v-model="profileData.address"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="info-group">
                  <label><i class="fas fa-heart"></i> Civil Status</label>
                  <select
                    v-model="profileData.civil_status"
                    :disabled="!isEditing"
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
                <div class="info-group">
                  <label><i class="fas fa-birthday-cake"></i> Birthdate</label>
                  <input
                    type="date"
                    v-model="profileData.birthdate"
                    :disabled="!isEditing"
                    class="date-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Change Password Card -->
          <div class="profile-card">
            <div class="card-header">
              <h3><i class="fas fa-lock"></i> Change Password</h3>
            </div>

            <form @submit.prevent="changePassword" class="password-form">
              <div class="password-grid">
                <div class="info-group">
                  <label><i class="fas fa-key"></i> Current Password</label>
                  <div class="password-input-container">
                    <input
                      :type="showCurrentPassword ? 'text' : 'password'"
                      v-model="passwordData.currentPassword"
                      placeholder="Enter current password"
                      required
                      class="password-input"
                    />
                    <button 
                      type="button" 
                      @click="showCurrentPassword = !showCurrentPassword"
                      class="password-toggle"
                    >
                      <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>
                
                <div class="info-group">
                  <label><i class="fas fa-lock"></i> New Password</label>
                  <div class="password-input-container">
                    <input
                      :type="showNewPassword ? 'text' : 'password'"
                      v-model="passwordData.newPassword"
                      placeholder="Enter new password"
                      required
                      class="password-input"
                      @input="validatePassword"
                    />
                    <button 
                      type="button" 
                      @click="showNewPassword = !showNewPassword"
                      class="password-toggle"
                    >
                      <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
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
                
                <div class="info-group">
                  <label><i class="fas fa-lock"></i> Confirm New Password</label>
                  <div class="password-input-container">
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      v-model="passwordData.confirmPassword"
                      placeholder="Confirm new password"
                      required
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
                  <div v-if="passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword" class="password-error">
                    <i class="fas fa-times"></i> Passwords do not match
                  </div>
                </div>
              </div>
              
              <div class="password-actions">
                <button 
                  type="submit" 
                  class="change-password-btn"
                  :disabled="!isPasswordValid || isChangingPassword"
                >
                  <i :class="isChangingPassword ? 'fas fa-spinner fa-spin' : 'fas fa-shield-alt'"></i>
                  {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <LogoutModal
      :show="showLogoutModal"
      @confirm="handleLogout"
      @cancel="showLogoutModal = false"
    />

    <div v-if="showRemovePhotoModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Remove Profile Picture</h3>
        <p>Are you sure you want to remove your profile picture?</p>
        <div class="modal-buttons">
          <button @click="confirmRemovePhoto" class="confirm-btn">Yes, Remove</button>
          <button @click="showRemovePhotoModal = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue'
import LogoutModal from '../../components/LogoutModal.vue'
import { getAvatarUrl } from '../../utils/avatarHandler.js';

export default {
  name: 'Profile',
  components: {
    Navbar,
    LogoutModal,
    profileImageUrl: '',
  },
  data() {
    return {
      username: '',
      defaultProfilePicture: 'https://ui-avatars.com/api/?name=' + this.username + '&background=random',
      showLogoutModal: false,
      isEditing: false,
      showRemovePhotoModal: false,
      isUpdatingProfile: false,
      isChangingPassword: false,
      
      // Password visibility toggles
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      
      // Password data
      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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
        type: 'success',
        icon: 'fas fa-check-circle'
      },
      
      profileData: {
        username: '',
        firstname: '',
        middlename: '',
        lastname: '',
        gender: '',
        civil_status: '',
        phone_number: '',
        address: '',
        birthdate: '', 
        created_at: '',
        role: ''
      }
    }
  },
  computed: {
    profileImageUrl() {
      if (!this.profileData.profile_picture) {
        return this.getDefaultAvatar(this.username);
      }
      try {
        new URL(this.profileData.profile_picture);
        return this.profileData.profile_picture;
      } catch (e) {
        return this.getDefaultAvatar(this.username);
      }
    },
    
    formattedBirthdate: {
      get() {
        if (!this.profileData.birthdate) return '';
        return this.formatDateForDB(this.profileData.birthdate);
      },
      set(value) {
        this.profileData.birthdate = value;
      }
    },
    
    isPasswordValid() {
      return this.passwordValidation.length && 
             this.passwordValidation.number && 
             this.passwordValidation.letter &&
             this.passwordData.newPassword === this.passwordData.confirmPassword &&
             this.passwordData.currentPassword.length > 0;
    }
  },
  
  methods: {
    getDefaultAvatar(username) {
      const encodedName = encodeURIComponent(username || 'User');
      return `https://ui-avatars.com/api/?name=${encodedName}&background=random&size=200`;
    },
    
    handleImageError(e) {
      e.target.onerror = null;
      e.target.src = getAvatarUrl(this.username);
    },
    
    async loadProfileImage() {
      if (this.profileData?.profile_picture) {
        this.profileImageUrl = this.profileData.profile_picture;
      } else {
        this.profileImageUrl = getAvatarUrl(this.username);
      }
    },
    
    showNotification(message, type = 'success', icon = null) {
      // Auto-set icon based on type if not provided
      if (!icon) {
        switch (type) {
          case 'success':
            icon = 'fas fa-check-circle';
            break;
          case 'error':
            icon = 'fas fa-exclamation-circle';
            break;
          case 'warning':
            icon = 'fas fa-exclamation-triangle';
            break;
          case 'info':
            icon = 'fas fa-info-circle';
            break;
          default:
            icon = 'fas fa-bell';
        }
      }

      this.notification = {
        show: true,
        message,
        type,
        icon
      };
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideNotification();
      }, 5000);
    },

    hideNotification() {
      this.notification.show = false;
    },
    
    validatePassword() {
      const password = this.passwordData.newPassword;
      this.passwordValidation.show = password.length > 0;
      this.passwordValidation.length = password.length >= 8;
      this.passwordValidation.number = /\d/.test(password);
      this.passwordValidation.letter = /[a-zA-Z]/.test(password);
    },
    
    async changePassword() {
      try {
        if (!this.isPasswordValid) {
          throw new Error('Please ensure all password requirements are met');
        }

        this.isChangingPassword = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: this.passwordData.currentPassword,
            newPassword: this.passwordData.newPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          this.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          this.passwordValidation.show = false;
          this.showNotification('Password updated successfully! Your account is now more secure.', 'success', 'fas fa-shield-alt');
        } else {
          throw new Error(data.message || 'Failed to update password');
        }
      } catch (error) {
        console.error('Error changing password:', error);
        this.showNotification(error.message || 'Failed to update password. Please try again.', 'error', 'fas fa-exclamation-triangle');
      } finally {
        this.isChangingPassword = false;
      }
    },
    
    formatDateForDB(date) {
      if (!date) return '';
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    },
    
    formatFullName(firstname, middlename, lastname) {
      const middle = middlename ? ` ${middlename} ` : ' '
      return firstname && lastname ? `${firstname}${middle}${lastname}` : 'N/A'
    },
    
    capitalizeFirst(str) {
      if (!str) return 'N/A'
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },
    
    formatDate(date) {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    async removeProfilePicture() {
      this.showRemovePhotoModal = true;
    },

    async confirmRemovePhoto() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/remove-profile-picture', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          this.profileData.profile_picture = null;
          this.$emit('profile-updated');
          
          this.showRemovePhotoModal = false;
          this.showNotification('Profile picture removed successfully', 'success', 'fas fa-trash');
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          throw new Error('Failed to remove profile picture');
        }
      } catch (error) {
        console.error('Error removing profile picture:', error);
        this.showNotification('Failed to remove profile picture', 'error');
        this.showRemovePhotoModal = false;
      }
    },
    
    async discardChanges() {
      try {
        const currentProfilePicture = this.profileData.profile_picture;
        this.isEditing = false;
        await this.fetchProfile();
        this.profileData.profile_picture = currentProfilePicture;
        this.showNotification('Changes discarded successfully', 'info', 'fas fa-undo');
      } catch (error) {
        console.error('Error discarding changes:', error);
        this.showNotification('Failed to discard changes', 'error');
      }
    },
    
    async fetchProfile() {
      try {
        const token = localStorage.getItem('token')
        const response = await this.$fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.birthdate) {
            data.birthdate = this.formatDateForDB(data.birthdate);
          }
   
          this.profileData = data;
          this.username = data.username;
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
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
        console.error('Error during logout:', error);
      } finally {
        this.showLogoutModal = false;
      }
    },
    
    toggleEditing() {
      this.isEditing = !this.isEditing;
      if (!this.isEditing) {
        this.saveProfile();
      }
    },
    
    async saveProfile() {
      try {
        this.isUpdatingProfile = true;
        const updateData = {
          username: this.profileData.username || '',
          firstname: this.profileData.firstname || '',
          middlename: this.profileData.middlename || null,
          lastname: this.profileData.lastname || '',
          gender: this.profileData.gender || '',
          civil_status: this.profileData.civil_status || '',
          phone_number: this.profileData.phone_number || '',
          address: this.profileData.address || '',
          birthdate: this.formatDateForDB(this.profileData.birthdate)
        };

        const requiredFields = ['username', 'firstname', 'lastname', 'gender', 'civil_status' ,'birthdate'];
        const missingFields = requiredFields.filter(field => !updateData[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          
          this.isEditing = false;
          this.showNotification('Profile updated successfully! Your information has been saved.', 'success', 'fas fa-user-check');
          
          const currentProfilePicture = this.profileData.profile_picture;
          await this.fetchProfile();
          this.profileData.profile_picture = currentProfilePicture;
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        this.showNotification(error.message || 'Failed to update profile. Please try again.', 'error', 'fas fa-exclamation-triangle');
      } finally {
        this.isUpdatingProfile = false;
      }
    },
    
    async handleProfilePictureChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const token = localStorage.getItem('token');
        const response = await this.$fetch('/api/users/upload-profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          this.profileData.profile_picture = data.imageUrl;
          this.$emit('profile-updated');
          this.showNotification('Profile picture updated successfully!', 'success', 'fas fa-camera');
          
          window.dispatchEvent(new Event('profile-updated'));
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        this.showNotification('Failed to upload profile picture', 'error');
      }
    }
  },
  
  watch: {
    profileData: {
      immediate: true,
      handler() {
        this.loadProfileImage();
      }
    }
  },
  
  mounted() {
    this.fetchProfile()
  }
}
</script>

<style scoped>
/* Base Styles */
.profile-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #2a3f2a;
}

.profile-content {
  width: 100%;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 0 auto;
}

.profile-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #4CAF50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  margin: 0;
  color: #1e5b1e;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header h3 i {
  color: #4CAF50;
}

/* Enhanced Notification Styles - Updated to bottom right */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 400px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  transform: translateX(100%);
  animation: slideInRight 0.3s ease-out forwards;
  border-left: 4px solid;
}

.notification.success {
  background: linear-gradient(135deg, #f1f9f1 0%, #e8f5e8 100%);
  color: #1e5b1e;
  border-left-color: #4CAF50;
}

.notification.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #991b1b;
  border-left-color: #dc3545;
}

.notification.warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #92400e;
  border-left-color: #f59e0b;
}

.notification.info {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-left-color: #3b82f6;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.4;
}

.notification-content i {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.notification-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.notification-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Profile Picture Section */
.profile-picture-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.profile-picture-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.profile-picture-container {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f9fff9;
  position: relative;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
  border: 4px solid white;
  transition: transform 0.3s ease;
}

.profile-picture-container:hover {
  transform: scale(1.02);
}

.profile-picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.picture-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.upload-button,
.remove-picture-button {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  text-align: center;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

.upload-button {
  background-color: #4CAF50;
  color: white;
}

.upload-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.remove-picture-button {
  background-color: #dc3545;
  color: white;
}

.remove-picture-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

/* Button Groups */
.button-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.edit-button,
.discard-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.edit-button {
  background-color: #4CAF50;
  color: white;
}

.edit-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
}

.edit-button:disabled {
  background-color: #c8e6c9;
  cursor: not-allowed;
  transform: none;
}

.discard-button {
  background-color: #dc3545;
  color: white;
}

.discard-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

/* Form Sections */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #5a675a;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.info-group label i {
  color: #4CAF50;
  width: 20px;
  text-align: center;
}

.info-group input,
.select-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: white;
  box-sizing: border-box;
}

.info-group input:focus,
.select-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  outline: none;
}

.info-group input:disabled,
.select-input:disabled {
  background-color: #f9fff9;
  cursor: not-allowed;
  color: #666;
}

.select-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234CAF50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
  padding-right: 2.5rem;
  cursor: pointer;
}

.date-input {
  cursor: pointer;
}

.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  padding: 0.2rem;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Password Section */
.password-form {
  width: 100%;
}

.password-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: white;
  box-sizing: border-box;
}

.password-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  outline: none;
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
  color: #4CAF50;
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

.password-error {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #dc3545;
}

.password-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.change-password-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.change-password-btn:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.change-password-btn:disabled {
  background-color: #c8e6c9;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Modal */
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
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #1e5b1e;
}

.modal-content p {
  margin: 0 0 1.5rem 0;
  color: #5a675a;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.confirm-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .profile-content {
    padding: 1.5rem;
  }
  
  .notification {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 768px) {
  .profile-content {
    padding: 1rem;
  }
  
  .profile-grid,
  .password-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .button-group {
    width: 100%;
    justify-content: flex-start;
  }
  
  .password-actions {
    justify-content: center;
  }
  
  .picture-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .upload-button,
  .remove-picture-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .profile-picture-container {
    width: 120px;
    height: 120px;
  }
  
  .profile-card {
    padding: 1.5rem;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
  }
  
  .edit-button,
  .discard-button,
  .change-password-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }
  
  .notification {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    padding: 1rem;
  }
}
</style>


