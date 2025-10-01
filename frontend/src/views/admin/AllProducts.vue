<template>
    <div class="admin-container">
        <AdminNavbar :username="username" @logout="showLogoutModal = true" />
        
        <div class="admin-content">
            <div class="header">
                <h2>MANAGE PRODUCTS</h2>
                <div class="filters">
                    <div class="search-container">
                        <div class="search-box">
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Search by product name..."
                        >
                        </div>
                        <div class="sort-controls">
                        <select v-model="sortBy" class="sort-select">
                            <option value="name">Name</option>
                            <option value="updated_at">Date Updated</option>
                            <option value="price">Price</option>
                            <option value="stock">Stock</option>
                            <option value="total_sold">Total Sold</option>
                        </select>
                        <button 
                            class="sort-direction-btn" 
                            @click="toggleSortDirection"
                            :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
                        >
                            <i :class="['fas', sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                        </button>
                        </div>
                        <button @click="resetSearch" class="reset-btn">
                        <i class="fas fa-undo"></i> Reset Search
                        </button>
                    </div>
                </div>
                
            </div>
            <div class="table-wrapper">
                <!-- Add this above your category-selector in AllProducts.vue -->
                <div class="category-toggle-btn" v-if="isMobile" @click="showCategories = !showCategories">
                  <span>{{ showCategories ? 'Hide Categories' : 'Show Categories' }}</span>
                  <i :class="showCategories ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                </div>
                <div 
                  class="category-selector" 
                  :class="{ 'collapsed': isMobile && !showCategories }"
                  v-show="!isMobile || showCategories"
                >
                    <button 
                        v-for="category in categories" 
                        :key="category.value"
                        :class="['category-btn', { active: selectedCategory === category.value }]"
                        @click="selectedCategory = category.value"
                    >
                        {{ category.label }}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table v-if="filteredProducts.length">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Options</th>
                            <th>Stock</th>
                            <th>Total Sold</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="product in filteredProducts" :key="product.products_id">
                            <!-- Main product row -->
                            <tr :class="{'product-row': true}">
                                <td>
                                    <img 
                                        :src="product.image || '/img/placeholder.jpg'"
                                        :alt="product.name"
                                        class="product-image"
                                        @error="handleImageError"
                                    >
                                </td>
                                <td>{{ product.name }}</td>
                                <td>{{ product.category }}</td>
                                <td>
                                    <template v-if="product.choices && product.choices.length > 0 && getPriceRange(product).min !== getPriceRange(product).max">
                                        {{ formatPrice(getPriceRange(product).min) }} - {{ formatPrice(getPriceRange(product).max) }}
                                    </template>
                                    <template v-else-if="product.choices && product.choices.length > 0">
                                        {{ formatPrice(getPriceRange(product).min) }}
                                    </template>
                                    <template v-else>
                                        {{ formatPrice(product.price) }}
                                    </template>
                                </td>
                                <td>
                                    <div class="options-count">
                                        <span v-if="product.choices && product.choices.length">
                                            {{ product.choices.length }} options
                                            <button @click="toggleChoices(product)" class="toggle-choices-btn">
                                                <i :class="['fas', expandedProducts.has(product.products_id) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                            </button>
                                        </span>
                                        <span v-else>No options</span>
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        :class="getStockStatusClass(product.choices && product.choices.length > 0 ? 
                                            product.choices.reduce((total, choice) => total + (parseInt(choice.stock) || 0), 0) : 
                                            product.stock_quantity)" 
                                        class="stock-badge"
                                    >
                                        {{ product.choices && product.choices.length > 0 ? 
                                            product.choices.reduce((total, choice) => total + (parseInt(choice.stock) || 0), 0) : 
                                            product.stock_quantity }}
                                    </span>
                                </td>
                                <td>
                                    <span class="sales-badge" :class="getSalesStatusClass(product.total_sold)">
                                        {{ product.total_sold || 0 }}
                                    </span>
                                </td>
                                <td>
                                    <button @click="showEditModal(product)" class="edit-btn">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button @click="showDeleteConfirmation(product)" class="delete-btn">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Product choices row (conditionally rendered) -->
                            <tr v-if="expandedProducts.has(product.products_id) && product.choices && product.choices.length > 0"
                                :key="`choices-${product.products_id}`" 
                                class="choices-row">
                                <td colspan="8">
                                    <div class="choices-container">
                                        <h4>Product Options for {{ product.name }}</h4>
                                        <table class="choices-table">
                                            <thead>
                                                <tr>
                                                    <th>Image</th>
                                                    <th>Option Name</th>
                                                    <th>Price</th>
                                                    <th>Stock</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="choice in product.choices" :key="choice.choice_id">
                                                    <td>
                                                        <img 
                                                            :src="choice.image || product.image || '/img/placeholder.jpg'"
                                                            :alt="choice.name"
                                                            class="choice-image"
                                                            @error="handleImageError"
                                                        >
                                                    </td>
                                                    <td>{{ choice.name }}</td>
                                                    <td>{{ formatPrice(choice.price) }}</td>
                                                    <td>
                                                        <span 
                                                            :class="getStockStatusClass(choice.stock)" 
                                                            class="stock-badge">
                                                            {{ choice.stock }}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button @click="showEditChoiceModal(choice, product)" class="edit-choice-btn">
                                                            <i class="fas fa-edit"></i> Edit
                                                        </button>
                                                        <button @click="showDeleteChoiceConfirmation(choice, product)" class="delete-choice-btn">
                                                            <i class="fas fa-trash"></i> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
                <div v-else class="no-results">
                    <i class="fas fa-box-open"></i>
                    No products found
                </div>
            </div>
        </div>

        <!-- Edit Product Modal -->
        <div v-if="showModal" class="modal-overlay">
            <div class="modal-content">
                <h2>Edit Product</h2>
                <form @submit.prevent="handleEditSubmit" class="edit-form">
                    <div class="form-group">
                        <label for="name">Product Name</label>
                        <input type="text" id="name" v-model="editingProduct.name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" v-model="editingProduct.description" required></textarea>
                    </div>
                      <div class="form-group">
                        <label for="price">Price</label>
                        <input 
                            type="number" 
                            id="price" 
                            v-model="editingProduct.price" 
                            step="0.01" 
                            required
                            :disabled="editingChoices.length > 0"
                            :title="editingChoices.length > 0 ? 'Base price is disabled when using product options' : ''"
                        >
                        <small v-if="editingChoices.length > 0" class="help-text">
                            <i class="fas fa-info-circle"></i> Base price is disabled when using product options
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="stock">Stock Quantity</label>
                        <input 
                            type="number" 
                            id="stock" 
                            v-model="editingProduct.stock_quantity" 
                            required
                            :disabled="editingChoices.length > 0"
                            :title="editingChoices.length > 0 ? 'Stock quantity is managed through product options' : ''"
                        />
                        <small v-if="editingChoices.length > 0" class="help-text">
                            <i class="fas fa-info-circle"></i> Stock is managed through product options
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select id="category" v-model="editingProduct.category" required>
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
                    <div class="product-choices-section">
                        <div class="choices-header">
                            <h3>Product Options (Optional)</h3>
                            <button type="button" class="add-choice-btn" @click="addChoice">
                                <i class="fas fa-plus"></i> Add Option
                            </button>
                        </div>
                        
                        <div v-for="(choice, index) in editingChoices" :key="index" class="product-choice">
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
                                        placeholder="e.g., 750ml, 1.65L, Medium, Large, etc." 
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-price-' + index">Price</label>
                                    <input 
                                        type="number" 
                                        :id="'choice-price-' + index" 
                                        v-model="choice.price" 
                                        step="0.01" 
                                        min="0"     
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-stock-' + index">Stock Quantity</label>
                                    <input 
                                        type="number" 
                                        :id="'choice-stock-' + index" 
                                        v-model="choice.stock" 
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label :for="'choice-image-' + index">Image (Optional)</label>
                                    <input 
                                        type="file" 
                                        :id="'choice-image-' + index" 
                                        @change="(e) => handleNewChoiceImageUpload(e, index)" 
                                        accept="image/*" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="newImage">New Image (optional)</label>
                        <input type="file" id="newImage" @change="handleImageUpload" accept="image/*">
                    </div>

                    <div class="modal-buttons">
                        <button type="submit" class="save-btn">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button type="button" @click="closeModal" class="cancel-btn">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Choice Modal -->
        <div v-if="showChoiceModal" class="modal-overlay">
            <div class="modal-content">
                <h2>Edit Product Option</h2>
                <h3>{{ editingChoiceProductName }}</h3>
                <form @submit.prevent="handleEditChoiceSubmit" class="edit-form">
                    <div class="form-group">
                        <label for="choiceName">Option Name</label>
                        <input type="text" id="choiceName" v-model="editingChoice.name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="choicePrice">Price</label>
                        <input type="number" id="choicePrice" v-model="editingChoice.price" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="choiceStock">Stock Quantity</label>
                        <input type="number" id="choiceStock" v-model="editingChoice.stock" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="choiceImage">New Image (optional)</label>
                        <input type="file" id="choiceImage" @change="handleChoiceImageUpload" accept="image/*">
                    </div>

                    <div class="modal-buttons">
                        <button type="submit" class="save-btn">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button type="button" @click="closeChoiceModal" class="cancel-btn">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <LogoutModal 
            :show="showLogoutModal"
            @confirm="handleLogout"
            @cancel="showLogoutModal = false"
        />

        <div v-if="showDeleteModal" class="modal-overlay">
            <div class="modal-content delete-modal">
                <h2>Delete Product</h2>
                <p>Are you sure you want to delete "{{ productToDelete?.name }}"?</p>
                <div class="modal-buttons">
                    <button @click="confirmDelete" class="confirm-delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button @click="closeDeleteModal" class="cancel-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
        <div v-if="showDeleteChoiceModal" class="modal-overlay">
            <div class="modal-content delete-modal">
                <h2>Delete Product Option</h2>
                <p>Are you sure you want to delete "{{ choiceToDelete?.name }}" from "{{ choiceProductName }}"?</p>
                <div class="modal-buttons">
                    <button @click="confirmDeleteChoice" class="confirm-delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button @click="closeDeleteChoiceModal" class="cancel-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AdminNavbar from '../../components/AdminNavbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import '../../views/admin/AdminCSS.css';

export default {
    name: 'AllProducts',
    components: {
        AdminNavbar,
        LogoutModal
    },
    data() {
        return {
            username: '',
            products: [],
            showLogoutModal: false,
            showModal: false,
            showChoiceModal: false,
            showCategories: false,
            isMobile: false
        };
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
            return;
        }

        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username || 'Admin';
            this.fetchProducts(); // Fetch products after confirming authentication
        } catch (error) {
            console.error('Token validation error:', error);
            this.$router.push('/login');
        }

        this.isMobile = window.innerWidth <= 600;
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 600;
            if (!this.isMobile) this.showCategories = false;
        });
    },
    data() {
        return {
            username: '',
            products: [],
            showLogoutModal: false,
            showModal: false,
            showChoiceModal: false,
            showCategories: false, //sachi
            isMobile: false,//sachi
            editingProduct: null,
            editingChoice: null,
            editingChoiceProductName: '',
            newImage: null,
            newChoiceImage: null,
            searchQuery: '', 
            selectedCategory: '',
            showDeleteModal: false,
            productToDelete: null,
            expandedProducts: new Set(),
            showDeleteChoiceModal: false,
            choiceToDelete: null,
            choiceProductName: '',
            editingChoices: [],
            newChoiceImages: [],
            categories: [
                { label: 'All', value: '' },
                { label: 'Beverages', value: 'Beverages' },
                { label: 'Milk & Chocolate', value: 'Milk and Chocolate Drink' },
                { label: 'Coffee & Creamer', value: 'Coffee and Creamer' },
                { label: 'Condiments', value: 'Condiments' },
                { label: 'Canned Goods', value: 'Canned Goods' },
                { label: 'Biscuits', value: 'Biscuits' },
                { label: 'Candies & Snacks', value: 'Candies and Snacks' },
                { label: 'Bar and Soap', value: 'Bar and Soap' }
            ],
            sortBy: 'updated_at',
            sortDirection: 'desc',
        };
    },
    computed: {
        filteredProducts() {
            let filtered = this.products.filter(product => {
                const matchesSearch = !this.searchQuery || 
                    product.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesCategory = !this.selectedCategory || 
                    product.category === this.selectedCategory;
                
                if (product.choices && product.choices.length > 0) {
                    product.stock_quantity = product.choices.reduce((total, choice) => {
                        return total + (parseInt(choice.stock) || 0);
                    }, 0);
                }
                
                return matchesSearch && matchesCategory;
            });

            // Sort the filtered products
            filtered.sort((a, b) => {
                let aValue = a[this.sortBy];
                let bValue = b[this.sortBy];

                // Handle special cases
                switch(this.sortBy) {
                    case 'stock':
                        aValue = a.choices?.length > 0 
                            ? a.choices.reduce((sum, choice) => sum + (parseInt(choice.stock) || 0), 0)
                            : (parseInt(a.stock_quantity) || 0);
                        bValue = b.choices?.length > 0 
                            ? b.choices.reduce((sum, choice) => sum + (parseInt(choice.stock) || 0), 0)
                            : (parseInt(b.stock_quantity) || 0);
                        break;
                    case 'updated_at':
                        aValue = new Date(a.updated_at).getTime();
                        bValue = new Date(b.updated_at).getTime();
                        break;
                    case 'total_sold':
                        aValue = parseInt(a.total_sold) || 0;
                        bValue = parseInt(b.total_sold) || 0;
                        break;
                    case 'price':
                        aValue = parseFloat(a.price) || 0;
                        bValue = parseFloat(b.price) || 0;
                        break;
                }

                if (this.sortDirection === 'asc') {
                    return aValue > bValue ? 1 : -1;
                } else {
                    return aValue < bValue ? 1 : -1;
                }
            });

            return filtered;
        }
    },
    methods: {
        getPriceRange(product) {
            if (!product.choices || !product.choices.length) {
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
            
            if (min === Infinity) min = parseFloat(product.price) || 0;
            if (max === 0) max = parseFloat(product.price) || 0;
            
            return { min, max };
        },
        toggleSortDirection() {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        },        addChoice() {
            this.editingChoices.push({
                name: '',
                price: null,
                stock: null
            });
            this.newChoiceImages.push(null);
            
            // Set base price to 0 when adding the first choice
            if (this.editingChoices.length === 1) {
                this.editingProduct.price = 0;
            }
        },
          removeChoice(index) {
            this.editingChoices.splice(index, 1);
            this.newChoiceImages.splice(index, 1);
            
            // Re-enable base price if all choices are removed
            if (this.editingChoices.length === 0) {
                // Only reset if it was previously 0
                if (parseFloat(this.editingProduct.price) === 0) {
                    this.editingProduct.price = '';  // Reset to empty so user can enter a valid price
                }
            }
        },
        
        handleNewChoiceImageUpload(event, index) {
            if (event.target.files && event.target.files[0]) {
                this.newChoiceImages[index] = event.target.files[0];
            }
        },
        showDeleteChoiceConfirmation(choice, product) {
            this.choiceToDelete = choice;
            this.choiceProductName = product.name;
            this.showDeleteChoiceModal = true;
        },
        
        closeDeleteChoiceModal() {
            this.showDeleteChoiceModal = false;
            this.choiceToDelete = null;
            this.choiceProductName = '';
        },
        
        async confirmDeleteChoice() {
            try {
                const token = localStorage.getItem('token');
                if (!token || !this.choiceToDelete || !this.choiceToDelete.choice_id) {
                    console.error('Missing required data for deletion');
                    return;
                }
                
                const response = await this.$fetch(`/api/products/choices/${this.choiceToDelete.choice_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to delete product option');
                }
                
                // Refresh products to get updated data
                await this.fetchProducts();
                this.closeDeleteChoiceModal();
            } catch (error) {
                console.error('Error deleting product choice:', error);
                // You could add error notification here
            }
        },
        toggleChoices(product) {
            if (!product || typeof product.products_id === 'undefined') {
                console.error('Invalid product or missing product ID', product);
                return;
            }
            
            if (this.expandedProducts.has(product.products_id)) {
                this.expandedProducts.delete(product.products_id);
            } else {
                this.expandedProducts.add(product.products_id);
            }
        },
        
        getSalesStatusClass(totalSold) {
            totalSold = parseInt(totalSold) || 0;
            if (totalSold >= 50) return 'high-sales';
            if (totalSold >= 20) return 'good-sales';
            if (totalSold > 0) return 'some-sales';
            return 'no-sales';
        },
        
        getStockStatusClass(stock) {
            const totalStock = parseInt(stock) || 0;
            if (totalStock <= 10) return 'critical-stock';
            if (totalStock <= 20) return 'low-stock';
            return 'normal-stock';
        },
        tatusClass(stock) {
            if (stock <= 10) return 'critical-stock';
            if (stock <= 20) return 'low-stock';
            return 'normal-stock';
        },
        
        showDeleteConfirmation(product) {
            this.productToDelete = product;
            this.showDeleteModal = true;
        },

        closeDeleteModal() {
            this.showDeleteModal = false;
            this.productToDelete = null;
        },

        async confirmDelete() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch(`/api/products/${this.productToDelete.products_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete product');
                }

                // Remove product from local array
                this.products = this.products.filter(p => p.products_id !== this.productToDelete.products_id);
                
                // Close modal and clear selection
                this.closeDeleteModal();

            } catch (error) {
                console.error('Error deleting product:', error);
                // You could add error notification here
            }
        },
        
        resetSearch() {
            this.searchQuery = '';
        },
        
        async fetchProducts() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }
                
                const response = await this.$fetch('/api/products', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.products = data.map(product => ({
                        ...product,
                        total_sold: parseInt(product.total_sold) || 0,
                        choices: Array.isArray(product.choices) ? product.choices : []
                    }));
                    // Debug log to verify data
                    console.log("Fetched products:", this.products);
                } else {
                    console.error('Failed to fetch products:', response.status);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
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
          showEditModal(product) {
            this.editingProduct = { ...product };
            // Load existing choices
            this.editingChoices = product.choices ? [...product.choices] : [];
            
            // If there are choices, set base price to 0
            if (this.editingChoices.length > 0) {
                this.editingProduct.price = 0;
            }
            
            this.newChoiceImages = new Array(this.editingChoices.length).fill(null);
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.editingProduct = null;
            this.newImage = null;
            this.editingChoices = [];
            this.newChoiceImages = [];
        },
        
        showEditChoiceModal(choice, product) {
            if (!choice || !product) {
                console.error('Invalid choice or product', { choice, product });
                return;
            }
            
            this.editingChoice = { ...choice };
            this.editingChoiceProductName = product.name || 'Unknown Product';
            this.showChoiceModal = true;
        },
        
        closeChoiceModal() {
            this.showChoiceModal = false;
            this.editingChoice = null;
            this.editingChoiceProductName = '';
            this.newChoiceImage = null;
        },
        
        handleImageUpload(event) {
            if (event.target.files && event.target.files[0]) {
                this.newImage = event.target.files[0];
                console.log('Main product image selected:', this.newImage.name);
            }
        },

        handleChoiceImageUpload(event) {
            if (event.target.files && event.target.files[0]) {
                this.newChoiceImage = event.target.files[0];
                console.log('Choice image selected:', this.newChoiceImage.name);
            }
        },
        
        async handleEditSubmit() {
            try {
                const token = localStorage.getItem('token');
                const formData = new FormData();
                
                // Store current category for later
                const currentCategory = this.selectedCategory;
                  // Add existing form data
                formData.append('name', this.editingProduct.name);
                formData.append('description', this.editingProduct.description);
                // Set price to 0 when there are choices
                formData.append('price', this.editingChoices.length > 0 ? 0 : parseFloat(this.editingProduct.price));
                formData.append('stock_quantity', parseInt(this.editingProduct.stock_quantity));
                formData.append('category', this.editingProduct.category);

                // Handle main product image
                if (this.newImage) {
                    formData.append('image', this.newImage);
                }

                // Handle product choices
                if (this.editingChoices.length > 0) {
                    const formattedChoices = this.editingChoices.map(choice => ({
                        choice_id: choice.choice_id,
                        name: choice.name,
                        price: parseFloat(choice.price),
                        stock: parseInt(choice.stock),
                        image: choice.image
                    }));

                    formData.append('hasChoices', 'true');
                    formData.append('choices', JSON.stringify(formattedChoices));
                    
                    this.newChoiceImages.forEach((img, idx) => {
                        if (img) {
                            formData.append(`choiceImage`, img);
                            formData.append('choiceImageIndex', idx.toString());
                        }
                    });
                }

                const response = await fetch(`${this.API_BASE_URL}/api/products/${this.editingProduct.products_id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                let data;
                let responseText = await response.text();
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    data = { message: responseText };
                }

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update product');
                }

                this.closeModal();
                await this.fetchProducts();
                // Restore the selected category
                this.selectedCategory = currentCategory;

            } catch (error) {
                console.error('Error updating product:', error);
                alert('Error updating product: ' + error.message);
            }
        },
        
        async handleEditChoiceSubmit() {
            try {
                if (!this.editingChoice?.choice_id) {
                    throw new Error('Invalid choice data');
                }

                const token = localStorage.getItem('token');
                const formData = new FormData();
                
                formData.append('name', this.editingChoice.name);
                formData.append('price', parseFloat(this.editingChoice.price));
                formData.append('stock', parseInt(this.editingChoice.stock));

                if (this.newChoiceImage) {
                    formData.append('image', this.newChoiceImage);
                    console.log('Adding choice image to form:', this.newChoiceImage.name);
                }

                const response = await fetch(`${this.API_BASE_URL}/api/products/choices/${this.editingChoice.choice_id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                let data;
                let responseText = await response.text();
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    data = { message: responseText };
                }

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update product option');
                }

                this.closeChoiceModal();
                await this.fetchProducts();
                
                // Fetch fresh data
                await this.fetchProducts();
                
                // Force refresh the page
                window.location.reload();

            } catch (error) {
                console.error('Error updating product choice:', error);
                alert('Error updating product choice: ' + error.message);
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
                console.error('Logout failed:', error);
            } finally {
                this.showLogoutModal = false;
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.$router.push('/login');
            return;
        }

        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.username = decoded.username || 'Admin';
            this.fetchProducts(); // Fetch products after confirming authentication
        } catch (error) {
            console.error('Token validation error:', error);
            this.$router.push('/login');
        }

        this.isMobile = window.innerWidth <= 600;
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 600;
            if (!this.isMobile) this.showCategories = false;
        });
    }
};
</script>
