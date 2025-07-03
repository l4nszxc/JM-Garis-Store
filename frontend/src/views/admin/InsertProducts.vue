<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />

        <div class="admin-content">
            <h1><i class="fas fa-box-open"></i> Insert New Product</h1>

            <div class="settings-card">
                <div class="settings-header">
                    <h2>Product Information</h2>
                    <p>Add a new product to your inventory</p>
                </div>

                <form @submit.prevent="handleSubmit" class="settings-form">
                    <div v-if="successMessage" class="success-message">
                        <i class="fas fa-check-circle"></i> {{ successMessage }}
                    </div>
                    
                    <div v-if="errorMessage" class="error-message">
                        <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
                    </div>
                    
                    <div class="form-group">
                        <label for="name">Product Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            v-model="product.name" 
                            placeholder="Product Name"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea 
                            id="description" 
                            v-model="product.description" 
                            placeholder="Product Description"
                            rows="3"
                            required
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="price">Base Price (₱)</label>
                        <input 
                            type="number" 
                            id="price" 
                            v-model="product.price" 
                            step="0.01"  
                            min="0"     
                            placeholder="0.00"
                            :disabled="choices.length > 0"
                            :class="{'disabled-input': choices.length > 0}"
                            required 
                        />
                        <div v-if="choices.length > 0" class="help-text">
                            <i class="fas fa-info-circle"></i> Base price is disabled when using product options
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="stock_quantity">Stock Quantity</label>
                        <input 
                            type="number" 
                            id="stock_quantity" 
                            v-model="product.stock_quantity" 
                            required
                            :disabled="choices.length > 0"
                            :class="{'disabled-input': choices.length > 0}"
                            :value="choices.length > 0 ? 0 : product.stock_quantity"
                            placeholder="0"
                        />
                        <div v-if="choices.length > 0" class="help-text">
                            <i class="fas fa-info-circle"></i> Stock is managed through product options
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="category">Category</label>
                        <select id="category" v-model="product.category" required @change="updateSuggestedChoices">
                            <option value="" disabled selected>Select a category</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Milk and Chocolate Drink">Milk and Chocolate Drink</option>
                            <option value="Coffee and Creamer">Coffee and Creamer</option>
                            <option value="Condiments">Condiments</option>
                            <option value="Canned Goods">Canned Goods</option>
                            <option value="Biscuits">Biscuits</option>
                            <option value="Candies and Snacks">Candies and Snacks</option>
                            <option value="Bar and Soap">Bar and Soap</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="image">Product Image</label>
                        <input 
                            type="file" 
                            id="image" 
                            @change="handleImageUpload" 
                            accept="image/*" 
                        />
                    </div>

                    <div class="product-choices-section">
                        <div class="choices-header">
                            <h3>Product Options (Optional)</h3>
                            <button type="button" @click="addChoice" class="add-choice-btn">
                                <i class="fas fa-plus"></i> Add Option
                            </button>
                        </div>
                        
                        <div v-if="suggestedChoicesVisible && suggestedChoices.length > 0" class="suggested-choices">
                            <p>Suggested options for {{ product.category }}:</p>
                            <div class="suggestion-chips">
                                <span 
                                    v-for="(suggestion, index) in suggestedChoices" 
                                    :key="index" 
                                    class="suggestion-chip"
                                    @click="applyChoices(suggestion)"
                                >
                                    {{ suggestion.label }}
                                </span>
                            </div>
                        </div>
                        
                        <div v-for="(choice, index) in choices" :key="index" class="product-choice">
                            <div class="choice-header">
                                <h4>Option #{{ index + 1 }}</h4>
                                <button type="button" class="remove-choice-btn" @click="removeChoice(index)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="choice-form">
                                <div class="form-group">
                                    <label :for="'choice-name-' + index">Name</label>
                                    <input 
                                        type="text" 
                                        :id="'choice-name-' + index" 
                                        v-model="choice.name" 
                                        placeholder="e.g., 750ml, 1.65L, Medium, etc." 
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-price-' + index">Price (₱)</label>
                                    <input 
                                        type="number" 
                                        :id="'choice-price-' + index" 
                                        v-model="choice.price" 
                                        step="0.01" 
                                        min="0"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-stock-' + index">Stock Quantity</label>
                                    <input 
                                        type="number" 
                                        :id="'choice-stock-' + index" 
                                        v-model="choice.stock"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-image-' + index">Image (Optional)</label>
                                    <input 
                                        type="file" 
                                        :id="'choice-image-' + index" 
                                        @change="(e) => handleChoiceImageUpload(e, index)" 
                                        accept="image/*" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="product-preview">
                        <h3>Product Preview</h3>
                        <div class="preview-content">
                          <div class="product-card">
                              <div class="product-image-container">
                                  <img 
                                      :src="previewImage || '/img/icons/defaultinsertimage.jpg'" 
                                      alt="Product Preview" 
                                      class="product-image"
                                  >
                              </div>
                              <div class="product-details">
                                  <h3>{{ product.name || 'Product Name' }}</h3>
                                  <div class="product-rating">
                                      <div class="star-rating">
                                          <i v-for="i in 5" :key="i" class="fas fa-star"></i>
                                      </div>
                                      <span class="rating-count">No reviews yet</span>
                                  </div>
                                  <p class="product-description">
                                      {{ product.description || 'Product description will appear here.' }}
                                  </p>
                                  <div class="product-info">
                                      <p class="product-price">
                                          <template v-if="hasChoices && getPriceRange.min !== getPriceRange.max">
                                              {{ formatPrice(getPriceRange.min) }} - {{ formatPrice(getPriceRange.max) }}
                                          </template>
                                          <template v-else-if="hasChoices && getPriceRange.min === getPriceRange.max && getPriceRange.min > 0">
                                              {{ formatPrice(getPriceRange.min) }}
                                          </template>
                                          <template v-else>
                                              {{ formatPrice(product.price || 0) }}
                                          </template>
                                      </p>
                                      <p class="product-stock" :class="{ 'low-stock': getTotalStock <= 10 }">
                                          <i class="fas fa-box"></i> 
                                          {{ getTotalStock }} in stock
                                      </p>
                                  </div>
                                  <p class="product-category">
                                      <i class="fas fa-tag"></i> {{ product.category || 'Category' }}
                                  </p>
                              </div>
                              <button class="add-to-cart-btn" disabled>
                                  <i class="fas fa-shopping-cart"></i> Add to Cart
                              </button>
                          </div>

                          <!-- Choices Preview Section with scrolling -->
                          <div v-if="choices.length > 0" class="choices-preview">
                              <h4>Available Options <span class="options-count">({{ choices.length }})</span>:</h4>
                              <div class="choice-chips">
                                  <div v-for="(choice, idx) in choices" :key="idx" class="choice-chip">
                                      <div class="choice-image-container" v-if="choiceImagePreviews && choiceImagePreviews[idx]">
                                          <img :src="choiceImagePreviews[idx]" alt="Choice Preview" class="choice-preview-image">
                                      </div>
                                      <div class="choice-chip-header">
                                          <span class="choice-name">{{ choice.name || 'Option Name' }}</span>
                                          <span class="choice-price">{{ formatPrice(choice.price || 0) }}</span>
                                      </div>
                                      <div class="choice-chip-stock">
                                          <i class="fas fa-box"></i> {{ choice.stock || 0 }} in stock
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" @click="resetForm" class="reset-btn">
                            <i class="fas fa-undo"></i> Reset Form
                        </button>
                        
                        <button type="submit" class="save-btn" :disabled="isSubmitting">
                            <i class="fas fa-save"></i> {{ isSubmitting ? 'Adding...' : 'Add Product' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Confirmation Modal for Reset -->
        <div v-if="showResetModal" class="modal-overlay">
            <div class="modal-content">
                <h3>Reset Product Form</h3>
                <p>Are you sure you want to reset the form? All changes will be lost.</p>
                <div class="modal-actions">
                    <button @click="confirmReset" class="confirm-btn">Reset Form</button>
                    <button @click="showResetModal = false" class="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Toast Notification -->
        <div v-if="notification.show" class="toast-notification" :class="notification.type">
            <i :class="notification.icon"></i>
            <span>{{ notification.message }}</span>
        </div>

        <LogoutModal :show="showLogoutModal" @confirm="handleLogout" @cancel="showLogoutModal = false" />
    </div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';

export default {
    name: 'InsertProducts',
    components: {
        AdminNavbar,
        LogoutModal
    },
      data() {
        return {
            username: '',
            showLogoutModal: false,
            showResetModal: false,
            isSubmitting: false,
            successMessage: '',
            errorMessage: '',
            product: {
                name: '',
                description: '',
                price: '',
                stock_quantity: null,
                category: '',
            },
            defaultProduct: {
                name: '',
                description: '',
                price: '',
                stock_quantity: null,
                category: '',
            },
            image: null,
            previewImage: null,
            choices: [],
            choiceImages: [],
            choiceImagePreviews: [], 
            suggestedChoicesVisible: false,
            suggestedChoices: [],
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
            return this.choices.length > 0;
        },
        getPriceRange() {
            if (!this.hasChoices) {
                return { min: this.product.price || 0, max: this.product.price || 0 };
            }
            
            // With choices, ignore the main product price and just look at choice prices
            let min = Infinity;
            let max = 0;
            
            // Check all choice prices
            this.choices.forEach(choice => {
                const price = parseFloat(choice.price);
                if (!isNaN(price)) {
                    min = Math.min(min, price);
                    max = Math.max(max, price);
                }
            });
            
            // If no valid prices were found, set to 0
            if (min === Infinity) min = 0;
            if (max === 0) max = 0;
            
            return { min, max };
        },
        getTotalStock() {
            if (!this.hasChoices) {
                return parseInt(this.product.stock_quantity) || 0;
            }
            
            // Sum up stock from all choices
            const totalStock = this.choices.reduce((sum, choice) => {
                return sum + (parseInt(choice.stock) || 0);
            }, 0);
            
            return totalStock;
        }
    },
    methods: {
        showToast(message, type = 'success') {
            // Set icon based on notification type
            let icon = 'fas fa-check-circle';
            if (type === 'error') {
                icon = 'fas fa-exclamation-circle';
            } else if (type === 'info') {
                icon = 'fas fa-info-circle';
            } else if (type === 'warning') {
                icon = 'fas fa-exclamation-triangle';
            }

            // Set notification data
            this.notification = {
                show: true,
                message,
                type,
                icon
            };

            // Auto hide after 5 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
        },

        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        },
        
        formatDecimal(value) {
            if (!value || isNaN(parseFloat(value))) return 0;
            return Number(parseFloat(value).toFixed(2));
        },
        
        updateSuggestedChoices() {
            this.suggestedChoicesVisible = !!this.product.category;
            
            // Define suggested choices based on category
            const categoryChoices = {
                'Beverages': [
                    {
                        label: 'Drink Sizes',
                        choices: [
                            { name: '330ml', price: null, stock: null },
                            { name: '500ml', price: null, stock: null },
                            { name: '1 Liter', price: null, stock: null },
                            { name: '1.5 Liter', price: null, stock: null },
                            { name: '1.65 Liter', price: null, stock: null },
                            { name: '2 Liter', price: null, stock: null }
                        ]
                    }
                ],
                'Milk and Chocolate Drink': [
                    {
                        label: 'Package Options',
                        choices: [
                            { name: 'Single Sachet', price: null, stock: null },
                            { name: 'Small Pack', price: null, stock: null },
                            { name: 'Medium Pack', price: null, stock: null },
                            { name: 'Large Pack', price: null, stock: null }
                        ]
                    }
                ],
                'Coffee and Creamer': [
                    {
                        label: 'Package Options',
                        choices: [
                            { name: 'Single Sachet', price: null, stock: null },
                            { name: 'Small Pack (5 sachets)', price: null, stock: null },
                            { name: 'Medium Pack (10 sachets)', price: null, stock: null },
                            { name: 'Large Pack (30 sachets)', price: null, stock: null }
                        ]
                    }
                ],
                'Condiments': [
                    {
                        label: 'Bottle Sizes',
                        choices: [
                            { name: 'Small (100ml)', price: null, stock: null },
                            { name: 'Medium (250ml)', price: null, stock: null },
                            { name: 'Large (500ml)', price: null, stock: null },
                            { name: 'Family Size (1L)', price: null, stock: null }
                        ]
                    }
                ],
                'Canned Goods': [
                    {
                        label: 'Can Sizes',
                        choices: [
                            { name: 'Small (155g)', price: null, stock: null },
                            { name: 'Medium (380g)', price: null, stock: null },
                            { name: 'Large (480g)', price: null, stock: null }
                        ]
                    }
                ],
                'Biscuits': [
                    {
                        label: 'Package Options',
                        choices: [
                            { name: 'Single Pack', price: null, stock: null },
                            { name: 'Pack of 3', price: null, stock: null },
                            { name: 'Pack of 6', price: null, stock: null },
                            { name: 'Family Size', price: null, stock: null }
                        ]
                    }
                ],
                'Candies and Snacks': [
                    {
                        label: 'Package Options',
                        choices: [
                            { name: 'Mini (15g)', price: null, stock: null },
                            { name: 'Regular (30g)', price: null, stock: null },
                            { name: 'Sharing (75g)', price: null, stock: null },
                            { name: 'Jumbo (150g)', price: null, stock: null }
                        ]
                    }
                ],
                'Bar and Soap': [
                    {
                        label: 'Soap Types',
                        choices: [
                            { name: 'Laundry Bar', price: null, stock: null },
                            { name: 'Beauty Bar', price: null, stock: null },
                            { name: 'Anti-bacterial Bar', price: null, stock: null },
                            { name: 'Body Soap', price: null, stock: null }
                        ]
                    },
                    {
                        label: 'Package Sizes',
                        choices: [
                            { name: 'Small (90g)', price: null, stock: null },
                            { name: 'Regular (135g)', price: null, stock: null },
                            { name: 'Family Size (200g)', price: null, stock: null },
                            { name: 'Twin Pack', price: null, stock: null }
                        ]
                    }
                ]
            };
            
            this.suggestedChoices = categoryChoices[this.product.category] || [];
        },
        
        applyChoices(suggestion) {
            this.choices = JSON.parse(JSON.stringify(suggestion.choices));
            this.choiceImages = this.choices.map(() => null);
            // Reset main product price and stock to 0 when applying choices
            this.product.stock_quantity = 0;
            this.product.price = 0;
            this.showToast(`Applied ${suggestion.label} options`, 'info');
        },
        
        addChoice() {
            this.choices.push({
                name: '',
                price: null,
                stock: null
            });
            this.choiceImages.push(null);
            this.choiceImagePreviews.push(null); // Add preview placeholder
            
            // Reset main product price and stock to 0 when adding first choice
            if (this.choices.length === 1) {
                this.product.stock_quantity = 0;
                this.product.price = 0;
            }
        },

        removeChoice(index) {
            // Release URL object to prevent memory leaks
            if (this.choiceImagePreviews[index]) {
                URL.revokeObjectURL(this.choiceImagePreviews[index]);
            }
            
            this.choices.splice(index, 1);
            this.choiceImages.splice(index, 1);
            this.choiceImagePreviews.splice(index, 1);
            
            // Reset main product stock and enable price input when removing last choice
            if (this.choices.length === 0) {
                this.product.stock_quantity = null;
            }
        },
        
        handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.image = file;
                
                // Create preview URL for the selected image
                this.previewImage = URL.createObjectURL(file);
            }
        },
        
       handleChoiceImageUpload(event, index) {
          const file = event.target.files[0];
          if (file) {
              this.choiceImages[index] = file;
              
              // Create and store preview URL for the selected choice image
              if (!this.choiceImagePreviews) this.choiceImagePreviews = [];
              this.choiceImagePreviews[index] = URL.createObjectURL(file);
          }
      },
        
        resetForm() {
            this.showResetModal = true;
        },
        
        confirmReset() {
            // Reset all form fields to defaults
            this.product = JSON.parse(JSON.stringify(this.defaultProduct));
            this.image = null;
            this.previewImage = null;
            this.choices = [];
            this.choiceImages = [];
            this.suggestedChoicesVisible = false;
            this.successMessage = '';
            this.errorMessage = '';
            
            // Clear file inputs
            document.getElementById('image').value = '';
            
            this.showResetModal = false;
            this.showToast('Form has been reset', 'info');
        },
        
        async handleSubmit() {
          try {
              this.isSubmitting = true;
              this.successMessage = '';
              this.errorMessage = '';

              // Validate product information
              if (!this.product.name?.trim()) {
                  throw new Error('Please enter a product name');
              }

              if (!this.product.category) {
                  throw new Error('Please select a product category');
              }

              // If there are no choices, validate the price
              if (this.choices.length === 0) {
                  const price = this.formatDecimal(this.product.price);
                  if (isNaN(price) || price <= 0) {
                      throw new Error('Please enter a valid price greater than zero');
                  }
              } else {
                  // If there are choices, validate that at least one choice has a price
                  const hasValidPrices = this.choices.some(choice => {
                      const price = parseFloat(choice.price);
                      return !isNaN(price) && price > 0;
                  });
                  
                  if (!hasValidPrices) {
                      throw new Error('Please enter a valid price for at least one product option');
                  }

                  // Validate that choices have stock
                  const hasValidStock = this.choices.some(choice => {
                      const stock = parseInt(choice.stock);
                      return !isNaN(stock) && stock >= 0;
                  });
                  
                  if (!hasValidStock) {
                      throw new Error('Please enter valid stock quantities for product options');
                  }
              }

              const formData = new FormData();
              formData.append('name', this.product.name);
              formData.append('description', this.product.description);
              
              // If using choices, set main product price to 0 but calculate total stock
              const productPrice = this.choices.length > 0 ? 0 : this.formatDecimal(this.product.price);
              formData.append('price', productPrice);
              
              // Calculate and set stock_quantity
              let stockQuantity;
              if (this.choices.length > 0) {
                  // Calculate total stock from all choices
                  stockQuantity = this.getTotalStock;
              } else {
                  stockQuantity = this.product.stock_quantity || 0;
              }
              formData.append('stock_quantity', stockQuantity);
              formData.append('category', this.product.category);
              
              // Add main product image if it exists
              if (this.image) {
                  formData.append('image', this.image);
              }
              
              // Handle choices and their images
              if (this.choices.length > 0) {
                  const formattedChoices = this.choices.map(choice => ({
                      ...choice,
                      price: this.formatDecimal(choice.price),
                      stock: parseInt(choice.stock) || 0
                  }));
                  formData.append('hasChoices', 'true');
                  formData.append('choices', JSON.stringify(formattedChoices));
                  
                  this.choiceImages.forEach((img, idx) => {
                      if (img) {
                          formData.append('choiceImage', img);
                      }
                  });
              }

              const token = localStorage.getItem('token');
              const response = await fetch('http://localhost:7904/api/products', {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${token}`
                  },
                  body: formData
              });

              const data = await response.json();

              if (response.ok) {
                  // Show success toast but don't reset form immediately
                  this.successMessage = 'Product added successfully!';
                  this.showToast('Product added successfully!', 'success');
                  
                  // Log the total stock that was saved
                  console.log('Product saved with total stock:', data.totalStock);
                  
                  // Delay form reset to allow user to see the success message
                  setTimeout(() => {
                      this.confirmReset();
                  }, 2000); // Wait 2 seconds before resetting
              } else {
                  throw new Error(data.message || 'Failed to add product');
              }
          } catch (error) {
              console.error('Error adding product:', error);
              this.errorMessage = error.message;
              this.showToast(error.message, 'error');
          } finally {
              this.isSubmitting = false;
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
                console.error('Logout failed:', error);
            } finally {
                this.showLogoutModal = false;
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username || 'Admin';
        }
    }
};
</script>

<style scoped>
.admin-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-left: 250px;
}

.admin-content {
  padding: 2rem;
}

.admin-content h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.settings-header p {
  margin-top: 0.5rem;
  color: #64748b;
}

.settings-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 97%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.help-text {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

input:disabled,
.disabled-input {
  background-color: #f9f9f9;
  cursor: not-allowed;
  color: #888;
  border: 1px dashed #ccc;
}

.product-preview {
  grid-column: 2;
  grid-row: 1 / span 6;
}

.product-preview h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.preview-content {
  background-color: #f5f5f5;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  overflow-y: auto;
  max-height: 75vh; /* Use viewport height for better responsiveness */
  height: 85%;
}

/* Product Card Styles for Preview */
.product-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
  flex-shrink: 0; /* Prevent shrinking */
}

.product-image-container {
  position: relative;
  width: 100%;
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
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-details h3 {
  margin: 0 0 0.3rem 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Product Rating Styles */
.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.star-rating {
  display: flex;
  gap: 0.15rem;
}

.star-rating .fa-star {
  color: #e0e0e0;
  font-size: 0.9rem;
}

.rating-count {
  font-size: 0.8rem;
  color: #64748b;
}

.product-description {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.5rem 0 0.8rem 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.7rem 0;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.product-stock {
  color: #22c55e;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
}

.low-stock {
  color: #f59e0b;
}

.product-category {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  padding: 0.5rem 0 0;
  border-top: 1px solid #f0f0f0;
}

.add-to-cart-btn {
  background-color: #4CAF50;
  color: white;
  border: 2px solid transparent;
  padding: 0.8rem 1rem;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Choices Preview Styles */
.choices-preview {
  width: 100%;
  max-width: 300px;
  background-color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* Prevent shrinking */
  overflow-y: auto; /* Add vertical scrolling */
}

.choices-preview h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #334155;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.choices-preview h4::before {
  content: '\f0c9';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  font-size: 0.9rem;
}

.choice-chips {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem; /* Add space for scrollbar */
}

.choice-chip {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.choice-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.choice-chip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.choice-name {
  font-weight: 500;
  color: #334155;
  font-size: 0.95rem;
}

.choice-price {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
}

.choice-chip-stock {
  color: #64748b;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Product Choices Styles */
.product-choices-section {
  grid-column: 1 / span 2;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8fafc;
}

.choices-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.choices-header h3 {
  margin: 0;
  color: #334155;
  font-size: 1.1rem;
}

.add-choice-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.add-choice-btn:hover {
  background-color: #2563eb;
}

.product-choice {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.choice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.choice-header h4 {
  margin: 0;
  color: #334155;
}

.remove-choice-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.remove-choice-btn:hover {
  background-color: #dc2626;
}

.choice-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.suggested-choices {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.suggested-choices p {
  margin: 0 0 0.75rem 0;
  font-weight: 500;
  color: #0369a1;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.suggestion-chip {
  background-color: #0ea5e9;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.suggestion-chip:hover {
  background-color: #0284c7;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.form-actions {
  grid-column: 1 / span 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.save-btn,
.reset-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #a8d5aa;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e2e8f0;
  margin-right: 1rem;
}

.reset-btn:hover {
  background-color: #e9ecef;
}

.success-message,
.error-message {
  grid-column: 1 / span 2;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
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
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  color: #2c3e50;
}

.modal-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.confirm-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
  border: none;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #6c757d;
  border: 1px solid #e2e8f0;
}

/* Toast notification styles */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  max-width: 350px;
  z-index: 1100;
  animation: slide-in 0.3s ease-out;
}

.toast-notification.success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.toast-notification.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.toast-notification.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left: 4px solid #17a2b8;
}

.toast-notification.warning {
  background-color: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}
.choice-image-container {
  width: 100%;
  height: 80px;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.choice-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #e2e8f0;
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

@media (max-width: 992px) {
  .settings-form {
    grid-template-columns: 1fr;
  }
  
  .product-preview {
    grid-column: 1;
    grid-row: auto;
  }
  
  .form-actions {
    grid-column: 1;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .choice-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-container {
    padding-left: 60px;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .settings-card {
    padding: 1.5rem;
  }
  
  .toast-notification {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
  
  .preview-content {
    padding: 1rem;
  }
  
  .product-choices-section {
    padding: 1rem;
  }
  
  .product-choice {
    padding: 1rem;
  }
}
.options-count {
  background-color: #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  margin-left: 0.5rem;
}
.choices-preview::-webkit-scrollbar {
  width: 6px;
}

.choices-preview::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.choices-preview::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.choices-preview::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>