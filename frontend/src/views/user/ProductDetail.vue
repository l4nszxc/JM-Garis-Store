<template>
  <div class="product-detail-container">
    <Navbar :username="username" @logout="showLogoutModal = true" />
    
    <div class="content-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading product details...
      </div>
      
      <div v-else-if="!product" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Product not found or has been removed.
        <router-link to="/products" class="back-btn">
          <i class="fas fa-arrow-left"></i> Back to Products
        </router-link>
      </div>

      <div v-else class="product-detail-content">
        <!-- Breadcrumb Navigation -->
        <div class="breadcrumb">
          <router-link to="/">Home</router-link> / 
          <router-link to="/products">Products</router-link> /
          <span>{{ product.name }}</span>
        </div>

        <div class="product-main">
          <!-- Product Image Gallery -->
          <div class="product-gallery">
            <div class="main-image-container">
              <img 
                :src="currentImage || '/img/placeholder.jpg'" 
                :alt="product.name" 
                class="main-image" 
                @error="handleImageError"
              />
              <span v-if="parseInt(product.total_sold) > 0" class="sold-badge">
                <i class="fas fa-fire"></i> {{ parseInt(product.total_sold) }} sold
              </span>
            </div>
            
            <!-- Show thumbnails when product has choices with images -->
            <div v-if="hasMultipleImages" class="image-thumbnails">
              <div 
                class="thumbnail-container" 
                :class="{ active: currentImage === product.image }"
                @click="setCurrentImage(product.image)"
              >
                <img 
                  :src="product.image || '/img/placeholder.jpg'" 
                  :alt="`${product.name} main`" 
                  @error="handleImageError"
                />
              </div>
              
              <div 
                v-for="choice in product.choices || []" 
                v-if="choice"
                :key="choice.choice_id || index"
                class="option-card"
                :class="{ 'selected': selectedChoice === choice, 'out-of-stock': choice.stock <= 0 }"
                @click="selectChoice(choice)"
              >
                <div class="option-image">
                  <img 
                    :src="choice.image || product.image || '/img/placeholder.jpg'" 
                    :alt="choice.name || 'Option'" 
                    @error="handleImageError"
                  />
                </div>
                <div class="option-details">
                  <span class="option-name">{{ choice.name || 'Option' }}</span>
                  <span class="option-price">{{ formatPrice(choice.price || product.price || 0) }}</span>
                  <span class="option-stock" :class="{'low-stock': choice.stock <= 10}">
                    {{ choice.stock > 0 ? `${choice.stock} in stock` : 'Out of stock' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Product Information -->
          <div class="product-info">
            <h1>{{ product.name }}</h1>
            
            <!-- Product Rating -->
            <div class="product-rating">
              <div class="star-rating">
                <i 
                  v-for="i in 5" 
                  :key="i" 
                  class="fas fa-star" 
                  :class="{ 'filled': i <= (product.rating || 0) }"
                ></i>
              </div>
              <span v-if="product.rating" class="rating-count">
                {{ product.rating.toFixed(1) }} ({{ product.review_count || 0 }} reviews)
              </span>
              <span v-else class="rating-count">No reviews yet</span>
              
              <span class="category-tag">
                <i class="fas fa-tag"></i> {{ product.category }}
              </span>
            </div>
            
            <!-- Price section -->
            <div class="price-section">
              <template v-if="hasChoices && selectedChoice">
                <h2 class="price">{{ formatPrice(selectedChoice.price || product.price) }}</h2>
              </template>
              <template v-else-if="hasChoices && getPriceRange.min !== getPriceRange.max">
                <h2 class="price">{{ formatPrice(getPriceRange.min) }} - {{ formatPrice(getPriceRange.max) }}</h2>
              </template>
              <template v-else>
                <h2 class="price">{{ formatPrice(product.price) }}</h2>
              </template>
            </div>

            <!-- Product Description -->
            <div class="description">
              <h3>Description</h3>
              <p>{{ product.description }}</p>
            </div>
            
            <!-- Product Options/Choices -->
            <div v-if="hasChoices" class="product-choices">
              <h3>Product Options</h3>
              <div class="options-container">
                <div 
                  v-for="choice in product.choices" 
                  :key="choice.choice_id"
                  class="option-card"
                  :class="{ 'selected': selectedChoice === choice, 'out-of-stock': choice.stock <= 0 }"
                  @click="selectChoice(choice)"
                >
                  <div class="option-image">
                    <img 
                      :src="choice.image || product.image || '/img/placeholder.jpg'" 
                      :alt="choice.name" 
                      @error="handleImageError"
                    />
                  </div>
                  <div class="option-details">
                    <span class="option-name">{{ choice.name }}</span>
                    <span class="option-price">{{ formatPrice(choice.price || product.price) }}</span>
                    <span class="option-stock" :class="{'low-stock': choice.stock <= 10}">
                      {{ choice.stock > 0 ? `${choice.stock} in stock` : 'Out of stock' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quantity Selection -->
            <div class="quantity-section">
              <h3>Quantity</h3>
              <div class="quantity-selector">
                <button 
                  @click="decrementQuantity" 
                  :disabled="quantity <= 1"
                  class="quantity-btn"
                >
                  <i class="fas fa-minus"></i>
                </button>
                <input 
                  type="number" 
                  v-model.number="quantity" 
                  :min="1" 
                  :max="maxStock"
                  class="quantity-input"
                  @input="validateQuantity"
                />
                <button 
                  @click="incrementQuantity" 
                  :disabled="quantity >= maxStock"
                  class="quantity-btn"
                >
                  <i class="fas fa-plus"></i>
                </button>
                <span class="stock-info" :class="{'low-stock': maxStock <= 10}">
                  {{ maxStock }} items available
                </span>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
              <button 
                @click="addToCart" 
                class="add-to-cart-btn"
                :disabled="isOutOfStock || isAddingToCart"
              >
                <i v-if="isAddingToCart" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-shopping-cart"></i>
                {{ isAddingToCart ? 'Adding...' : 'Add to Cart' }}
              </button>
              <button 
                @click="buyNow" 
                class="buy-now-btn"
                :disabled="isOutOfStock || isBuyingNow || isAddingToCart"
              >
                <i v-if="isBuyingNow" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-bolt"></i>
                {{ isBuyingNow ? 'Processing...' : 'Buy Now' }}
              </button>
              <button 
                @click="reportProduct" 
                class="report-btn"
              >
                <i class="fas fa-flag"></i> Report
              </button>
            </div>
          </div>
        </div>
        
        <!-- Reviews Section -->
        <div class="reviews-section">
          <h2>Customer Reviews</h2>
          <div v-if="reviews.length > 0" class="reviews-list">
            <div v-for="(review, index) in reviews" :key="index" class="review-card">
              <div class="review-header">
                <div class="star-rating">
                  <i 
                    v-for="i in 5" 
                    :key="i" 
                    class="fas fa-star" 
                    :class="{ 'filled': i <= review.rating }"
                  ></i>
                </div>
                <span class="review-author">{{ review.username }}</span>
                <span class="review-date">{{ formatDate(review.created_at) }}</span>
              </div>
              <p class="review-comment" v-if="review.comment">{{ review.comment }}</p>
              <p class="review-comment no-comment" v-else>No comment provided</p>
            </div>
          </div>
          <div v-else class="no-reviews">
            <i class="fas fa-comment-slash"></i>
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        </div>
        
        <!-- Similar Products -->
        <div class="similar-products">
          <h2>Similar Products</h2>
          <div v-if="similarProducts.length > 0" class="products-slider">
            <div 
              v-for="product in similarProducts" 
              :key="product.products_id" 
              class="product-card"
              @click="viewProduct(product.products_id)"
            >
              <div class="product-image-container">
                <img 
                  :src="product.image || '/img/placeholder.jpg'" 
                  :alt="product.name" 
                  class="product-image"
                  @error="handleImageError"
                />
              </div>
              <div class="product-details">
                <h3>{{ product.name }}</h3>
                <div class="product-price">{{ formatPrice(product.price) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-similar">
            <p>No similar products found</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Modal -->
    <div v-if="showReportModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Report Product</h2>
        <div class="report-form">
          <div class="form-group">
            <label for="reportType">Issue Type</label>
            <select id="reportType" v-model="reportData.type">
              <option value="inaccurate-info">Inaccurate Information</option>
              <option value="misleading">Misleading Description</option>
              <option value="incorrect-price">Incorrect Price</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reportDescription">Description</label>
            <textarea 
              id="reportDescription" 
              v-model="reportData.description"
              placeholder="Please describe the issue..."
              rows="4"
            ></textarea>
          </div>
          <div class="modal-buttons">
            <button @click="submitReport" class="submit-btn" :disabled="isSubmittingReport">
              <i v-if="isSubmittingReport" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-paper-plane"></i>
              {{ isSubmittingReport ? 'Submitting...' : 'Submit Report' }}
            </button>
            <button @click="cancelReport" class="cancel-btn" :disabled="isSubmittingReport">Cancel</button>
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
    
    <!-- Success Notification Toast -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <i :class="notification.icon"></i>
        {{ notification.message }}
      </div>
      <button class="notification-close" @click="hideNotification">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';

export default {
  name: 'ProductDetail',
  components: {
    Navbar,
    LogoutModal
  },
  data() {
    return {
      username: '',
      showLogoutModal: false,
      product: null,
      loading: true,
      selectedChoice: null,
      quantity: 1,
      reviews: [],
      similarProducts: [],
      currentImage: null,
      showReportModal: false,
      reportData: {
        type: 'inaccurate-info',
        description: ''
      },
      isAddingToCart: false,
      isBuyingNow: false,
      isSubmittingReport: false,
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      }
    };
  },
  computed: {
    hasChoices() {
      return this.product && this.product.choices && Array.isArray(this.product.choices) && this.product.choices.length > 0;
    },
    hasMultipleImages() {
      if (!this.product) return false;
      if (!this.product.choices || !Array.isArray(this.product.choices)) return false;
      
      // Check if there are any choices with images
      const choicesWithImages = this.product.choices.filter(choice => choice && choice.image);
      return choicesWithImages.length > 0;
    },
    maxStock() {
      if (!this.product) return 0;
      
      if (this.selectedChoice) {
        return this.selectedChoice.stock || 0;
      } else if (this.hasChoices) {
        // If no choice is selected but choices exist, return 0 to require selection
        return 0;
      }
      
      return this.product.stock_quantity || 0;
    },
    isOutOfStock() {
      return this.maxStock <= 0;
    },
    getPriceRange() {
      if (!this.product || !this.hasChoices) {
        return { min: this.product?.price || 0, max: this.product?.price || 0 };
      }
      
      let min = Infinity;
      let max = 0;
      
      this.product.choices.forEach(choice => {
        if (choice) {
          const price = parseFloat(choice.price) || parseFloat(this.product.price) || 0;
          min = Math.min(min, price);
          max = Math.max(max, price);
        }
      });
      
      if (min === Infinity) min = this.product.price || 0;
      
      return { min, max };
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price).replace('PHP', '₱');
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    setCurrentImage(image) {
      this.currentImage = image;
    },
    selectChoice(choice) {
      if (!choice || choice.stock <= 0) return;
      
      if (this.selectedChoice === choice) {
        this.selectedChoice = null;
      } else {
        this.selectedChoice = choice;
        // Reset quantity when changing choice
        this.quantity = 1;
        
        // Update current image if choice has an image
        if (choice && choice.image) {
          this.currentImage = choice.image;
        }
      }
    },
    incrementQuantity() {
      if (this.quantity < this.maxStock) {
        this.quantity++;
      }
    },
    decrementQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    validateQuantity() {
      // Ensure quantity is at least 1
      if (this.quantity < 1) {
        this.quantity = 1;
      }
      
      // Ensure quantity doesn't exceed available stock
      if (this.quantity > this.maxStock) {
        this.quantity = this.maxStock;
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
    handleImageError(e) {
      e.target.src = '/img/placeholder.jpg';
    },
    async getUserData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        const response = await this.$fetch('/api/users/getUsername', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          this.username = data.username;
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    },
    async fetchProductDetails() {
        this.loading = true;
        try {
            const productId = this.$route.params.id;
            const token = localStorage.getItem('token');
            
            console.log(`Fetching product details for ID: ${productId}`); // Add logging
            
            const response = await this.$fetch(`/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
            });
            
            if (!response.ok) {
            console.error(`Error fetching product: ${response.status} ${response.statusText}`);
            if (response.status === 404) {
                this.product = null;
            } else if (response.status === 401) {
                this.$router.push('/login');
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return;
            }
            
            const product = await response.json();
            console.log('Product data received:', product);

            // Ensure product.choices is always an array
            if (!product.choices || !Array.isArray(product.choices)) {
              product.choices = [];
            }

            this.product = product;
            this.currentImage = product.image;
            
            // Fetch ratings
            await this.fetchProductRating(productId);
            
            // Fetch similar products (same category)
            await this.fetchSimilarProducts(product.category, productId);
            
            // Fetch reviews
            await this.fetchProductReviews(productId);
        } catch (error) {
            console.error('Error fetching product details:', error);
        } finally {
            this.loading = false;
        }
        },
    async fetchProductRating(productId) {
        try {
            const token = localStorage.getItem('token');
            const response = await this.$fetch(`/api/products/${productId}/rating`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
            });
            
            if (response.ok) {
            const ratingData = await response.json();
            if (ratingData) {
                this.product.rating = parseFloat(ratingData.avg_rating) || 0;
                this.product.review_count = parseInt(ratingData.review_count) || 0;
            }
            } else {
            console.warn(`Could not load ratings for product ${productId}: ${response.status}`);
            // Set default values
            this.product.rating = 0;
            this.product.review_count = 0;
            }
        } catch (error) {
            console.error('Error fetching product rating:', error);
            // Set default values on error
            this.product.rating = 0;
            this.product.review_count = 0;
        }
    },
    async fetchProductReviews(productId) {
        try {
            const token = localStorage.getItem('token');
            const response = await this.$fetch(`/api/products/${productId}/reviews`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
            });
            
            if (response.ok) {
            const reviews = await response.json();
            this.reviews = reviews;
            } else {
            console.warn(`Could not load reviews for product ${productId}: ${response.status}`);
            this.reviews = [];
            }
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            this.reviews = [];
        }
    },
    async fetchSimilarProducts(category, currentProductId) {
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/products/category/${category}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          let products = await response.json();
          // Filter out current product and limit to 4 items
          this.similarProducts = products
            .filter(p => p.products_id !== parseInt(currentProductId))
            .slice(0, 4);
        }
      } catch (error) {
        console.error('Error fetching similar products:', error);
        this.similarProducts = [];
      }
    },
    viewProduct(productId) {
      // Navigate to the selected product detail page
      this.$router.push(`/product/${productId}`);
    },
    async addToCart() {
      if (this.isOutOfStock || this.isAddingToCart) return;
      
      this.isAddingToCart = true;
      try {
        const token = localStorage.getItem('token');
        const payload = {
          productId: this.product.products_id,
          quantity: this.quantity
        };
        
        // Add choice_id if a choice was selected
        if (this.hasChoices && this.selectedChoice) {
          payload.choiceId = this.selectedChoice.choice_id;
        } else if (this.hasChoices) {
          // If there are choices but none selected
          this.showNotification('Please select a product option', 'warning', 'fas fa-exclamation-triangle');
          return;
        }
        
        const response = await this.$fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          this.showNotification('Product added to cart successfully', 'success', 'fas fa-check-circle');
          
          // Dispatch event to update cart count if needed
          window.dispatchEvent(new CustomEvent('cart-updated'));
        } else {
          const error = await response.json();
          this.showNotification('Failed to add product: ' + error.message, 'error', 'fas fa-times-circle');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showNotification('Error adding product to cart', 'error', 'fas fa-times-circle');
      } finally {
        this.isAddingToCart = false;
      }
    },
    async buyNow() {
      if (this.isOutOfStock || this.isBuyingNow) return;
      
      this.isBuyingNow = true;
      try {
        // First add to cart
        await this.addToCart();
        // Then navigate to cart page
        this.$router.push('/cart');
      } finally {
        this.isBuyingNow = false;
      }
    },
    reportProduct() {
      this.showReportModal = true;
    },
    cancelReport() {
      this.showReportModal = false;
      this.reportData = {
        type: 'inaccurate-info',
        description: ''
      };
    },
    async submitReport() {
      if (!this.reportData.description || this.isSubmittingReport) {
        if (!this.reportData.description) {
          this.showNotification('Please describe the issue', 'warning', 'fas fa-exclamation-triangle');
        }
        return;
      }
      
      this.isSubmittingReport = true;
      try {
        const token = localStorage.getItem('token');
        const response = await this.$fetch(`/api/products/${this.product.products_id}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            issueType: this.reportData.type,
            description: this.reportData.description
          })
        });
        
        // Better JSON parsing with error handling
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
          throw new Error(responseData.message || `Error: ${response.status} ${response.statusText}`);
        }
        
        this.showNotification('Report submitted successfully. Thank you for your feedback.', 'success', 'fas fa-check-circle');
        this.cancelReport();
      } catch (error) {
        console.error('Error submitting report:', error);
        this.showNotification('Error submitting report: ' + error.message, 'error', 'fas fa-times-circle');
      } finally {
        this.isSubmittingReport = false;
      }
    },
    showNotification(message, type, icon) {
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
    }
  },
  async mounted() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      
      await this.getUserData();
      await this.fetchProductDetails();
    } catch (error) {
      console.error('Error in mounted:', error);
      if (error.response?.status === 401) {
        this.$router.push('/login');
      }
    }
  },
  // Watch for route changes to reload data when navigating between product detail pages
  watch: {
    '$route.params.id'() {
      this.fetchProductDetails();
    }
  }
}
</script>

<style scoped>
/* Base Styles */
.product-detail-container {
  font-family: Arial, sans-serif;  
  min-height: 100vh;
  background-color: #f8f9fa;
  color: #2a3f2a; /* Darker green text for contrast */
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.loading, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin: 2rem 0;
  color: #64748b;
  gap: 1rem;
  border-left: 4px solid #4CAF50; /* Green accent border */
}

.loading i, .error-message i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #4CAF50; /* Green icon */
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50; /* Green button to match products page */
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #388e3c; /* Darker green on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.breadcrumb {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #4CAF50; /* Green links to match theme */
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  border-left: 4px solid #4CAF50; /* Green accent border */
}

.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1/1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  background-color: #f9fff9; /* Very light green background */
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: white;
}

.sold-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(76, 175, 80, 0.9); /* Green badge to match */
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  font-weight: 600;
}

.image-thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.thumbnail-container {
  flex: 0 0 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail-container:hover {
  transform: translateY(-2px);
}

.thumbnail-container.active {
  border: 2px solid #4CAF50; /* Green accent */
}

.thumbnail-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-info h1 {
  color: #2a3f2a; /* Dark green */
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  line-height: 1.3;
}

.product-rating {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.star-rating {
  display: flex;
  gap: 0.15rem;
}

.star-rating .fa-star {
  color: #e0e0e0;
  font-size: 1rem;
}

.star-rating .fa-star.filled {
  color: #4CAF50; /* Green stars to match Products.vue */
}

.rating-count {
  font-size: 0.9rem;
  color: #64748b;
}

.category-tag {
  padding: 0.25rem 0.75rem;
  background-color: #f1f9f1; /* Light green background */
  border-radius: 20px;
  font-size: 0.85rem;
  color: #4CAF50; /* Green text */
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-section {
  margin: 1rem 0;
  border-top: 1px solid #f1f9f1; /* Light green separator */
  border-bottom: 1px solid #f1f9f1;
  padding: 1rem 0;
}

.price {
  font-size: 2rem;
  font-weight: 700;
  color: #1e5b1e; /* Dark green */
  margin: 0;
}

.description {
  margin-bottom: 1.5rem;
}

.description h3 {
  font-size: 1.2rem;
  color: #2a3f2a; /* Dark green */
  margin: 0 0 0.5rem 0;
}

.description p {
  color: #5a675a; /* Medium green-gray */
  line-height: 1.6;
  margin: 0;
}

.product-choices {
  margin-bottom: 1.5rem;
}

.product-choices h3 {
  font-size: 1.2rem;
  color: #2a3f2a; /* Dark green */
  margin: 0 0 1rem 0;
}

.options-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.option-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: white;
}

.option-card:hover:not(.out-of-stock) {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.15); /* Green-tinted shadow */
  border-color: #cbd5e1;
}

.option-card.selected {
  border: 2px solid #4CAF50; /* Green accent */
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.option-card.out-of-stock {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-image {
  height: 100px;
  width: 100%;
  overflow: hidden;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.option-details {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-name {
  font-weight: 600;
  color: #2a3f2a; /* Dark green */
}

.option-price {
  font-weight: 700;
  color: #4CAF50; /* Green price */
}

.option-stock {
  font-size: 0.85rem;
  color: #22c55e; /* Green for in stock */
}

.low-stock {
  color: #f59e0b; /* Orange for low stock */
}

.quantity-section {
  margin-bottom: 1.5rem;
}

.quantity-section h3 {
  font-size: 1.2rem;
  color: #2a3f2a; /* Dark green */
  margin: 0 0 1rem 0;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f9f1; /* Light green */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 60px;
  height: 40px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

.stock-info {
  font-size: 0.9rem;
  color: #64748b;
  margin-left: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.add-to-cart-btn, .buy-now-btn, .report-btn {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.add-to-cart-btn {
  flex: 1;
  background-color: #4CAF50; /* Green button */
  color: white;
  border: none;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #388e3c; /* Darker green on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.buy-now-btn {
  flex: 1;
  background-color: #4CAF50; /* Match green theme */
  color: white;
  border: none;
}

.buy-now-btn:hover:not(:disabled) {
  background-color: #388e3c; /* Darker green on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.report-btn {
  background-color: white;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.report-btn:hover {
  background-color: #fef2f2;
  transform: translateY(-2px);
}

.add-to-cart-btn:disabled, .buy-now-btn:disabled {
  background-color: #c8e6c9; /* Very light green when disabled */
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reviews-section, .similar-products {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  border-left: 4px solid #4CAF50; /* Green accent border */
}

.reviews-section h2, .similar-products h2 {
  color: #2a3f2a; /* Dark green */
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #f8fafc;
}

.review-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.review-author {
  font-weight: 600;
  color: #2a3f2a; /* Dark green */
}

.review-date {
  color: #94a3b8;
  font-size: 0.9rem;
}

.review-comment {
  color: #5a675a; /* Medium green-gray */
  line-height: 1.6;
  margin: 0;
}

.review-comment.no-comment {
  font-style: italic;
}

.no-reviews, .no-similar {
  text-align: center;
  padding: 3rem 0;
  color: #94a3b8;
}

.no-reviews i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #4CAF50; /* Green icon */
}

.products-slider {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid #4CAF50; /* Green accent border */
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(76, 175, 80, 0.15); /* Green-tinted shadow */
}

.product-image-container {
  height: 160px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  padding: 1rem;
}

.product-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #2a3f2a; /* Dark green */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-weight: 600;
  color: #4CAF50; /* Green price */
}

/* Modal styles */
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
  background-color: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
  border-left: 4px solid #4CAF50; /* Green accent border */
}

.modal-content h2 {
  color: #2a3f2a; /* Dark green */
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2a3f2a; /* Dark green */
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-btn, .cancel-btn {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.submit-btn:hover {
  background-color: #388e3c;
}

.cancel-btn {
  background-color: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.cancel-btn:hover {
  background-color: #f8fafc;
}

/* Notification toast */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification.success {
  background-color: #4CAF50;
  color: white;
}

.notification.error {
  background-color: #e74c3c;
  color: white;
}

.notification.warning {
  background-color: #f39c12;
  color: white;
}

.notification-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
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

/* Spinner Animation */
.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Loading Button States */
.add-to-cart-btn:disabled,
.buy-now-btn:disabled,
.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-container {
    padding: 1.5rem;
  }
  
  .product-main {
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .product-main {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .products-slider {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 1rem;
  }
  
  .product-main {
    padding: 1rem;
  }
  
  .options-container {
    grid-template-columns: 1fr;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .products-slider {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>

