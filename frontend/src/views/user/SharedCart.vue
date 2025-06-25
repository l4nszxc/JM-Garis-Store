<template>
    <div class="shared-cart-container">
        <Navbar :username="username" @logout="showLogoutModal = true"/>
        
        <div class="shared-cart-content">
            <div class="shared-cart-header">
                <h1><i class="fas fa-share-alt"></i> Shared Cart</h1>
                <p v-if="ownerName" class="owner-info">
                    Shared by: {{ ownerName }}
                </p>
            </div>

            <div v-if="loading" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading shared cart...
            </div>

            <div v-else-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i> {{ error }}
            </div>

            <div v-else-if="cartItems.length > 0" class="cart-items">
                <div v-for="item in cartItems" :key="item.id" class="cart-item">
                    <img 
                        :src="item.image || '/img/placeholder.jpg'"
                        :alt="item.name"
                        class="cart-item-image"
                        @error="handleImageError"
                    >
                    <div class="cart-item-details">
                        <h3>{{ item.name }}</h3>
                        <p v-if="item.choice_name" class="choice-info">
                            <i class="fas fa-tag"></i> Option: {{ item.choice_name }}
                        </p>                        <p class="price">Price: ₱{{ (parseFloat(item.price) || 0).toFixed(2) }}</p>
                        <p class="quantity">Quantity: {{ item.quantity }}</p>
                    </div>
                </div>

                <div class="action-buttons">
                    <button @click="acceptCart" class="accept-btn" :disabled="loading">
                        <i class="fas fa-check"></i> Accept Cart
                    </button>
                    <button @click="$router.push('/cart')" class="cancel-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>

            <div v-else class="empty-cart">
                <i class="fas fa-shopping-cart empty-cart-icon"></i>
                <p>This shared cart is empty</p>
                <button class="return-btn" @click="$router.push('/cart')">
                    <i class="fas fa-arrow-left"></i> Return to My Cart
                </button>
            </div>
        </div>

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

export default {
    name: 'SharedCart',
    components: {
        Navbar,
        LogoutModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            cartItems: [],
            ownerName: '',
            loading: true,
            error: null
        };
    },
    methods: {
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
        async fetchSharedCart() {
            try {
                this.loading = true;
                this.error = null;
                const token = localStorage.getItem('token');
                const shareId = this.$route.params.shareId;
                
                if (!shareId) {
                    throw new Error('Invalid share link');
                }
                
                const response = await fetch(`http://localhost:7904/api/shared-cart/${shareId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load shared cart');
                }

                const data = await response.json();
                this.cartItems = data.items;
                this.ownerName = data.share.owner_name;
                
            } catch (error) {
                this.error = error.message;
                console.error('Error fetching shared cart:', error);
            } finally {
                this.loading = false;
            }
        },
        async acceptCart() {
            try {
                this.loading = true;
                const token = localStorage.getItem('token');
                const shareId = this.$route.params.shareId;
                
                const response = await fetch(`http://localhost:7904/api/shared-cart/${shareId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to accept shared cart');
                }

                // Navigate to the cart to see the synced items
                this.$router.push('/cart');
                
            } catch (error) {
                this.error = error.message;
                console.error('Error accepting shared cart:', error);
            } finally {
                this.loading = false;
            }
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
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                }
            } catch (error) {
                console.error('Error during logout:', error);
            } finally {
                this.showLogoutModal = false;
            }
        }
    },
    async mounted() {
        if (!localStorage.getItem('token')) {
            return; // Don't try to fetch data if not authenticated
        }
        await this.getUserData();
        await this.fetchSharedCart();
    },
    watch: {
        '$route': {
            immediate: true,
            handler() {
                if (localStorage.getItem('token')) {
                    this.fetchSharedCart();
                }
            }
        }
    }
};
</script>

<style scoped>
.shared-cart-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.shared-cart-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.shared-cart-header {
    margin-bottom: 2rem;
    color: #2c3e50;
}

.owner-info {
    color: #666;
    font-size: 1.1rem;
    margin-top: 0.5rem;
}

.cart-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.cart-item {
    display: flex;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.cart-item-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 1.5rem;
}

.cart-item-details h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
}

.choice-info {
    color: #3498db;
    margin: 0.5rem 0;
}

.price, .quantity {
    color: #2c3e50;
    margin: 0.5rem 0;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.accept-btn, .cancel-btn {
    padding: 1rem 2rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.accept-btn {
    background-color: #4CAF50;
    color: white;
}

.accept-btn:hover:not(:disabled) {
    background-color: #45a049;
    transform: translateY(-2px);
}

.cancel-btn {
    background-color: #e0e0e0;
    color: #333;
}

.cancel-btn:hover {
    background-color: #d5d5d5;
}

.loading, .error-message {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-message {
    color: #dc3545;
}

.empty-cart {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-cart-icon {
    font-size: 4rem;
    color: #cbd5e0;
    margin-bottom: 1rem;
}

.return-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem auto;
}

.return-btn:hover {
    background-color: #2980b9;
}
</style>