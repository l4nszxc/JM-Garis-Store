<template>
    <div class="product-container">
        <Navbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="product-content">
            <div class="filters-container">
                <div class="search-filter">
                    <div class="input-with-icon">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search" v-model="searchQuery" @input="fetchProducts"
                            placeholder="Search products..." />
                    </div>
                </div>

                <div class="price-filter">
                    <div class="price-range-inputs">
                        <input type="number" id="minPrice" v-model="minPrice" @input="fetchProducts" placeholder="Min" />
                        <div class="price-divider"></div>
                        <input type="number" id="maxPrice" v-model="maxPrice" @input="fetchProducts" placeholder="Max" />
                    </div>
                    <span class="price-label">Price Range</span>
                </div>

                <button @click="resetFilters" class="reset-filter-btn">
                    <i class="fas fa-undo-alt"></i>
                    <span>Reset</span>
                </button>
            </div>
            

            <div class="category-selector-wrapper">
                <div class="category-selector" ref="categoryScroller">
                    <button 
                        v-for="category in categories" 
                        :key="category.value"
                        :class="['category-btn', { active: selectedCategory === category.value }]"
                        @click="selectedCategory = category.value; fetchProducts()"
                    >
                        {{ category.label }}
                    </button>
                </div>
                <div class="scroll-indicator left" @click="scrollCategories('left')" v-show="showLeftScroll">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <div class="scroll-indicator right" @click="scrollCategories('right')" v-show="showRightScroll">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>

            <transition name="fade" mode="out-in">
                <div v-if="loading" class="loading-message" key="loading">
                    <div class="loader">
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                        <div class="loader-circle"></div>
                    </div>
                    <span>Finding products for you...</span>
                </div>
                <div v-else-if="filteredProducts.length === 0" class="no-products-message" key="no-products">
                    <i class="fas fa-box-open"></i>
                    <div>
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search criteria</p>
                    </div>
                </div>
                <div v-else class="products-grid" key="products">
                    <div 
                        v-for="product in filteredProducts" 
                        :key="product.products_id" 
                        class="product-card"
                        @click="viewProductDetails(product.products_id)"
                    >
                        <div class="product-image-container">
                            <img 
                                :src="product.image || '/img/placeholder.jpg'"
                                :alt="product.name" 
                                class="product-image"
                                @error="handleImageError"
                                loading="lazy"
                            >
                            <transition name="badge-slide">
                                <span class="sold-badge" v-if="parseInt(product.total_sold) > 0">
                                    <i class="fas fa-fire-alt"></i> {{ parseInt(product.total_sold) }} sold
                                </span>
                            </transition>
                            <div class="image-overlay">
                                <div class="quick-view-btn">
                                    <i class="fas fa-eye"></i> Quick View
                                </div>
                            </div>
                        </div>
                        <div class="product-details">
                            <h3>{{ product.name }}</h3>
                            
                            <div class="product-rating">
                                <div class="star-rating">
                                    <div class="stars-background">
                                        <i v-for="i in 5" :key="`bg-${i}`" class="fas fa-star"></i>
                                    </div>
                                    <div class="stars-foreground" :style="{width: `${(product.rating || 0) * 20}%`}">
                                        <i v-for="i in 5" :key="`fg-${i}`" class="fas fa-star"></i>
                                    </div>
                                </div>
                                <span v-if="product.rating" class="rating-count">
                                    {{ product.rating.toFixed(1) }} ({{ product.review_count || 0 }})
                                </span>
                                <span v-else class="rating-count">No reviews</span>
                            </div>
                            
                            <p class="product-description">{{ product.description }}</p>
                            
                            <div class="product-meta">
                                <span class="category-tag">
                                    <i class="fas fa-tag"></i> {{ product.category }}
                                </span>
                                <div class="product-stock" :class="{ 'low-stock': getTotalStock(product) <= 10 }">
                                    <i class="fas fa-cubes"></i> 
                                    {{ getTotalStock(product) > 0 ? `${getTotalStock(product)} in stock` : 'Out of stock' }}
                                </div>
                            </div>
                            
                            <div class="product-price-row">
                                <p class="product-price">
                                    <template v-if="hasChoices(product) && getPriceRange(product).min !== getPriceRange(product).max">
                                        {{ formatPrice(getPriceRange(product).min) }} - {{ formatPrice(getPriceRange(product).max) }}
                                    </template>
                                    <template v-else-if="hasChoices(product)">
                                        {{ formatPrice(getPriceRange(product).min) }}
                                    </template>
                                    <template v-else>
                                        {{ formatPrice(product.price) }}
                                    </template>
                                </p>
                                <button 
                                    class="add-to-cart-btn" 
                                    @click.stop="showQuantityModal(product)"
                                    :disabled="getTotalStock(product) === 0"
                                >
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>

        <LogoutModal :show="showLogoutModal" @confirm="handleLogout" @cancel="showLogoutModal = false" />
        <QuantityModal 
            :show="showModal" 
            :productStock="selectedProduct ? selectedProduct.stock_quantity : 0"
            :product="selectedProduct"
            @confirm="confirmAddToCart" 
            @cancel="cancelAddToCart" 
        />
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
import QuantityModal from '../../components/QuantityModal.vue';

import { apiPost, apiGet, apiDelete, replaceLocalhostUrl } from '@/config/api'

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
                { label: 'All Products', value: '' },
                { label: 'Beverages', value: 'Beverages' },
                { label: 'Milk & Chocolate', value: 'Milk and Chocolate Drink' },
                { label: 'Coffee & Creamer', value: 'Coffee and Creamer' },
                { label: 'Condiments', value: 'Condiments' },
                { label: 'Canned Goods', value: 'Canned Goods' },
                { label: 'Biscuits', value: 'Biscuits' },
                { label: 'Candies & Snacks', value: 'Candies and Snacks' },
                { label: 'Bar and Soap', value: 'Bar and Soap' }
            ],
            showLeftScroll: false,
            showRightScroll: false,
            notification: {
                show: false,
                message: '',
                type: 'success',
                icon: 'fas fa-check-circle'
            }
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
        viewProductDetails(productId) {
            this.$router.push(`/product/${productId}`);
        },
        hasChoices(product) {
            return product.choices && product.choices.length > 0;
        },
        getPriceRange(product) {
            if (!this.hasChoices(product)) {
                return { min: product.price, max: product.price };
            }
            
            let min = Infinity;
            let max = 0;
            
            product.choices.forEach(choice => {
                if (choice.price && parseFloat(choice.price) > 0) {
                    min = Math.min(min, parseFloat(choice.price));
                    max = Math.max(max, parseFloat(choice.price));
                }
            });
            
            if (min === Infinity) min = 0;
            if (max === 0) max = 0;
            
            return { min, max };
        },
        getTotalStock(product) {
            if (!this.hasChoices(product)) {
                return product.stock_quantity;
            }
            
            let totalStock = product.choices.reduce((sum, choice) => {
                return sum + (parseInt(choice.stock) || 0);
            }, 0);
            
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
                
                let price = this.selectedProduct.price;
                
                const payload = {
                    productId: this.selectedProduct.products_id,
                    quantity: data.quantity
                };
                
                if (data.choice && data.choice.choice_id) {
                    payload.choiceId = data.choice.choice_id;
                    price = data.choice.price;
                }
                
                const response = await this.$fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    await this.fetchCart();
                    // Show success notification
                    this.showNotification('Product added to cart successfully', 'success', 'fas fa-check-circle');
                    
                    // Dispatch event to update cart count
                    window.dispatchEvent(new CustomEvent('cart-updated'));
                } else {
                    const error = await response.json();
                    this.showNotification(error.message || 'Failed to add product to cart', 'error', 'fas fa-times-circle');
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                this.showNotification('Error adding product to cart', 'error', 'fas fa-times-circle');
            } finally {
                this.showModal = false;
                this.selectedProduct = null;
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
        },
        async fetchCart() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/cart', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    this.cart = await response.json();
                } else {
                    this.cart = [];
                }
            } catch (error) {
                this.cart = [];
            }
        },
        async handleLogout() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/users/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
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

                const response = await this.$fetch('/api/users/getUsername', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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
                let url = '/api/products';
                if (this.selectedCategory) {
                    url = `/api/products/category/${this.selectedCategory}`;
                }

                const response = await this.$fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.products = data.map(product => ({
                        ...product,
                        total_sold: parseInt(product.total_sold) || 0
                    }));
                    
                    await this.fetchProductRatings();
                    
                } else {
                    if (response.status === 401) {
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
                const response = await this.$fetch('/api/products/ratings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const ratingsData = await response.json();
                    
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
            this.fetchProducts();
        },
        checkCategoryScroll() {
            if (!this.$refs.categoryScroller) return;
            
            const scroller = this.$refs.categoryScroller;
            this.showLeftScroll = scroller.scrollLeft > 0;
            this.showRightScroll = scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 5;
        },
        scrollCategories(direction) {
            if (!this.$refs.categoryScroller) return;
            
            const scroller = this.$refs.categoryScroller;
            const scrollAmount = scroller.clientWidth / 2;
            
            if (direction === 'left') {
                scroller.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            } else {
                scroller.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            }
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
            
            // Set up category scroll check
            this.$nextTick(() => {
                this.checkCategoryScroll();
                
                if (this.$refs.categoryScroller) {
                    this.$refs.categoryScroller.addEventListener('scroll', this.checkCategoryScroll);
                    window.addEventListener('resize', this.checkCategoryScroll);
                }
            });
            
        } catch (error) {
            console.error('Error in mounted:', error);
            if (error.response?.status === 401) {
                this.$router.push('/login');
            }
        }
    },
    beforeDestroy() {
        if (this.$refs.categoryScroller) {
            this.$refs.categoryScroller.removeEventListener('scroll', this.checkCategoryScroll);
        }
        window.removeEventListener('resize', this.checkCategoryScroll);
    }
};
</script>

<style scoped>
/* Base Styles */
.product-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    color: #2a3f2a; /* Darker green text for contrast */
    width: 100%;
    margin: 0;
    padding: 0;
}

.product-content {
    width: 100%;
    padding: 1.5rem;
    margin: 0;
    box-sizing: border-box;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    color: #1e5b1e; /* Dark green text */
    font-size: 1.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

/* Filters Section */
.filters-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    background-color: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-left: 4px solid #4CAF50; /* Green accent border */
    margin: 0 auto; /* Center the container */
}

.search-filter {
    padding-bottom: 5px;
    flex: 2;
    min-width: 220px;
}

.input-with-icon {
    position: relative;
}

.input-with-icon i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #4CAF50; /* Green icon */
}

.input-with-icon input {
    width: 96%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.input-with-icon input:focus {
    border-color: #4CAF50; /* Green border on focus */
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15); /* Green glow */
    outline: none;
}

.price-filter {
    flex: 1;
    min-width: 200px;
    position: relative;
}

.price-range-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    background-color: white;
}

.price-range-inputs input {
    width: 100%;
    padding: 0.25rem 0.5rem;
    border: none;
    font-size: 0.95rem;
    text-align: center;
    outline: none;
}

.price-divider {
    width: 1.5rem;
    height: 1px;
    background-color: #4CAF50; /* Green divider */
}

.price-label {
    position: absolute;
    top: -0.5rem;
    left: 0.75rem;
    background-color: white;
    padding: 0 0.5rem;
    font-size: 0.75rem;
    color: #4CAF50; /* Green label */
}

.reset-filter-btn {
    background-color: white;
    color: #f44336;
    border: 1px solid #f44336;
    padding: 0 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.reset-filter-btn:hover {
    background-color: #fee2e2;
    transform: translateY(-1px);
}

/* Category Selector */
.category-selector-wrapper {
    position: relative;
    margin-bottom: 2rem;
    width: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
}

.category-selector {
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 12px;
    overflow-x: auto;
    scroll-behavior: smooth;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-left: 4px solid #4CAF50; /* Green accent border */
    max-width: 90%; /* Prevent extending too far */
    margin: 0 auto; /* Center the container */
}

.category-selector::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome, Safari and Opera */
}

.scroll-indicator {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 2.5rem;
    height: 2.5rem;
    background-color: rgba(76, 175, 80, 0.9); /* Semi-transparent green */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    transition: all 0.2s ease;
    color: white;
}

.scroll-indicator:hover {
    background-color: #4CAF50; /* Solid green on hover */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.scroll-indicator.left {
    left: 0;
}

.scroll-indicator.right {
    right: 0;
}

.scroll-indicator i {
    color: white;
}

.category-btn {
    background-color: white;
    color: #4CAF50; /* Green text */
    border: 1px solid #4CAF50; /* Green border */
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    flex-shrink: 0;
}

.category-btn:hover {
    background-color: #f1f9f1; /* Very light green on hover */
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.1);
}

.category-btn.active {
    background-color: #4CAF50; /* Green background when active */
    color: white;
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
    width: 100%;
}

.product-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    position: relative;
    will-change: transform, box-shadow;
    border-left: 3px solid #4CAF50; /* Green accent border */
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(76, 175, 80, 0.15); /* Green-tinted shadow */
}

.product-image-container {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
    background-color: #f9fff9; /* Very light green background */
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover .product-image {
    transform: scale(1.08);
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(76, 175, 80, 0.3), transparent); /* Green gradient */
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease;
}

.product-card:hover .image-overlay {
    opacity: 1;
}

.quick-view-btn {
    background-color: rgba(255, 255, 255, 0.9);
    color: #2a3f2a; /* Dark green text */
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transform: translateY(10px);
    opacity: 0;
    transition: all 0.3s ease 0.1s;
    border: 1px solid #4CAF50; /* Green border */
}

.product-card:hover .quick-view-btn {
    transform: translateY(0);
    opacity: 1;
}

.sold-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background-color: rgba(76, 175, 80, 0.9); /* Green badge */
    color: white;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    font-weight: 600;
    backdrop-filter: blur(4px);
}

.product-details {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.75rem;
}

.product-details h3 {
    margin: 0;
    color: #2a3f2a; /* Dark green */
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Star Rating */
.product-rating {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.star-rating {
    position: relative;
    display: inline-block;
    width: 80px;
    height: 16px;
}

.stars-background, .stars-foreground {
    display: flex;
    gap: 2px;
    position: absolute;
    top: 0;
    left: 0;
}

.stars-background {
    color: #e2e8f0;
}

.stars-foreground {
    color: #4CAF50; /* Green stars */
    overflow: hidden;
    white-space: nowrap;
}

.rating-count {
    font-size: 0.75rem;
    color: #64748b;
}

.product-description {
    color: #5a675a; /* Medium green-gray */
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.category-tag {
    background-color: #f1f9f1; /* Light green */
    color: #4CAF50; /* Green text */
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
}

.product-stock {
    font-size: 0.75rem;
    color: #4CAF50; /* Green text */
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.product-stock.low-stock {
    color: #ff9800; /* Orange for low stock */
}

.product-price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    border-top: 1px solid #f1f9f1; /* Light green separator */
    padding-top: 1rem;
}

.product-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e5b1e; /* Dark green */
    margin: 0;
}

.add-to-cart-btn {
    background-color: #4CAF50; /* Green button */
    color: white;
    border: none;
    height: 2.5rem;
    width: 2.5rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3); /* Green shadow */
}

.add-to-cart-btn:hover:not(:disabled) {
    background-color: #388e3c; /* Darker green on hover */
    transform: scale(1.1);
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

.add-to-cart-btn:disabled {
    background-color: #c8e6c9; /* Very light green when disabled */
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Loading Animation */
.loading-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 200px;
    color: #4CAF50; /* Green text */
    font-size: 1rem;
    padding: 3rem;
}

.loader {
    display: flex;
    gap: 0.75rem;
}

.loader-circle {
    width: 0.75rem;
    height: 0.75rem;
    background-color: #4CAF50; /* Green loader */
    border-radius: 50%;
    animation: bounce 0.6s infinite alternate;
}

.loader-circle:nth-child(2) {
    animation-delay: 0.2s;
}

.loader-circle:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-10px); }
}

/* No Products Message */
.no-products-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background-color: white;
    padding: 4rem 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    color: #5a675a; /* Medium green-gray */
    text-align: center;
    border-left: 4px solid #4CAF50; /* Green accent border */
}

.no-products-message i {
    font-size: 3rem;
    color: #4CAF50; /* Green icon */
}

.no-products-message h3 {
    margin: 0;
    color: #1e5b1e; /* Dark green */
    font-size: 1.5rem;
}

.no-products-message p {
    margin: 0.5rem 0 0;
    color: #5a675a; /* Medium green-gray */
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.badge-slide-enter-active {
    transition: all 0.3s ease;
}

.badge-slide-enter-from {
    transform: translateX(20px);
    opacity: 0;
}
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
    transition: opacity 0.2s ease;
}

.notification-close:hover {
    opacity: 0.8;
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
/* Responsive Design */
@media (max-width: 1024px) {
    .product-content {
        padding: 1.5rem 1rem;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
    }
}

@media (max-width: 768px) {
    .product-content {
        padding: 1rem;
    }
    
    .filters-container {
        flex-direction: column;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
    
    .product-image-container {
        height: 180px;
    }
    
    .product-details {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .page-header h1 {
        font-size: 1.5rem;
    }
    
    .category-btn {
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.75rem;
    }
    
    .product-image-container {
        height: 140px;
    }
    
    .product-details {
        padding: 0.75rem;
        gap: 0.5rem;
    }
    
    .product-details h3 {
        font-size: 0.95rem;
    }
    
    .product-price {
        font-size: 1.1rem;
    }
    
    .add-to-cart-btn {
        width: 2.25rem;
        height: 2.25rem;
    }
}
</style>