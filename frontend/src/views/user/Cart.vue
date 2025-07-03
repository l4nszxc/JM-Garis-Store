<template>
    <div class="cart-container">
        <Navbar :username="username" @logout="showLogoutModal = true"/>
        
        <div class="cart-content">
            <!-- Cart Header -->
            <div class="cart-header">
                <h1>
                    <i class="fas fa-shopping-cart"></i>
                    Shopping Cart
                </h1>
                
                <!-- Notifications -->
                <div v-if="notification.show" class="notification" :class="notification.type">
                    <div class="notification-content">
                        <i :class="notification.icon"></i>
                        {{ notification.message }}
                    </div>
                    <button class="notification-close" @click="hideNotification">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Cart Sharing Info -->
                <div v-if="syncStatus" class="cart-sharing-info">
                    <div v-if="syncStatus.role === 'owner'" class="sharing-badge owner-badge">
                        <i class="fas fa-share-alt"></i>
                        <span>Sharing with: <strong>{{ partnerUsername || 'another user' }}</strong></span>
                        <button @click="stopSharing" class="action-btn stop-btn">
                            <i class="fas fa-times"></i>
                            Stop Sharing
                        </button>
                    </div>
                    <div v-else class="sharing-badge receiver-badge">
                        <i class="fas fa-user-friends"></i>
                        <span>Using: <strong>{{ partnerUsername || 'another user' }}'s</strong> cart</span>
                        <button @click="leaveSharing" class="action-btn leave-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Leave Cart
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="cartItems.length > 0" class="cart-main">
                <!-- Select All Section -->
                <div class="select-all-section">
                    <label class="select-all-checkbox">
                        <input 
                            type="checkbox" 
                            :checked="allItemsSelected"
                            @change="toggleSelectAll"
                        >
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-label">Select All Items</span>
                    </label>
                </div>

                <!-- Cart Items -->
                <div class="cart-items-container">
                    <div v-for="item in cartItems" :key="item.id" class="cart-item">
                        <div class="item-checkbox">
                            <input 
                                type="checkbox" 
                                :checked="checkedItems.has(item.id)"
                                @change="toggleItemCheck(item.id)"
                                :id="`item-${item.id}`"
                            >
                            <label :for="`item-${item.id}`" class="checkbox-custom"></label>
                        </div>
                        
                        <div class="item-image-container">
                            <img 
                                :src="item.image || '/img/placeholder.jpg'"
                                :alt="item.name"
                                class="item-image"
                                @error="handleImageError"
                            >
                        </div>
                        
                        <div class="item-details">
                            <h4 class="item-name">{{ item.name }}</h4>
                            
                            <div v-if="item.choice_name" class="choice-info">
                                <i class="fas fa-tag"></i>
                                {{ item.choice_name }}
                            </div>
                            
                            <div class="item-price">
                                <i class="fas fa-peso-sign"></i>
                                {{ formatPrice(item.price) }}
                            </div>
                            
                            <div class="quantity-section">
                                <span class="quantity-label">Quantity:</span>
                                <div class="quantity-controls">
                                    <button 
                                        @click="updateQuantity(item.id, item.quantity - 1)"
                                        :disabled="item.quantity <= 1"
                                        class="quantity-btn"
                                    >
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <div class="quantity-display">
                                        {{ item.quantity }}
                                    </div>
                                    <button 
                                        @click="updateQuantity(item.id, item.quantity + 1)"
                                        class="quantity-btn"
                                    >
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="item-subtotal">
                                Subtotal: {{ formatPrice(item.price * item.quantity) }}
                            </div>
                            
                            <button class="remove-btn" @click="removeFromCart(item.id)">
                                <i class="fas fa-trash"></i>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Cart Summary -->
                <div class="cart-summary">
                    <div class="summary-header">
                        <h3>
                            <i class="fas fa-receipt"></i>
                            Cart Summary
                        </h3>
                    </div>
                    
                    <div class="summary-content">
                        <div class="summary-row">
                            <span>Selected Items:</span>
                            <span>{{ checkedItemsCount }}</span>
                        </div>
                        <div class="summary-divider"></div>
                        <div class="summary-row total-row">
                            <span>Total Amount:</span>
                            <span class="total-price">{{ formatPrice(cartTotal) }}</span>
                        </div>
                    </div>
                    
                    <div class="cart-actions">
                        <button 
                            class="share-btn" 
                            @click="showShareModal = true"
                            :disabled="cartItems.length === 0"
                        >
                            <i class="fas fa-share-alt"></i>
                            Share Cart
                        </button>
                        <button 
                            class="checkout-btn" 
                            @click="showOrdersModal = true" 
                            :disabled="checkedItemsCount === 0"
                        >
                            <i class="fas fa-check"></i>
                            Place Order
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty Cart State -->
            <div v-else class="empty-cart">
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started</p>
                    <button class="continue-shopping" @click="$router.push('/products')">
                        <i class="fas fa-store"></i>
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ShareCartModal 
            :show="showShareModal"
            @close="showShareModal = false"
        />

        <LogoutModal 
            :show="showLogoutModal" 
            @confirm="handleLogout" 
            @cancel="showLogoutModal = false" 
        />

        <ViewOrdersModal 
            :show="showOrdersModal"
            :selectedItems="selectedItems"
            :availableDiscounts="availableDiscounts"
            @close="showOrdersModal = false"
            @place-order="handlePlaceOrder"
        />

        <ConfirmationModal
            :show="showStopSharingModal"
            title="Stop Sharing Cart"
            message="Are you sure you want to stop sharing your cart? This will end the sharing for both you and the other user."
            icon="fas fa-times-circle"
            confirmText="Stop Sharing"
            confirmIcon="fas fa-ban"
            confirmButtonClass="danger"
            @confirm="confirmStopSharing"
            @cancel="showStopSharingModal = false"
        />
        
        <ConfirmationModal
            :show="showLeaveSharingModal"
            title="Leave Shared Cart"
            message="Are you sure you want to leave this shared cart? This will end the sharing for both you and the cart owner."
            icon="fas fa-sign-out-alt"
            confirmText="Leave Cart"
            confirmIcon="fas fa-sign-out-alt"
            confirmButtonClass="secondary"
            @confirm="confirmLeaveSharing"
            @cancel="showLeaveSharingModal = false"
        />

        <!-- Sync Status Badge -->
        <div v-if="syncStatus" class="sync-status">
            <div class="sync-badge" :class="{'sync-owner': syncStatus.role === 'owner', 'sync-receiver': syncStatus.role === 'receiver'}">
                <i class="fas fa-sync-alt"></i>
                {{ syncStatus.role === 'owner' ? 'Cart Shared' : 'Shared Cart' }}
            </div>
        </div>
    </div>
</template>

<script>
import Navbar from '../../components/Navbar.vue';
import LogoutModal from '../../components/LogoutModal.vue';
import ViewOrdersModal from '../../components/ViewOrdersModal.vue';
import ShareCartModal from '../../components/ShareCartModal.vue'
import ConfirmationModal from '../../components/ConfirmationModal.vue';

export default {
    name: 'Cart',
    components: {
        Navbar,
        LogoutModal,
        ViewOrdersModal,
        ShareCartModal,
        ConfirmationModal
    },
    data() {
        return {
            username: '',
            showLogoutModal: false,
            showOrdersModal: false,
            cartItems: [],
            checkedItems: new Set(),
            loading: false,
            error: null,
            availableDiscounts: [],
            showShareModal: false,
            syncStatus: null,
            syncInterval: null,
            partnerUsername: '',
            showStopSharingModal: false,
            showLeaveSharingModal: false,
            notification: {
                show: false,
                message: '',
                type: 'success',
                icon: 'fas fa-check-circle',
                timeout: null
            }
        };
    },
    computed: {
        checkedItemsCount() {
            return this.checkedItems.size;
        },
        allItemsSelected() {
            return this.cartItems.length > 0 && this.checkedItems.size === this.cartItems.length;
        },
        selectedItems() {
            return this.cartItems.filter(item => this.checkedItems.has(item.id));
        },
        cartTotal() {
            return this.cartItems.reduce((sum, item) => {
                if (this.checkedItems.has(item.id)) {
                    return sum + (parseFloat(item.price) * item.quantity);
                }
                return sum;
            }, 0);
        }
    },
    methods: {
        showNotification(message, type = 'success') {
            if (this.notification.timeout) {
                clearTimeout(this.notification.timeout);
            }
            
            let icon = 'fas fa-check-circle';
            if (type === 'error') {
                icon = 'fas fa-exclamation-circle';
            } else if (type === 'info') {
                icon = 'fas fa-info-circle';
            }
            
            this.notification = {
                show: true,
                message,
                type,
                icon,
                timeout: setTimeout(() => {
                    this.hideNotification();
                }, 5000)
            };
        },
        
        hideNotification() {
            this.notification.show = false;
            if (this.notification.timeout) {
                clearTimeout(this.notification.timeout);
            }
        },
        
        stopSharing() {
            this.showStopSharingModal = true;
        },
        
        leaveSharing() {
            this.showLeaveSharingModal = true;
        },
        
        async confirmStopSharing() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/shared-cart/stop-sharing', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    this.syncStatus = null;
                    this.partnerUsername = '';
                    this.showNotification('You have stopped sharing your cart. The sharing has ended for both users.');
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to stop sharing');
                }
            } catch (error) {
                console.error('Error stopping cart sharing:', error);
                this.showNotification('Failed to stop sharing cart: ' + error.message, 'error');
            } finally {
                this.showStopSharingModal = false;
            }
        },
        
        async confirmLeaveSharing() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:7904/api/shared-cart/leave-sharing', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    this.syncStatus = null;
                    this.partnerUsername = '';
                    this.showNotification('You have left the shared cart. The sharing has ended for both users.');
                    await this.fetchCart();
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to leave shared cart');
                }
            } catch (error) {
                console.error('Error leaving shared cart:', error);
                this.showNotification('Failed to leave shared cart: ' + error.message, 'error');
            } finally {
                this.showLeaveSharingModal = false;
            }
        },
        
        async fetchPartnerUsername() {
            if (!this.syncStatus || !this.syncStatus.partnerId) return;
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/users/getUsernameById/${this.syncStatus.partnerId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.partnerUsername = data.username || 'another user';
                } else {
                    this.partnerUsername = 'another user';
                }
            } catch (error) {
                console.error('Error fetching partner username:', error);
                this.partnerUsername = 'another user';
            }
        },
        
        async checkSyncStatus() {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await fetch('http://localhost:7904/api/shared-cart/active/status', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data && data.shareId) {
                        this.syncStatus = data;
                        await this.fetchPartnerUsername();
                    } else {
                        this.syncStatus = null;
                        this.partnerUsername = '';
                    }
                }
            } catch (error) {
                console.error('Error checking sync status:', error);
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
        
        async fetchAvailableDiscounts() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                const response = await fetch('http://localhost:7904/api/rewards/available-discounts', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch discounts');
                }

                const data = await response.json();
                this.availableDiscounts = data;
            } catch (error) {
                console.error('Error fetching discounts:', error);
                this.availableDiscounts = [];
            }
        },
        
        toggleSelectAll() {
            if (this.allItemsSelected) {
                this.checkedItems.clear();
            } else {
                this.cartItems.forEach(item => {
                    this.checkedItems.add(item.id);
                });
            }
        },
        
        toggleItemCheck(itemId) {
            if (this.checkedItems.has(itemId)) {
                this.checkedItems.delete(itemId);
            } else {
                this.checkedItems.add(itemId);
            }
        },
        
        async handlePlaceOrder({ items, discountId, plasticPackaging }) {
            try {
                console.log('Placing order with packaging preference:', plasticPackaging); // Debug log
                
                const token = localStorage.getItem('token');
                
                const formattedItems = items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    choice_id: item.choice_id
                }));
                
                const requestBody = {
                    items: formattedItems,
                    totalAmount: formattedItems.reduce((sum, item) => 
                        sum + (parseFloat(item.price) * item.quantity), 0
                    ),
                    discountId: discountId,
                    plasticPackaging: plasticPackaging // Ensure this is being sent
                };
                
                console.log('Request body:', requestBody); // Debug log

                const response = await fetch('http://localhost:7904/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to place order');
                }

                const result = await response.json();
                console.log('Order created with packaging:', result.packagingPreference); // Debug log

                this.cartItems = this.cartItems.filter(cartItem => 
                    !items.some(item => item.id === cartItem.id)
                );
                
                this.checkedItems.clear();
                await this.fetchAvailableDiscounts();

                if (this.syncStatus) {
                    this.showNotification('Your order has been placed. Cart sharing has been automatically ended.', 'info');
                    this.syncStatus = null;
                    this.partnerUsername = '';
                }

                this.showOrdersModal = false;
                this.$router.push('/view-orders');
                window.dispatchEvent(new CustomEvent('cart-updated'));

            } catch (error) {
                console.error('Error placing order:', error);
                this.showNotification('Failed to place order: ' + (error.message || 'Unknown error'), 'error');
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
        
        async fetchCart() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$router.push('/login');
                    return;
                }

                const response = await fetch('http://localhost:7904/api/cart', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch cart');
                }

                const data = await response.json();
                this.cartItems = data;
            } catch (error) {
                console.error('Error fetching cart:', error);
                this.cartItems = [];
            }
        },
        
        async removeFromCart(itemId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/cart/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
                    if (this.checkedItems.has(itemId)) {
                        this.checkedItems.delete(itemId);
                    }
                    window.dispatchEvent(new CustomEvent('cart-updated'));
                }
            } catch (error) {
                console.error('Error removing item from cart:', error);
            }
        },

        async updateQuantity(itemId, newQuantity) {
            if (newQuantity < 1) return;
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:7904/api/cart/${itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ quantity: newQuantity })
                });
                
                if (response.ok) {
                    await this.fetchCart();
                    window.dispatchEvent(new CustomEvent('cart-updated'));
                }
            } catch (error) {
                console.error('Error updating quantity:', error);
            }
        }
    },
    
    async mounted() {
        await this.getUserData();
        await this.fetchCart();
        await this.fetchAvailableDiscounts();
        await this.checkSyncStatus();
        
        this.syncInterval = setInterval(async () => {
            await this.checkSyncStatus();
            if (this.syncStatus) {
                await this.fetchCart();
            }
        }, 1000);
    },
    
    beforeDestroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
};
</script>

<style scoped>
/* Main Container */
.cart-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
    background-color: #f8fafb;
}

.cart-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* Header Section */
.cart-header {
    margin-bottom: 2rem;
    position: relative;
}

.cart-header h1 {
    color: #2a3f2a;
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

/* Cart Sharing Info */
.cart-sharing-info {
    margin-top: 1rem;
}

.sharing-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    border-left: 4px solid;
    font-size: 0.95rem;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.owner-badge {
    border-left-color: #4CAF50;
    background-color: #f8fff8;
}

.receiver-badge {
    border-left-color: #2196F3;
    background-color: #f5f9ff;
}

.action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.stop-btn {
    background-color: #fee2e2;
    color: #dc2626;
}

.stop-btn:hover {
    background-color: #dc2626;
    color: white;
}

.leave-btn {
    background-color: #e5e7eb;
    color: #6b7280;
}

.leave-btn:hover {
    background-color: #6b7280;
    color: white;
}

/* Main Cart Section */
.cart-main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Select All Section */
.select-all-section {
    background: white;
    padding: 1.5rem;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #4CAF50;
}

.select-all-checkbox {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    user-select: none;
}

.select-all-checkbox input[type="checkbox"] {
    display: none;
}

.checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    position: relative;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.select-all-checkbox input:checked + .checkbox-custom {
    background-color: #4CAF50;
    border-color: #4CAF50;
}

.select-all-checkbox input:checked + .checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
}

.checkbox-label {
    color: #2a3f2a;
    font-size: 1rem;
    font-weight: 500;
}

/* Cart Items Container */
.cart-items-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.cart-item {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #f1f9f1;
    transition: all 0.2s ease;
}

.cart-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(76, 175, 80, 0.1);
    border-left-color: #4CAF50;
}

.item-checkbox {
    display: flex;
    align-items: flex-start;
    padding-top: 0.5rem;
}

.item-checkbox input[type="checkbox"] {
    display: none;
}

.item-checkbox .checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    cursor: pointer;
}

.item-checkbox input:checked + .checkbox-custom {
    background-color: #4CAF50;
    border-color: #4CAF50;
}

.item-checkbox input:checked + .checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 10px;
    font-weight: bold;
}

.item-image-container {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background-color: #f8f9fa;
    border: 1px solid #e2e8f0;
}

.item-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.item-name {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.3;
}

.choice-info {
    background-color: #f1f9f1;
    color: #4CAF50;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 500;
    width: fit-content;
}

.item-price {
    color: #4CAF50;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.quantity-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.quantity-label {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.quantity-btn {
    width: 2rem;
    height: 2rem;
    border: 2px solid #4CAF50;
    background-color: white;
    color: #4CAF50;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.quantity-btn:hover:not(:disabled) {
    background-color: #4CAF50;
    color: white;
    transform: scale(1.05);
}

.quantity-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.quantity-display {
    min-width: 2rem;
    text-align: center;
    font-weight: 600;
    font-size: 1rem;
    color: #2a3f2a;
    background-color: #f8f9fa;
    padding: 0.5rem;
    border-radius: 6px;
    border: 2px solid #e2e8f0;
}

.item-subtotal {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
}

.remove-btn {
    background-color: #fee2e2;
    color: #dc2626;
    border: 2px solid #fecaca;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
    width: fit-content;
}

.remove-btn:hover {
    background-color: #dc2626;
    color: white;
    border-color: #dc2626;
    transform: translateY(-1px);
}

/* Cart Summary */
.cart-summary {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #4CAF50;
}

.summary-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #f1f9f1;
}

.summary-header h3 {
    margin: 0;
    color: #2a3f2a;
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.summary-content {
    padding: 1.5rem 2rem;
    background-color: #fafffe;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    color: #64748b;
    font-size: 0.95rem;
}

.summary-row:last-child {
    margin-bottom: 0;
}

.summary-divider {
    height: 1px;
    background-color: #e2e8f0;
    margin: 1rem 0;
}

.total-row {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2a3f2a;
}

.total-price {
    color: #4CAF50;
    font-size: 1.3rem;
    font-weight: 700;
}

.cart-actions {
    padding: 1.5rem 2rem;
    display: flex;
    gap: 1rem;
}

.share-btn, .checkout-btn {
    flex: 1;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.share-btn {
    background-color: white;
    color: #2196F3;
    border-color: #2196F3;
}

.share-btn:hover:not(:disabled) {
    background-color: #2196F3;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.checkout-btn {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
}

.checkout-btn:hover:not(:disabled) {
    background-color: #45a049;
    border-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.share-btn:disabled, .checkout-btn:disabled {
    background-color: #e5e7eb;
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Empty Cart State */
.empty-cart {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.empty-state {
    text-align: center;
    background: white;
    padding: 3rem;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    max-width: 400px;
}

.empty-state i {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1.5rem;
}

.empty-state h3 {
    color: #2a3f2a;
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
}

.empty-state p {
    color: #64748b;
    font-size: 1rem;
    margin: 0 0 2rem 0;
}

.continue-shopping {
    background-color: #4CAF50;
    color: white;
    border: 2px solid transparent;
    padding: 1rem 2rem;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.continue-shopping:hover {
    background-color: white;
    color: #4CAF50;
    border-color: #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
}

/* Sync Status Badge */
.sync-status {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.sync-badge {
    padding: 0.75rem 1rem;
    border-radius: 25px;
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sync-owner {
    background: linear-gradient(135deg, #4CAF50, #45a049);
}

.sync-receiver {
    background: linear-gradient(135deg, #2196F3, #1976d2);
}

.sync-badge i {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Notifications */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    z-index: 2000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease-out forwards;
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

.notification.success {
    background: linear-gradient(135deg, #4CAF50, #45a049);
}

.notification.error {
    background: linear-gradient(135deg, #f44336, #d32f2f);
}

.notification.info {
    background: linear-gradient(135deg, #2196F3, #1976d2);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.notification-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
    .cart-content {
        padding: 1rem;
    }
    
    .cart-header h1 {
        font-size: 1.75rem;
    }
    
    .cart-item {
        flex-direction: column;
        gap: 1rem;
    }
    
    .item-image-container {
        width: 100%;
        height: 200px;
        align-self: center;
    }
    
    .cart-actions {
        flex-direction: column;
    }
    
    .sharing-badge {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .action-btn {
        align-self: flex-start;
    }
}

@media (max-width: 480px) {
    .cart-content {
        padding: 0.5rem;
    }
    
    .cart-header h1 {
        font-size: 1.5rem;
    }
    
    .select-all-section,
    .cart-item,
    .cart-summary {
        padding: 1rem;
    }
    
    .quantity-controls {
        justify-content: center;
    }
}

/* Scrollbar Styling */
.cart-items-container::-webkit-scrollbar {
    width: 6px;
}

.cart-items-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.cart-items-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
}

.cart-items-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>