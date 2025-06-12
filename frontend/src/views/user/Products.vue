<template>
    <div class="product-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="product-content">

            <div class="filters-container">
                <div class="search-filter">
                    <label for="search"><i class="fas fa-search"></i> Search by Name:</label>
                    <input type="text" id="search" v-model="searchQuery" @input="fetchProducts"
                        placeholder="Enter product name" />
                </div>

                <div class="price-filter">
                    <label for="minPrice"><i class="fas fa-dollar-sign"></i> Price Range:</label>
                    <input type="number" id="minPrice" v-model="minPrice" @input="fetchProducts" placeholder="Min" />
                    <span class="separator">-</span>
                    <input type="number" id="maxPrice" v-model="maxPrice" @input="fetchProducts" placeholder="Max" />
                </div>

                <button @click="resetFilters" class="reset-filter-btn"><i class="fas fa-undo"></i> Reset Filters</button>
            </div>
            <div class="table-wrapper">
                <div class="category-selector">
                    <button 
                        v-for="category in categories" 
                        :key="category.value"
                        :class="['category-btn', { active: selectedCategory === category.value }]"
                        @click="selectedCategory = category.value; fetchProducts()"
                    >
                        {{ category.label }}
                    </button>
                </div>
            </div>

            <div v-if="loading" class="loading-message">
                <i class="fas fa-spinner fa-spin"></i> Loading products...
            </div>
            <div class="products-grid">
                <div v-for="product in filteredProducts" :key="product.products_id" class="product-card">
                    <div class="product-image-container">
                        <img 
                            :src="product.image || '/img/placeholder.jpg'"
                            :alt="product.name" 
                            class="product-image"
                            @error="handleImageError"
                        >
                        <span class="sold-badge" v-if="parseInt(product.total_sold) > 0">
                            <i class="fas fa-fire"></i> {{ parseInt(product.total_sold) }} sold
                        </span>
                    </div>
                    <div class="product-details">
                        <h3>{{ product.name }}</h3>
                        <!-- Product Rating Stars -->
                        <div class="product-rating">
                            <div class="star-rating">
                                <i v-for="i in 5" :key="i" class="fas fa-star" 
                                   :class="{ 'filled': i <= (product.rating || 0) }"></i>
                            </div>
                            <span v-if="product.rating" class="rating-count">
                                {{ product.rating.toFixed(1) }} ({{ product.review_count || 0 }})
                            </span>
                            <span v-else class="rating-count">No reviews yet</span>
                        </div>
                        <p class="product-description">{{ product.description }}</p>
                        <div class="product-info">
                            <p class="product-price">
                                <template v-if="hasChoices(product) && getPriceRange(product).min !== getPriceRange(product).max">
                                    {{ formatPrice(getPriceRange(product).min) }} - {{ formatPrice(getPriceRange(product).max) }}
                                </template>
                                <template v-else>
                                    {{ formatPrice(product.price) }}
                                </template>
                            </p>
                            <p class="product-stock" :class="{ 'low-stock': getTotalStock(product) <= 10 }">
                                <i class="fas fa-box"></i> 
                                {{ getTotalStock(product) }} in stock
                            </p>
                        </div>
                        <p class="product-category">
                            <i class="fas fa-tag"></i> {{ product.category }}
                            <span v-if="product.total_sold && product.total_sold > 0" class="total-sold">
                                <i class="fas fa-fire"></i> {{ product.total_sold }} sold
                            </span>
                        </p>
                    </div>
                    <button 
                        class="add-to-cart-btn" 
                        @click="showQuantityModal(product)"
                        :disabled="getTotalStock(product) === 0"
                    >
                        <i class="fas fa-shopping-cart"></i> 
                        {{ getTotalStock(product) === 0 ? 'Out of Stock' : 'Add to Cart' }}
                    </button>
                </div>
            </div>
            <div v-if="filteredProducts.length === 0 && !loading" class="no-products-message">
                <i class="fas fa-box-open"></i>
                No products found matching your criteria.
            </div>
        </div>

        <LogoutModal :show="showLogoutModal" @confirm="handleLogout" @cancel="showLogoutModal = false" />
        <QuantityModal 
            :show="showModal" 
            :productStock="selectedProduct ? selectedProduct.stock_quantity : 0"
            :product="selectedProduct"
            @confirm="confirmAddToCart" 
            @cancel="cancelAddToCart" 
        />
    </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import QuantityModal from '../../components/QuantityModal.vue';

export default {
    name: 'Products',
    components: {
        Navbar,
        LogoutModal,
        QuantityModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            products: [],
            loading: false,
            selectedCategory: '',
            searchQuery: '',
            minPrice: null,
            maxPrice: null,
            cart: [],
            showModal: false,
            selectedProduct: null,
            categories: [
                { label: 'All', value: '' },
                { label: 'Beverages', value: 'Beverages' },
                { label: 'Milk & Chocolate', value: 'Milk and Chocolate Drink' },
                { label: 'Coffee & Creamer', value: 'Coffee and Creamer' },
                { label: 'Condiments', value: 'Condiments' },
                { label: 'Canned Goods', value: 'Canned Goods' },
                { label: 'Biscuits', value: 'Biscuits' },
                { label: 'Candies & Snacks', value: 'Candies and Snacks' }
            ],
        };
    },
    computed: {
        filteredProducts() {
            let filtered = this.products.map(product => ({
                ...product,
                total_sold: parseInt(product.total_sold) || 0
            }));

            if (this.searchQuery) {
                const searchTerm = this.searchQuery.toLowerCase();
                filtered = filtered.filter(product =>
                    product.name.toLowerCase().includes(searchTerm)
                );
            }

            if (this.minPrice !== null) {
                filtered = filtered.filter(product => product.price >= this.minPrice);
            }

            if (this.maxPrice !== null) {
                filtered = filtered.filter(product => product.price <= this.maxPrice);
            }

            return filtered;
        }
    },
    methods: {
        hasChoices(product) {
            return product.choices && product.choices.length > 0;
        },
        
        getPriceRange(product) {
            if (!this.hasChoices(product)) {
                return { min: product.price, max: product.price };
            }
            
            let min = Infinity;
            let max = 0;
            
            // Check base product price
            if (product.price) {
                min = Math.min(min, parseFloat(product.price));
                max = Math.max(max, parseFloat(product.price));
            }
            
            // Check all choice prices
            product.choices.forEach(choice => {
                if (choice.price && parseFloat(choice.price) > 0) {
                    min = Math.min(min, parseFloat(choice.price));
                    max = Math.max(max, parseFloat(choice.price));
                }
            });
            
            // If no valid prices were found, default to product price
            if (min === Infinity) min = parseFloat(product.price) || 0;
            if (max === 0) max = parseFloat(product.price) || 0;
            
            return { min, max };
        },
        
        getTotalStock(product) {
            if (!this.hasChoices(product)) {
                return product.stock_quantity;
            }
            
            // Sum up stock from all choices
            let totalStock = product.choices.reduce((sum, choice) => {
                return sum + (parseInt(choice.stock) || 0);
            }, 0);
            
            // If no choices have stock defined, fall back to product stock
            if (totalStock === 0 && product.stock_quantity) {
                return product.stock_quantity;
            }
            
            return totalStock;
        },
        handleImageError(e) {
            e.target.src = '/img/placeholder.jpg'
        },
        formatPrice(price) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price).replace('PHP', '₱');
        },
        showQuantityModal(product) {
            this.selectedProduct = product;
            this.showModal = true;
        },
        cancelAddToCart() {
            this.showModal = false;
            this.selectedProduct = null;
        },
        async confirmAddToCart(data) {
            if (!this.selectedProduct) return;
            
            try {
                const token = localStorage.getItem('token');
                
                // Get the appropriate price
                let price = this.selectedProduct.price;
                
                const payload = {
                    productId: this.selectedProduct.products_id,
                    quantity: data.quantity
                };
                
                // Add choice_id if a choice was selected
                if (data.choice && data.choice.choice_id) {
                    payload.choiceId = data.choice.choice_id;
                    price = data.choice.price; // Use the choice price
                }
                
                const response = await fetch('http://localhost:7904/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    console.log('Product added to cart successfully');
                    await this.fetchCart();
                    window.location.reload();
                } else {
                    const error = await response.json();
                    console.error('Failed to add product:', error);
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
            } finally {
                this.showModal = false;
                this.selectedProduct = null;
            }
        },
        async fetchCart() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/cart', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    this.cart = await response.json();
                } else {
                    console.error('Failed to fetch cart');
                    this.cart = [];
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
                this.cart = [];
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
        async getUserData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                const response = await fetch('http://localhost:7904/api/users/getUsername', {
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
        async fetchProducts() {
            this.loading = true;
            try {
                const token = localStorage.getItem('token');
                let url = 'http://localhost:7904/api/products';
                if (this.selectedCategory) {
                    url = `http://localhost:7904/api/products/category/${this.selectedCategory}`;
                }

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.products = data.map(product => ({
                        ...product,
                        total_sold: parseInt(product.total_sold) || 0
                    }));
                    
                    // Fetch product ratings after getting products
                    await this.fetchProductRatings();
                    
                } else {
                    if (response.status === 401) {
                        // Handle unauthorized access
                        this.$router.push('/login');
                    }
                    this.products = [];
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                this.products = [];
            } finally {
                this.loading = false;
            }
        },
        
        async fetchProductRatings() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/products/ratings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const ratingsData = await response.json();
                    
                    // Map ratings data to products
                    this.products = this.products.map(product => {
                        const productRating = ratingsData.find(r => r.product_id === product.products_id);
                        if (productRating) {
                            return {
                                ...product,
                                rating: parseFloat(productRating.avg_rating) || 0,
                                review_count: parseInt(productRating.review_count) || 0
                            };
                        }
                        return product;
                    });
                }
            } catch (error) {
                console.error('Error fetching product ratings:', error);
            }
        },
        
        resetFilters() {
            this.searchQuery = '';
            this.minPrice = null;
            this.maxPrice = null;
            this.selectedCategory = '';
            this.fetchProducts(); // Refresh products after resetting filters
        }
    },
    async mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
            return;
        }
        
        try {
            await this.getUserData();
            await this.fetchProducts();
            await this.fetchCart();
        } catch (error) {
            console.error('Error in mounted:', error);
            if (error.response?.status === 401) {
                this.$router.push('/login');
            }
        }
    }
};
</script>

<style scoped>
.product-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
}
.product-content {
    margin: 0 auto;
    padding: 2rem;
}

.product-content h1 {
    color: #1e293b;
    font-size: 2rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

.star-rating .fa-star.filled {
    color: #ffca28;
}

.rating-count {
    font-size: 0.8rem;
    color: #64748b;
}

/* Filters Section */
.filters-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
    background-color: #fff;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    justify-content: space-around;
}

.search-filter,
.price-filter,
.category-filter {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    flex: 1;
    min-width: 200px;
}

.search-filter label,
.price-filter label,
.category-filter label {
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.8rem;
    white-space: nowrap;
}

.search-filter input,
.price-filter input,
.category-filter select {
    padding: 6px;
    border-radius: 6px;
    border: 1px solid #ddd;
    font-size: 0.8rem;
    flex: 1;
}

.search-filter input::placeholder {
    color: #aaa;
}

.price-filter input {
    width: 60px;
}

.separator {
    margin: 0 3px;
    color: #777;
}

.reset-filter-btn {
    background-color: #f44336;
    color: white;
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background-color 0.3s ease;
    white-space: nowrap;
}

.reset-filter-btn:hover {
    background-color: #d32f2f;
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* Reduced from 280px */
    gap: 1.5rem; /* Reduced from 2rem */
    margin-top: 1.5rem; /* Reduced from 2rem */
}

.product-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
}
.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.product-image-container {
    position: relative;
    width: 100%;
    height: 160px; /* Reduced from 200px */
    overflow: hidden;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.product-card:hover .product-image {
    transform: scale(1.05);
}
.product-details {
    padding: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* This helps create consistent spacing */
    min-height: 180px; /* Set minimum height for consistency */
}
.sold-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    z-index: 10; /* Increased z-index */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(4px);
    font-weight: 600; /* Made text bolder */
}

.sold-badge i {
    font-size: 0.7rem;
}
.product-details h3 {
    margin: 0 0 0.3rem 0; /* Add bottom margin */
    color: #1e293b;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.3;
}

.product-description {
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.5rem 0 0.8rem 0; /* Add more bottom margin */
    flex-grow: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Limit to 2 lines */
    line-clamp: 2; /* Standard property for compatibility */
    -webkit-box-orient: vertical;
}

.product-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.7rem 0; /* Reduced margin */
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
    justify-content: space-between;
    color: #64748b;
    font-size: 0.85rem;
    margin: 0.5rem 0 0 0; /* Add top margin only */
    padding: 0;
    border-top: 1px solid #f0f0f0; /* Add a subtle separator */
    padding-top: 0.5rem;
}

.add-to-cart-btn {
    background-color: #4CAF50;
    color: white;
    border: 2px solid transparent;
    padding: 0.8rem 1rem; /* Reduced padding */
    border-radius: 8px; /* Changed to match card style */
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 0 1rem 1rem 1rem; /* Add top margin of 0 */
    width: calc(100% - 2rem);
    box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
    transition: all 0.3s ease;
}
.add-to-cart-btn:hover:not(:disabled) {
    background-color: white;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

.add-to-cart-btn:disabled {
    background-color: #cccccc;
    border: 2px solid transparent;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.add-to-cart-btn i {
    font-size: 0.9em;
    line-height: 1;
}
.total-sold {
    margin-left: auto;
    color: #ef4444;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 500;
}
/* Loading and No Products Messages */
.loading-message {
    text-align: center;
    color: #64748b;
    padding: 3rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.no-products-message {
    text-align: center;
    color: #64748b;
    padding: 3rem;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 1.1rem;
}
.table-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
    margin-bottom: 1.5rem;
}


.category-selector {
    display: flex;
    flex-wrap: wrap;
    background-color: white;
    padding: 1rem;
    gap: 0.75rem;
    justify-content: center;
}

.category-btn {
    background-color: #4CAF50;
    color: white;
    border: 2px solid transparent;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
    transition: all 0.3s ease;
    min-width: 120px;
    flex: 0 1 auto;
}

.category-btn:hover {
    background-color: white;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

.category-btn.active {
    background-color: white;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}
/* Responsive adjustments */
@media (max-width: 1024px) {
    .product-content {
        padding: 1.5rem;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }
}

@media (max-width: 768px) {
    .category-btn {
        min-width: 150px;
        font-size: 0.9rem;
        padding: 0.7rem 1rem;
    }
    .product-content {
        padding: 1rem;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .product-image-container {
        height: 180px;
    }

    .product-details {
        padding: 1rem;
    }

    .product-price {
        font-size: 1.1rem;
    }
}

@media (max-width: 480px) {
    .category-selector {
        padding: 0.75rem;
        gap: 0.5rem;
    }
    
    .category-btn {
        min-width: calc(50% - 0.5rem);
        font-size: 0.85rem;
        padding: 0.6rem 0.75rem;
    }
    .product-content h1 {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .products-grid {
        grid-template-columns: 1fr;
    }
}
</style>