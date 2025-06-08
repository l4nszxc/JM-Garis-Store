<template>
    <div class="staff-container">
      <StaffNavbar :username="username" @logout="showLogoutModal = true" />
      
      <div class="staff-content">
        <h1><i class="fas fa-cash-register"></i> Create Order</h1>
        
        <div class="order-creation-section">
          <!-- Product Selection Section -->
          <div class="selection-panel">
            <div class="search-section">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Search products..."
                >
              </div>
              <div class="category-tabs">
                <button 
                    v-for="category in categories" 
                    :key="category.id"
                    :class="['category-btn', selectedCategory === category.id ? 'active' : '']"
                    @click="selectCategory(category.id)"
                    >
                    {{ category.name }}
                    </button>
              </div>
            </div>
            
            <div class="products-grid">
              <div 
                v-for="product in paginatedProducts" 
                :key="product.products_id" 
                class="product-card"
                @click="showProductDetails(product)"
              >
                <div class="product-image-wrapper">
                  <img 
                    :src="product.image || '/img/placeholder.jpg'" 
                    :alt="product.name"
                    class="product-image"
                    @error="handleImageError"
                  >
                  <span v-if="product.has_choices" class="variant-badge">
                    <i class="fas fa-list-ul"></i> Options
                  </span>
                </div>
                <div class="product-info">
                  <h3>{{ product.name }}</h3>
                  <p class="price">{{ formatPrice(product.price) }}</p>
                  <div class="product-meta">
                    <p class="category-tag">{{ product.category_name || 'Uncategorized' }}</p>
                    <p class="stock" :class="{'low-stock': product.stock_quantity < 10}">
                      <i class="fas fa-cubes"></i> {{ product.stock_quantity }}
                    </p>
                  </div>
                </div>
              </div>
              
              <div v-if="filteredProducts.length === 0" class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found</p>
              </div>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination-controls">
              <button 
                @click="prevPage" 
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              <div class="pagination-info">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
              <button 
                @click="nextPage" 
                :disabled="currentPage >= totalPages"
                class="pagination-btn"
              >
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          
          <!-- Current Order Section -->
          <div class="order-summary-panel">
            <h2>Current Order</h2>
            
            <div class="customer-info">
              <input 
                type="text" 
                v-model="customerName" 
                placeholder="Customer name (optional)"
                class="customer-name-input"
              >
            </div>
            
            <div v-if="cart.length > 0" class="cart-items">
              <div v-for="(item, index) in cart" :key="index" class="cart-item">
                <div class="item-info">
                  <h4>{{ item.name }}</h4>
                  <small v-if="item.choice_name" class="variant-tag">{{ item.choice_name }}</small>
                  <div class="quantity-control">
                    <button @click="decreaseQuantity(index)" class="qty-btn">
                      <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button @click="increaseQuantity(index)" class="qty-btn">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                <div class="item-price">
                  <p>{{ formatPrice(item.price * item.quantity) }}</p>
                  <button @click="removeItem(index)" class="remove-btn">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-cart">
              <i class="fas fa-shopping-cart"></i>
              <p>Cart is empty</p>
              <p class="hint">Select products to add to the order</p>
            </div>
            
            <div class="price-summary">
              <div class="subtotal">
                <span>Subtotal:</span>
                <span>{{ formatPrice(cartTotal) }}</span>
              </div>
            </div>
            
            <div class="order-actions">
              <button 
                @click="clearCart" 
                class="secondary-btn"
                :disabled="cart.length === 0"
              >
                <i class="fas fa-trash-alt"></i> Clear Order
              </button>
              <button 
                @click="createOrder" 
                class="primary-btn"
                :disabled="cart.length === 0"
              >
                <i class="fas fa-check-circle"></i> Create Order
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Product Details Modal -->
      <div v-if="selectedProduct" class="modal-overlay">
        <div class="modal-content product-details-modal">
          <div class="modal-header">
            <h2>{{ selectedProduct.name }}</h2>
            <button @click="selectedProduct = null" class="close-modal-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="product-image-container">
              <img 
                :src="selectedProduct.image || '/img/placeholder.jpg'" 
                :alt="selectedProduct.name" 
                class="product-detail-image"
                @error="handleImageError"
              >
            </div>
            
            <div class="product-details">
              <p class="description">{{ selectedProduct.description || 'No description available' }}</p>
              <p class="base-price">
                <span class="label">Base Price:</span> 
                <span class="value">{{ formatPrice(selectedProduct.price) }}</span>
              </p>
              
              <div v-if="selectedProduct.choices && selectedProduct.choices.length > 0" class="choices-section">
                <h3>Options</h3>
                <div class="choices-list">
                  <div 
                    v-for="choice in selectedProduct.choices" 
                    :key="choice.choice_id"
                    :class="['choice-option', selectedChoice === choice ? 'selected' : '']"
                    @click="selectChoice(choice)"
                  >
                    <div class="choice-info">
                      <span class="choice-name">{{ choice.name }}</span>
                      <span class="choice-price">+{{ formatPrice(choice.price_adjustment) }}</span>
                    </div>
                    <span class="choice-stock">{{ choice.stock }} available</span>
                  </div>
                </div>
              </div>
              
              <div class="quantity-section">
                <h3>Quantity</h3>
                <div class="quantity-selector">
                  <button @click="decreaseModalQuantity" class="qty-btn large">
                    <i class="fas fa-minus"></i>
                  </button>
                  <span class="modal-quantity">{{ modalQuantity }}</span>
                  <button @click="increaseModalQuantity" class="qty-btn large">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <p class="total-price">
              Total: {{ formatPrice(calculateItemTotal()) }}
            </p>
            <button @click="addToCart" class="add-to-cart-btn" :disabled="!canAddToCart">
              <i class="fas fa-cart-plus"></i> Add to Order
            </button>
          </div>
        </div>
      </div>
      
      <!-- Order Confirmation Modal -->
      <div v-if="showOrderConfirmation" class="modal-overlay">
        <div class="modal-content confirmation-modal">
          <div class="modal-header">
            <h2>Order Confirmation</h2>
          </div>
          
          <div class="modal-body">
            <p>Order has been successfully created!</p>
            <div class="order-info">
              <p><strong>Order ID:</strong> {{ createdOrderId }}</p>
              <p><strong>Total Amount:</strong> {{ formatPrice(cartTotal) }}</p>
              <p><strong>Items:</strong> {{ cart.length }}</p>
            </div>
            <p class="note">Admin will need to process the payment for this order.</p>
          </div>
          
          <div class="modal-footer">
            <button @click="startNewOrder" class="primary-btn">
              <i class="fas fa-check"></i> Create New Order
            </button>
            <button @click="viewOrderDetails" class="secondary-btn">
              <i class="fas fa-eye"></i> View Order Details
            </button>
          </div>
        </div>
      </div>
      
      <!-- Logout Modal -->
      <div v-if="showLogoutModal" class="modal-overlay">
        <div class="modal-content logout-modal">
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to logout?</p>
          <div class="modal-buttons">
            <button @click="handleLogout" class="confirm-btn">Yes, Logout</button>
            <button @click="showLogoutModal = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  

  <script>
  import StaffNavbar from '../../components/StaffNavbar.vue'
  
  export default {
    name: 'CreateOrder',
    components: {
      StaffNavbar
    },
    data() {
      return {
        username: '',
        showLogoutModal: false,
        products: [],
        searchQuery: '',
        cart: [],
        customerName: '',
        selectedProduct: null,
        selectedChoice: null,
        modalQuantity: 1,
        showOrderConfirmation: false,
        createdOrderId: '',
        // Pagination data
        currentPage: 1,
        itemsPerPage: 12,
        categories: [],
        predefinedCategories: [
            { id: null, name: 'All' },
            { id: 'beverages', name: 'Beverages' },
            { id: 'milk-chocolate', name: 'Milk and Chocolate Drink' },
            { id: 'coffee-creamer', name: 'Coffee and Creamer' },
            { id: 'condiments', name: 'Condiments' },
            { id: 'canned-goods', name: 'Canned Goods' },
            { id: 'biscuits', name: 'Biscuits' },
            { id: 'candies-snacks', name: 'Candies and Snacks' }
            ],
        selectedCategory: null,
      }
    },
    computed: {
      filteredProducts() {
        return this.products.filter(product => {
          const searchMatch = !this.searchQuery || 
            product.name.toLowerCase().includes(this.searchQuery.toLowerCase());
          
          const categoryMatch = !this.selectedCategory || 
            product.category_id === this.selectedCategory;
          
          const inStock = product.stock_quantity > 0;
          
          return searchMatch && categoryMatch && inStock;
        });
      },
      totalPages() {
        return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
      },
      paginatedProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredProducts.slice(startIndex, endIndex);
      },
      cartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      canAddToCart() {
        if (!this.selectedProduct) return false;
        
        if (this.selectedChoice) {
          return this.selectedChoice.stock >= this.modalQuantity;
        }
        
        return this.selectedProduct.stock_quantity >= this.modalQuantity;
      }
    },
    methods: {
        selectCategory(categoryId) {
            this.selectedCategory = categoryId;
            this.currentPage = 1; // Reset to first page when changing category
        },
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
            },
            prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
            },
            async fetchProducts() {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:7904/api/products', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                    });
                    
                    if (response.ok) {
                    const data = await response.json();
                    // Enhance products with has_choices flag
                    this.products = await Promise.all(data.map(async product => {
                        // Check if product has choices
                        try {
                        const choicesResponse = await fetch(
                            `http://localhost:7904/api/products/${product.products_id}/has-choices`, 
                            {
                            headers: { 'Authorization': `Bearer ${token}` }
                            }
                        );
                        if (choicesResponse.ok) {
                            const { hasChoices } = await choicesResponse.json();
                            return { ...product, has_choices: hasChoices };
                        }
                        } catch (error) {
                        console.error('Error checking product choices:', error);
                        }
                        return { ...product, has_choices: false };
                    }));
                    
                    // Use predefined categories
                    this.categories = [...this.predefinedCategories];
                    
                    // Map products to categories
                    this.products = this.products.map(product => {
                        // Find matching category in predefined list
                        const categoryMatch = this.categories.find(cat => 
                        cat.name === product.category
                        );
                        
                        return {
                        ...product,
                        category_name: product.category || 'Uncategorized',
                        // Use the matched category ID or null if no match
                        category_id: categoryMatch ? categoryMatch.id : null
                        };
                    });
                    }
                } catch (error) {
                    console.error('Error fetching products:', error);
                }
                },
      async fetchProductChoices(productId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:7904/api/products/${productId}/choices`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const choices = await response.json();
            this.selectedProduct = {
              ...this.selectedProduct,
              choices: choices.filter(choice => choice.stock > 0)
            };
          }
        } catch (error) {
          console.error('Error fetching product choices:', error);
        }
      },
      showProductDetails(product) {
        this.selectedProduct = {...product};
        this.selectedChoice = null;
        this.modalQuantity = 1;
        
        // Fetch product choices if not already present
        if (!this.selectedProduct.choices) {
            this.fetchProductChoices(product.products_id);
        }
        },
      selectChoice(choice) {
        this.selectedChoice = this.selectedChoice === choice ? null : choice;
        this.modalQuantity = 1; 
      },
      increaseModalQuantity() {
        const maxStock = this.selectedChoice 
          ? this.selectedChoice.stock 
          : this.selectedProduct.stock_quantity;
        
        if (this.modalQuantity < maxStock) {
          this.modalQuantity++;
        }
      },
      decreaseModalQuantity() {
        if (this.modalQuantity > 1) {
          this.modalQuantity--;
        }
      },
      calculateItemTotal() {
        if (!this.selectedProduct) return 0;
        
        let price = this.selectedProduct.price;
        
        if (this.selectedChoice) {
          price += parseFloat(this.selectedChoice.price_adjustment || 0);
        }
        
        return price * this.modalQuantity;
      },
      addToCart() {
        if (!this.canAddToCart) return;
        
        const item = {
          product_id: this.selectedProduct.products_id,
          name: this.selectedProduct.name,
          price: this.selectedProduct.price,
          quantity: this.modalQuantity,
          image: this.selectedProduct.image
        };
        
        if (this.selectedChoice) {
          item.choice_id = this.selectedChoice.choice_id;
          item.choice_name = this.selectedChoice.name;
          item.price += parseFloat(this.selectedChoice.price_adjustment || 0);
        }
        
        this.cart.push(item);
        this.selectedProduct = null;
      },
      increaseQuantity(index) {
        this.cart[index].quantity++;
      },
      decreaseQuantity(index) {
        if (this.cart[index].quantity > 1) {
          this.cart[index].quantity--;
        }
      },
      removeItem(index) {
        this.cart.splice(index, 1);
      },
      clearCart() {
        this.cart = [];
      },
      async createOrder() {
        if (this.cart.length === 0) return;
        
        try {
          const token = localStorage.getItem('token');
          const orderData = {
            items: this.cart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              choice_id: item.choice_id || null
            })),
            customerName: this.customerName || 'Walk-in Customer',
            isPhysicalOrder: true
          };
          
          const response = await fetch('http://localhost:7904/api/staff/orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
          });
          
          if (response.ok) {
            const result = await response.json();
            this.createdOrderId = result.orderId;
            this.showOrderConfirmation = true;
          } else {
            const errorData = await response.json();
            alert(`Error creating order: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error creating order:', error);
          alert('Error creating order. Please try again.');
        }
      },
      startNewOrder() {
        this.clearCart();
        this.customerName = '';
        this.showOrderConfirmation = false;
        this.createdOrderId = '';
      },
      viewOrderDetails() {
        this.showOrderConfirmation = false;
        this.$router.push(`/staff/orders/${this.createdOrderId}`);
      },
      formatPrice(price) {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(price).replace('PHP', '₱');
      },
      handleImageError(e) {
        e.target.src = '/img/placeholder.jpg';
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
        this.username = decoded.username;
      }
      this.fetchProducts();
    },
    watch: {
        // Reset pagination when search query changes
        searchQuery() {
        this.currentPage = 1;
        }
    },
  }
  </script>
  
  <style scoped>
  .staff-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-left: 250px;
  }
  
  .staff-content {
    padding: 2rem;
  }
  
  .staff-content h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .order-creation-section {
    display: flex;
    gap: 2rem;
    height: calc(100vh - 180px);
  }
  
  .selection-panel {
    flex: 2;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .search-section {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .search-box {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }
  
  .search-box input {
    width: 95%;
    padding: 0.875rem 1rem 0.875rem 2.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
  }
  
  .search-box input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .category-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .category-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background-color: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .category-btn.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  .products-grid {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .product-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    border-color: #cbd5e0;
  }
  
  .product-image-wrapper {
  position: relative;
  height: 150px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.variant-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.product-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
  
.product-info h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  height: 2.6em;
}

.price {
  font-weight: 600;
  color: #3b82f6;
  margin: 0.25rem 0 0.5rem 0;
  font-size: 1.1rem;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}
  
.category-tag {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin: 0;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
  
  .low-stock {
    color: #ef4444;
  }
  .pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
  color: #64748b;
}
  
.no-products {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #94a3b8;
  text-align: center;
}

.no-products i {
  font-size: 3rem;
  margin-bottom: 1rem;
}
  
  .order-summary-panel {
    flex: 1;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .order-summary-panel h2 {
    margin: 0 0 1.5rem 0;
    color: #1e293b;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .customer-info {
    margin-bottom: 1.5rem;
  }
  
  .customer-name-input {
    width: 95%;
    padding: 0.875rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
  }
  
  .customer-name-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .cart-items {
    flex: 1;
    overflow-y: auto;
  }
  
  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .item-info h4 {
    margin: 0;
    font-size: 1rem;
    color: #1e293b;
  }
  
  .variant-tag {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    width: fit-content;
  }
  
  .quantity-control {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .qty-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
  }
  
  .qty-btn:hover {
    background: #e2e8f0;
  }
  
  .qty-btn.large {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
  
  .quantity {
    font-weight: 500;
    min-width: 24px;
    text-align: center;
  }
  
  .modal-quantity {
    font-size: 1.2rem;
    font-weight: 600;
    min-width: 36px;
    text-align: center;
  }
  
  .item-price {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .item-price p {
    margin: 0;
    font-weight: 600;
    color: #1e293b;
  }
  
  .remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.25rem;
    border-radius: 4px;
  }
  
  .remove-btn:hover {
    background: #fee2e2;
  }
  
  .empty-cart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #94a3b8;
    text-align: center;
  }
  
  .empty-cart i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .price-summary {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .subtotal {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .order-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .primary-btn, .secondary-btn {
    flex: 1;
    padding: 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s;
  }
  
  .primary-btn {
    background: #10b981;
    color: white;
  }
  
  .primary-btn:hover {
    background: #059669;
  }
  
  .secondary-btn {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
  
  .secondary-btn:hover {
    background: #e2e8f0;
  }
  
  .primary-btn:disabled, .secondary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .product-details-modal {
    width: 800px;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #1e293b;
  }
  
  .close-modal-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;
  }
  
  .close-modal-btn:hover {
    color: #1e293b;
  }
  
  .modal-body {
    padding: 1.5rem;
    display: flex;
    gap: 2rem;
  }
  
  .product-image-container {
    flex: 1;
  }
  
  .product-detail-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .product-details {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .description {
    color: #64748b;
    margin: 0;
  }
  
  .base-price {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
    margin: 0;
  }
  
  .base-price .value {
    font-weight: 600;
    color: #1e293b;
  }
  
  .choices-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .choices-section h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
  }
  
  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .choice-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .choice-option:hover {
    background: #f8fafc;
  }
  
  .choice-option.selected {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  .choice-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .choice-name {
    font-weight: 500;
    color: #1e293b;
  }
  
  .choice-price {
    font-size: 0.875rem;
    color: #3b82f6;
  }
  
  .choice-stock {
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .quantity-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .quantity-section h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
  }
  
  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .total-price {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
  
  .add-to-cart-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s;
  }
  
  .add-to-cart-btn:hover {
    background: #059669;
  }
  
  .add-to-cart-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
  
  /* Confirmation Modal */
  .confirmation-modal {
    width: 500px;
  }
  
  .confirmation-modal .modal-body {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .order-info {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    width: 100%;
    margin: 1rem 0;
  }
  
  .order-info p {
    margin: 0.5rem 0;
    color: #1e293b;
  }
  
  .note {
    color: #64748b;
    font-style: italic;
    margin-top: 1rem;
  }
  
  .confirmation-modal .modal-footer {
    justify-content: center;
    gap: 1rem;
  }
  
  /* Logout Modal */
  .logout-modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
  }
  
  .logout-modal h2 {
    margin-top: 0;
    color: #1e293b;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .confirm-btn, .cancel-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .confirm-btn {
    background-color: #ef4444;
    color: white;
  }
  
  .cancel-btn {
    background-color: #94a3b8;
    color: white;
  }
  
  .confirm-btn:hover {
    background-color: #dc2626;
  }
  
  .cancel-btn:hover {
    background-color: #64748b;
  }
  
  @media (max-width: 1200px) {
    .order-creation-section {
      flex-direction: column;
      height: auto;
    }
  
    .selection-panel, .order-summary-panel {
      width: 100%;
    }
  
    .selection-panel {
      height: 500px;
    }
  
    .modal-body {
      flex-direction: column;
    }
  
    .product-detail-image {
      height: 200px;
    }
  }
  
  @media (max-width: 768px) {
    .staff-container {
      padding-left: 60px;
    }
  
    .staff-content {
      padding: 1rem;
    }
  
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
  
    .order-actions {
      flex-direction: column;
    }
  }
  </style>