<template>
  <div class="profile-container">
    <Navbar
      :username="username"
      @logout="showLogoutModal = true"
    />

    <div class="profile-content">
    <div class="profile-layout">
      <!-- Left Column - Profile Picture Card -->
      <div class="profile-card">
      <div class="card-header">
        <h3><i class="fas fa-id-badge"></i> My Profile</h3>
      </div>
      
      <div v-if="notification.show" 
          :class="['notification', notification.type]">
        {{ notification.message }}
      </div>

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
      </div>

      <!-- Right Column - Edit Profile Card -->
      <div class="profile-card edit-profile-card">
          <div class="card-header">
          <h3><i class="fas fa-user-edit"></i> Personal Information</h3>
          <div class="button-group">
            <button v-if="isEditing" @click="discardChanges" class="discard-button">
              <i class="fas fa-times"></i>
              Discard Changes
            </button>
            <button @click="toggleEditing" class="edit-button">
              <i :class="isEditing ? 'fas fa-save' : 'fas fa-pen'"></i>
              {{ isEditing ? 'Save Changes' : 'Edit Profile' }}
            </button>
          </div>
        </div>

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
        notification: {
            show: false,
            message: '',
            type: 'success'
            
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
    profilePictureUrl() {
        if (!this.profileData.profile_picture) {
            return this.getDefaultAvatar(this.username);
        }
        // Check if URL is valid
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
    }
},
  methods: {
    getDefaultAvatar(username) {
        const encodedName = encodeURIComponent(username || 'User');
        return `https://ui-avatars.com/api/?name=${encodedName}&background=random&size=200`;
    },
    handleImageError(e) {
      e.target.onerror = null; // Prevent infinite loop
      e.target.src = getAvatarUrl(this.username);
    },
    async loadProfileImage() {
      if (this.profileData?.profile_picture) {
        this.profileImageUrl = this.profileData.profile_picture;
      } else {
        this.profileImageUrl = getAvatarUrl(this.username);
      }
    },
    showNotification(message, type = 'success') {
        this.notification = {
            show: true,
            message,
            type
        };
        setTimeout(() => {
        this.notification.show = false;
    }, 1000);
        
    },
    formatDateForDB(date) {
    if (!date) return '';
    try {
        // Handle both date strings and Date objects
        const d = new Date(date);
        if (isNaN(d.getTime())) return ''; // Invalid date
        
        // Format as YYYY-MM-DD
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
    // Show confirmation modal instead of immediate removal
    this.showRemovePhotoModal = true;
  },

  async confirmRemovePhoto() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/users/remove-profile-picture', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          this.profileData.profile_picture = null;
          this.$emit('profile-updated');
          
          // Close the modal
          this.showRemovePhotoModal = false;
          
          // Refresh the page after a short delay
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
        // Store the current profile picture
        const currentProfilePicture = this.profileData.profile_picture;
        
        // Reset editing state
        this.isEditing = false;
        
        // Fetch the original profile data
        await this.fetchProfile();
        
        // Restore the current profile picture
        this.profileData.profile_picture = currentProfilePicture;
        
        this.showNotification('Changes discarded', 'success');
      } catch (error) {
        console.error('Error discarding changes:', error);
        this.showNotification('Failed to discard changes', 'error');
      }
    },
    async fetchProfile() {
    try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:7904/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (response.ok) {
            const data = await response.json()
            
            // Format the birthdate if it exists
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
        const updateData = {
            username: this.profileData.username || '',
            firstname: this.profileData.firstname || '',
            middlename: this.profileData.middlename || null,
            lastname: this.profileData.lastname || '',
            gender: this.profileData.gender || '',
            civil_status: this.profileData.civil_status || '',
            phone_number: this.profileData.phone_number || '',
            address: this.profileData.address || '',
            birthdate: this.formatDateForDB(this.profileData.birthdate) // Format the date
        };

    // Validate required fields
    const requiredFields = ['username', 'firstname', 'lastname', 'gender', 'civil_status' ,'birthdate'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
    }

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:7904/api/users/profile', {
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
      this.showNotification('Profile updated successfully', 'success');
      
      // Store current profile picture
      const currentProfilePicture = this.profileData.profile_picture;
      
      // Fetch updated profile data
      await this.fetchProfile();
      
      // Restore profile picture
      this.profileData.profile_picture = currentProfilePicture;
    } else {
      throw new Error(data.message || 'Failed to update profile');
    }
  } catch (error) {
        console.error('Error updating profile:', error);
        this.showNotification(error.message || 'Failed to update profile. Please try again.', 'error');
    }
},
async handleProfilePictureChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7904/api/users/upload-profile-picture', {
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
            this.showNotification('Profile picture updated successfully', 'success');
            
            // Refresh the navbar to show new profile picture
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
.profile-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  
}

.profile-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.info-section {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}


.info-group {
  margin-bottom: 1.2rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}
.edit-profile-card {
  flex: 1;
}
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-weight: 500;
  margin-top: 1rem;
}
.info-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.info-group label i {
  color: #4CAF50;
  width: 20px;
}

.info-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.info-group input:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

.edit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}
.discard-button {
  background-color: #dc3545;
  color: white;
}

.edit-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}
.discard-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #dc3545;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}
.discard-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}
.info-group input[type="date"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.info-group input[type="date"]:disabled {
  background-color: #eee;
  cursor: not-allowed;
}
.notification {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    text-align: center;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
}
.notification.fade-out {
    opacity: 0;
}
.notification.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.notification.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
.select-input {
  width: 103.5%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  background-color: white;
  cursor: pointer;
}

.select-input:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

/* Add custom dropdown arrow */
.select-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.2rem center;
  background-size: 1em;
  padding-right: 2rem;
}
.profile-picture-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
.profile-picture-wrapper {
  padding-top: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.profile-picture-container {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f0f0f0; /* Fallback color while loading */
    position: relative;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    border: 4px solid white;
    transition: transform 0.3s ease;
}
.profile-picture-container:hover {
  transform: scale(1.02);
}

.picture-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.profile-picture {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden; /* Safari support */
    transform: translateZ(0); /* Force hardware acceleration */
    -webkit-transform: translateZ(0);
}

.upload-overlay {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}


.remove-picture-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}
.upload-button,
.remove-picture-button {
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  text-align: center;
}
.upload-button {
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
}
.remove-picture-button {
  background-color: #dc3545;
  color: white;
  border: none;
  cursor: pointer;
}
.upload-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}
.button-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.profile-info {
  margin-top: 2rem;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-row h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}
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

.confirm-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.confirm-btn:hover {
  background-color: #c82333;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
.profile-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  margin: 0 auto;
}
@media (max-width: 1024px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
.date-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  cursor: pointer;
}

.date-input:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

/* Fix date input appearance in various browsers */
.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  padding: 0.2rem;
}

.date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}
</style>