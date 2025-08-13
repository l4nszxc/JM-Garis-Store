<template>
  <div class="order-details-container">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="order-details-content">
      <div class="back-navigation">
        <button @click="goBack" class="back-button">
          <i class="fas fa-arrow-left"></i> Back to Orders
        </button>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading order details...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button @click="fetchOrderDetails" class="retry-button">Retry</button>
      </div>

      <div v-else-if="order" class="order-card">
        <div class="order-header">
          <h1>Order #{{ order.order_id }}</h1>
          <div class="order-status" :class="getStatusClass(order.status)">
            {{ order.status }}
          </div>
        </div>

        <div class="order-info">
          <div class="info-group">
            <div class="info-item">
              <span class="info-label">Order Date:</span>
              <span class="info-value">{{ formatDate(order.created_at) }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">₱{{ formatPrice(order.total_amount) }}</span>
            </div>
            
            <div v-if="order.payment_method" class="info-item">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">{{ order.payment_method }}</span>
            </div>
          </div>
        </div>

        <div class="order-items-container">
          <h2>Order Items</h2>
          <div class="order-items">
            <div v-for="(item, index) in order.items" :key="index" class="order-item">
              <div class="item-image-container">
               <img 
                :src="item.image || '/img/placeholder.jpg'" 
                :alt="item.product_name || item.name" 
                class="item-image"
                @error="handleImageError"
                >
              </div>
              <div class="item-details">
                <h3 class="item-name">{{ item.product_name || item.name }}</h3>
                <p v-if="item.choice_name" class="item-variant">{{ item.choice_name }}</p>
                <p class="item-price">₱{{ formatPrice(item.price) }} × {{ item.quantity }}</p>
                <p class="item-subtotal">Subtotal: ₱{{ formatPrice(item.price * item.quantity) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="order-summary">
          <h2>Order Summary</h2>
          <div class="summary-items">
            <div class="summary-item">
              <span>Subtotal:</span>
              <span>₱{{ formatPrice(calculateSubtotal()) }}</span>
            </div>
            <div v-if="order.discount_amount > 0" class="summary-item discount">
              <span>Discount:</span>
              <span>-₱{{ formatPrice(order.discount_amount) }}</span>
            </div>
            <div class="summary-item total">
              <span>Total:</span>
              <span>₱{{ formatPrice(order.total_amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Review Section (only for paid orders) -->
        <div v-if="order.status.toLowerCase() === 'paid'" class="order-review-section">
          <div v-if="orderReview" class="existing-review">
            <h2>Your Review</h2>
            <div class="review-content">
              <div class="review-header">
                <div class="star-rating">
                  <i v-for="i in 5" :key="i" class="fas fa-star" :class="{ 'filled': i <= orderReview.rating }"></i>
                </div>
                <span class="review-date">{{ formatDate(orderReview.created_at) }}</span>
              </div>
              <p class="review-comment">{{ orderReview.comment }}</p>
              <button @click="showUpdateReviewModal = true" class="edit-review-btn">
                <i class="fas fa-edit"></i> Edit Review
              </button>
            </div>
          </div>
          <div v-else class="no-review">
            <h2>Leave a Review</h2>
            <p>How was your experience with this order?</p>
            <button @click="showReviewModal = true" class="add-review-btn">
              <i class="fas fa-star"></i> Write a Review
            </button>
          </div>
        </div>

        <div class="order-actions">
          <button 
            v-if="order.status.toLowerCase() === 'pending'" 
            @click="confirmCancelOrder"
            class="cancel-button"
          >
            <i class="fas fa-times-circle"></i> Cancel Order
          </button>

          <button 
            v-if="order.status.toLowerCase() === 'paid'" 
            @click="showRepeatOrderModal"
            class="repeat-button"
          >
            <i class="fas fa-redo"></i> Repeat Order
          </button>
          
          <button 
            @click="reportIssue"
            class="report-button"
          >
            <i class="fas fa-flag"></i> Report Issue
          </button>
        </div>
      </div>

      <div v-else class="not-found-container">
        <i class="fas fa-search"></i>
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <button @click="goBack" class="back-button">Go Back to Orders</button>
      </div>
    </div>

    <!-- Cancel Order Modal -->
    <div v-if="showCancelModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Cancel Order</h3>
        <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="showCancelModal = false" class="cancel-action">No, Keep Order</button>
          <button @click="cancelOrder" class="confirm-action">Yes, Cancel Order</button>
        </div>
      </div>
    </div>

    <!-- Issue Report Modal -->
    <div v-if="showReportModal" class="modal-overlay">
      <div class="modal-content report-modal">
        <h3>Report an Issue</h3>
        <div class="form-group">
          <label for="issue-type">Issue Type</label>
          <select id="issue-type" v-model="reportData.issueType" class="form-input">
            <option value="missing-items">Missing Items</option>
            <option value="wrong-order">Wrong Order</option>
            <option value="quality-issue">Quality Issue</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="issue-description">Description</label>
          <textarea 
            id="issue-description" 
            v-model="reportData.description" 
            class="form-input"
            rows="4"
            placeholder="Please describe the issue in detail..."
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showReportModal = false" class="cancel-action">Cancel</button>
          <button @click="submitIssueReport" :disabled="isSubmittingReport" class="confirm-action">
            <span v-if="isSubmittingReport">Submitting...</span>
            <span v-else>Submit Report</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="modal-overlay">
      <div class="modal-content review-modal">
        <h3>Write a Review</h3>
        <div class="form-group">
          <label>Rating</label>
          <div class="rating-selector">
            <i 
              v-for="i in 5" 
              :key="i" 
              class="fas fa-star" 
              :class="{ 'selected': i <= reviewData.rating }"
              @click="reviewData.rating = i"
            ></i>
            <span class="rating-label">{{ getRatingLabel(reviewData.rating) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label for="review-comment">Comment</label>
          <textarea 
            id="review-comment" 
            v-model="reviewData.comment" 
            class="form-input"
            rows="4"
            placeholder="Share your experience with this order..."
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showReviewModal = false" class="cancel-action">Cancel</button>
          <button @click="submitReview" :disabled="isSubmittingReview" class="confirm-action">
            <span v-if="isSubmittingReview">Submitting...</span>
            <span v-else>Submit Review</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Update Review Modal -->
    <div v-if="showUpdateReviewModal" class="modal-overlay">
      <div class="modal-content review-modal">
        <h3>Update Your Review</h3>
        <div class="form-group">
          <label>Rating</label>
          <div class="rating-selector">
            <i 
              v-for="i in 5" 
              :key="i" 
              class="fas fa-star" 
              :class="{ 'selected': i <= reviewData.rating }"
              @click="reviewData.rating = i"
            ></i>
            <span class="rating-label">{{ getRatingLabel(reviewData.rating) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label for="review-comment-update">Comment</label>
          <textarea 
            id="review-comment-update" 
            v-model="reviewData.comment" 
            class="form-input"
            rows="4"
            placeholder="Share your experience with this order..."
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showUpdateReviewModal = false" class="cancel-action">Cancel</button>
          <button @click="updateReview" :disabled="isSubmittingReview" class="confirm-action">
            <span v-if="isSubmittingReview">Updating...</span>
            <span v-else>Update Review</span>
          </button>
        </div>
      </div>
    </div>
    <RepeatOrderModal
      :show="showRepeatModal"
      :orderId="orderId"
      :orderItems="order?.items || []"
      @close="closeRepeatModal"
      @success="handleRepeatSuccess"
      @error="handleRepeatError"
    />

    <LogoutModal 
      :show="showLogoutModal" 
      @confirm="handleLogout" 
      @cancel="showLogoutModal = false"
    />
    
    <!-- Success Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <i :class="notification.icon"></i>
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import RepeatOrderModal from '../../components/RepeatOrderModal.vue';

export default {
  name: 'OrderDetails',
  components: {
    Navbar,
    LogoutModal,
    RepeatOrderModal
  },
  data() {
    return {
      username: '',
      loading: true,
      error: null,
      order: null,
      showLogoutModal: false,
      showCancelModal: false,
      showReportModal: false,
      showReviewModal: false,
      showUpdateReviewModal: false,
      showRepeatModal: false,
      reportData: {
        issueType: 'missing-items',
        description: ''
      },
      reviewData: {
        rating: 5,
        comment: ''
      },
      orderReview: null,
      isSubmittingReport: false,
      isSubmittingReview: false,
      orderUpdateInterval: null,
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      }
    };
  },
  computed: {
    orderId() {
      return this.$route.params.id;
    }
  },
  methods: {
    showRepeatOrderModal() {
      this.showRepeatModal = true;
    },
    
    closeRepeatModal() {
      this.showRepeatModal = false;
    },
    
    handleRepeatSuccess(data) {
      this.showNotification(data.message, 'success');
      // Dispatch event to update cart count
      window.dispatchEvent(new CustomEvent('cart-updated'));
      
      // Optionally redirect to cart if user replaced cart
      if (data.replaceCart) {
        setTimeout(() => {
          this.$router.push('/cart');
        }, 1500);
      }
    },
    
    handleRepeatError(message) {
      this.showNotification(message, 'error');
    },
    markOrderNotificationAsRead() {
      try {
          const saved = localStorage.getItem('userNotifications');
          if (saved) {
          const notifications = JSON.parse(saved);
          let updated = false;
          
          // Find and mark as read any notifications for this order
          notifications.forEach(notification => {
              if (notification.type === 'order' && notification.orderId === this.orderId && !notification.read) {
              notification.read = true;
              updated = true;
              }
          });
          
          // If we updated any notifications, save and dispatch event
          if (updated) {
              localStorage.setItem('userNotifications', JSON.stringify(notifications));
              window.dispatchEvent(new CustomEvent('notifications-updated', {
              detail: { notifications }
              }));
          }
          }
      } catch (error) {
          console.error('Error updating notification read status:', error);
      }
    },
    
    async getUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        // Get username from token
        const decoded = JSON.parse(atob(token.split('.')[1]));
        this.username = decoded.username;
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    },
    
    async fetchOrderDetails() {
      this.loading = true;
      this.error = null;
      
      try {
          const token = localStorage.getItem('token');
          if (!token) {
          this.$router.push('/login');
          return;
          }

          // Changed endpoint to match the pattern used elsewhere in the application
          const response = await this.$fetch('/api/orders/user', {
          headers: {
              'Authorization': `Bearer ${token}`
          }
          });

          if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
          return;
          }
          
          // Get all orders and filter for the specific one we want
          const orders = await response.json();
          const order = orders.find(o => o.order_id === this.orderId);
          
          if (!order) {
          this.order = null; // Order not found
          } else {
          this.order = order;
          
          // If order status is paid, fetch review info
          if (order.status.toLowerCase() === 'paid') {
            this.fetchOrderReview();
          }
          }
      } catch (error) {
          console.error('Error fetching order details:', error);
          this.error = 'Failed to load order details. Please try again.';
      } finally {
          this.loading = false;
      }
    },
    
    async fetchOrderReview() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/orders/${this.orderId}/review`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.review) {
            this.orderReview = data.review;
            
            // Pre-populate review data for potential updates
            this.reviewData.rating = this.orderReview.rating;
            this.reviewData.comment = this.orderReview.comment;
          } else {
            this.orderReview = null;
          }
        } else if (response.status !== 404) {
          console.error('Error fetching review:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching order review:', error);
      }
    },
    
    formatDate(dateString) {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    },
    
    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    },
    
    calculateSubtotal() {
      if (!this.order || !this.order.items) return 0;
      return this.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    getStatusClass(status) {
      status = status.toLowerCase();
      if (status === 'pending') return 'status-pending';
      if (status === 'preparing') return 'status-preparing';
      if (status === 'ready for pickup') return 'status-ready';
      if (status === 'paid') return 'status-paid';
      if (status === 'cancelled') return 'status-cancelled';
      return '';
    },
    
    handleImageError(e) {
      // Use the same placeholder as other components
      e.target.src = '/img/placeholder.jpg';
    },
    
    goBack() {
      this.$router.push('/track-orders');
    },
    
    confirmCancelOrder() {
      this.showCancelModal = true;
    },
    
    async cancelOrder() {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/orders/${this.orderId}/cancel`, {
          method: 'POST',  
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'Customer cancelled'  
          })
        });

        if (!response.ok) {
          throw new Error('Failed to cancel order');
        }

        // Update the order status locally
        this.order.status = 'Cancelled';
        
        // Dispatch event to refresh orders in other components
        window.dispatchEvent(new Event('orders-updated'));
        
        // Hide the modal
        this.showCancelModal = false;
        
        // Show success notification
        this.showNotification('Order cancelled successfully', 'success', 'fas fa-check-circle');
      } catch (error) {
        console.error('Error cancelling order:', error);
        this.showNotification('Failed to cancel the order', 'error', 'fas fa-exclamation-circle');
      }
    },
    
    reportIssue() {
      this.reportData = {
        issueType: 'missing-items',
        description: ''
      };
      this.showReportModal = true;
    },
    
    async submitIssueReport() {
      try {
        if (!this.reportData.description.trim()) {
          this.showNotification('Please provide a description of the issue', 'error', 'fas fa-exclamation-circle');
          return;
        }
        
        this.isSubmittingReport = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/orders/${this.orderId}/report`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            issue_type: this.reportData.issueType,
            description: this.reportData.description
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit report');
        }

        // Hide the modal
        this.showReportModal = false;
        
        // Show success message
        this.showNotification('Your report has been submitted. Our team will review it shortly.', 'success', 'fas fa-check-circle');
      } catch (error) {
        console.error('Error submitting report:', error);
        this.showNotification('Failed to submit report. Please try again.', 'error', 'fas fa-exclamation-circle');
      } finally {
        this.isSubmittingReport = false;
      }
    },
    
    getRatingLabel(rating) {
      const labels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
      };
      return labels[rating] || '';
    },
    
    async submitReview() {
      try {
        if (this.reviewData.rating < 1) {
          this.showNotification('Please select a rating', 'error', 'fas fa-exclamation-circle');
          return;
        }
        
        this.isSubmittingReview = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/orders/${this.orderId}/review`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: this.reviewData.rating,
            comment: this.reviewData.comment
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit review');
        }

        // Fetch the updated review
        await this.fetchOrderReview();
        
        // Hide the modal
        this.showReviewModal = false;
        
        // Show success message
        this.showNotification('Thank you for your review!', 'success', 'fas fa-check-circle');
      } catch (error) {
        console.error('Error submitting review:', error);
        this.showNotification('Failed to submit review. Please try again.', 'error', 'fas fa-exclamation-circle');
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    async updateReview() {
      try {
        if (this.reviewData.rating < 1) {
          this.showNotification('Please select a rating', 'error', 'fas fa-exclamation-circle');
          return;
        }
        
        this.isSubmittingReview = true;
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/orders/${this.orderId}/review`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: this.reviewData.rating,
            comment: this.reviewData.comment
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update review');
        }

        // Fetch the updated review
        await this.fetchOrderReview();
        
        // Hide the modal
        this.showUpdateReviewModal = false;
        
        // Show success message
        this.showNotification('Your review has been updated!', 'success', 'fas fa-check-circle');
      } catch (error) {
        console.error('Error updating review:', error);
        this.showNotification('Failed to update review. Please try again.', 'error', 'fas fa-exclamation-circle');
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    showNotification(message, type = 'success', icon = 'fas fa-check-circle') {
      this.notification = {
        show: true,
        message,
        type,
        icon
      };
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        this.notification.show = false;
      }, 5000);
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
    
    setupOrderUpdateInterval() {
      // Check for order updates every 30 seconds
      this.orderUpdateInterval = setInterval(this.fetchOrderDetails, 30000);
    },
    
    clearOrderUpdateInterval() {
      if (this.orderUpdateInterval) {
        clearInterval(this.orderUpdateInterval);
        this.orderUpdateInterval = null;
      }
    }
  },
  
  mounted() {
    this.getUserData();
    this.fetchOrderDetails();
    this.setupOrderUpdateInterval();
    
    // Mark notification as read for this order if it exists
    this.markOrderNotificationAsRead();
  },
  
  beforeUnmount() {
    this.clearOrderUpdateInterval();
  }
}
</script>

<style scoped>
.order-details-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.order-details-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.back-navigation {
  margin-bottom: 1.5rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #4CAF50;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #e8f5e9;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-container i {
  color: #dc3545;
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #388e3c;
}

.order-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #2c3e50;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-preparing {
  background-color: #cce5ff;
  color: #004085;
}

.status-ready {
  background-color: #d4edda;
  color: #155724;
}

.status-paid {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.order-info {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.info-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.order-items-container {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-items-container h2 {
  font-size: 1.25rem;
  margin: 0 0 1rem;
  color: #2c3e50;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-image-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  flex: 1;
}

.item-name {
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
  color: #2c3e50;
}

.item-variant {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  font-style: italic;
}

.item-price {
  color: #6c757d;
  margin: 0 0 0.25rem;
}

.item-subtotal {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.order-summary {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-summary h2 {
  font-size: 1.25rem;
  margin: 0 0 1rem;
  color: #2c3e50;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.summary-item.discount {
  color: #dc3545;
}

.summary-item.total {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 0.5rem;
}

/* Order Review Section */
.order-review-section {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-review-section h2 {
  font-size: 1.25rem;
  margin: 0 0 1rem;
  color: #2c3e50;
}

.existing-review .review-content {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.star-rating {
  display: flex;
  gap: 0.25rem;
}

.star-rating i {
  color: #e0e0e0;
}

.star-rating i.filled {
  color: #ffca28;
}

.review-date {
  font-size: 0.85rem;
  color: #6c757d;
}

.review-comment {
  margin: 0;
  font-size: 0.95rem;
  color: #2c3e50;
  line-height: 1.5;
}

.edit-review-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border: 1px solid #ced4da;
  border-radius: 4px;
  color: #4CAF50;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.edit-review-btn:hover {
  background-color: #e8f5e9;
  border-color: #4CAF50;
}

.no-review {
  text-align: center;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.no-review p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.add-review-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.add-review-btn:hover {
  background-color: #388e3c;
}

.order-actions {
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button, .report-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.cancel-button {
  background-color: #f8d7da;
  color: #721c24;
}

.cancel-button:hover {
  background-color: #f5c6cb;
}

.report-button {
  background-color: #fff3cd;
  color: #856404;
}

.report-button:hover {
  background-color: #ffeeba;
}

.not-found-container {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.not-found-container i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.not-found-container h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.not-found-container p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 1rem;
  color: #2c3e50;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-action {
  padding: 0.75rem 1.25rem;
  border: 1px solid #6c757d;
  background: none;
  color: #6c757d;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-action:hover {
  background-color: #f8f9fa;
}

.confirm-action {
  padding: 0.75rem 1.25rem;
  border: none;
  background-color: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-action:hover {
  background-color: #388e3c;
}

.confirm-action:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.report-modal, .review-modal {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.rating-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rating-selector i {
  font-size: 1.5rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rating-selector i:hover,
.rating-selector i.selected {
  color: #ffca28;
}

.rating-label {
  margin-left: 0.5rem;
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 500;
}

.notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1001;
  animation: slide-in 0.3s ease-out;
  max-width: 350px;
}

.notification.success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.notification.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}
.repeat-button {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.repeat-button:hover {
  background-color: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .order-details-content {
    padding: 1rem;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .order-status {
    align-self: flex-start;
  }
  
  .info-group {
    flex-direction: column;
    gap: 1rem;
  }
  
  .order-item {
    flex-direction: column;
  }
  
  .item-image-container {
    width: 100%;
    height: 200px;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .cancel-button, .report-button {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-action, .confirm-action {
    width: 100%;
  }
  
  .notification {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>

