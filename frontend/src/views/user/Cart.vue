<template>
    <div class="cart-container">
        <Navbar :username="username" @logout="showLogoutModal = true"/>
        
        <div class="cart-content">
            <div class="cart-header">
                <h1><i class="fas fa-shopping-cart"></i> Shopping Cart</h1>
                <!-- Add console debugging to check values -->
                <div class="debug-info" style="display: none;">
                    syncStatus: {{ JSON.stringify(syncStatus) }}, 
                    partnerUsername: {{ partnerUsername }}
                </div>
                <div v-if="notification.show" class="notification" :class="notification.type">
                    <div class="notification-content">
                        <i :class="notification.icon"></i>
                        {{ notification.message }}
                    </div>
                    <button class="notification-close" @click="hideNotification">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <!-- Cart sharing info with action buttons -->
                <div v-if="syncStatus" class="cart-sharing-info">
                    <div v-if="syncStatus.role === 'owner'" class="owner-sharing">
                        <i class="fas fa-share-alt"></i> You are currently sharing your cart with: <strong>{{ partnerUsername || 'another user' }}</strong>
                        <button @click="stopSharing" class="stop-sharing-btn">
                            <i class="fas fa-times-circle"></i> Stop Sharing
                        </button>
                    </div>
                    <div v-else class="receiver-sharing">
                        <i class="fas fa-user-friends"></i> You are currently using: <strong>{{ partnerUsername || 'another user' }}'s</strong> cart
                        <button @click="leaveSharing" class="leave-sharing-btn">
                            <i class="fas fa-sign-out-alt"></i> Leave Cart
                        </button>
                    </div>
                </div>
            </div>
            <div v-if="syncStatus" class="sync-status">
                <div class="sync-badge" :class="{'sync-owner': syncStatus.role === 'owner', 'sync-receiver': syncStatus.role === 'receiver'}">
                    <i class="fas fa-sync-alt"></i> 
                    {{ syncStatus.role === 'owner' ? 'Your cart is being shared' : 'Viewing a shared cart' }}
                </div>
            </div>
            
            <div v-if="cartItems.length > 0" class="select-all-container">
                <div class="select-all-checkbox">
                    <label>
                        <input 
                            type="checkbox" 
                            :checked="allItemsSelected"
                            @change="toggleSelectAll"
                            id="select-all"
                        >
                        <span class="checkbox-label">Select All</span>
                    </label>
                </div>
            </div>

            <div v-if="cartItems.length > 0" class="cart-items">
                <div v-for="item in cartItems" :key="item.id" class="cart-item">
                    <div class="cart-item-checkbox">
                        <input 
                            type="checkbox" 
                            :checked="checkedItems.has(item.id)"
                            @change="toggleItemCheck(item.id)"
                        >
                    </div>
                    <img 
                        :src="item.image || '/img/placeholder.jpg'"
                        :alt="item.name"
                        class="cart-item-image"
                        @error="handleImageError"
                    >
                    <div class="cart-item-details">
                        <h3><i class="fas fa-box"></i> {{ item.name }}</h3>
                        <p v-if="item.choice_name" class="choice-info">
                            <i class="fas fa-tag"></i> Option: {{ item.choice_name }}
                        </p>
                        <p class="price">
                            <i class="fas fa-tag"></i> Price: {{ formatPrice(item.price || 0) }}
                        </p>                        <div class="quantity-controls">
                            <span class="quantity-label"><i class="fas fa-cubes"></i> Quantity:</span>
                            <button @click="updateQuantity(item.id, item.quantity - 1)" 
                                    :disabled="item.quantity <= 1"
                                    class="quantity-btn">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-value">{{ item.quantity }}</span>
                            <button @click="updateQuantity(item.id, item.quantity + 1)"
                                    class="quantity-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <p class="subtotal">
                            <i class="fas fa-calculator"></i> Subtotal: {{ formatPrice((item.price || 0) * item.quantity) }}
                        </p>                        <button class="remove-btn" @click="removeFromCart(item.id)">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="cart-summary">
                    <h3><i class="fas fa-receipt"></i> Cart Summary</h3>
                    <div class="summary-details">
                        <p class="total-items">
                            <i class="fas fa-shopping-basket"></i> Selected Items: {{ checkedItemsCount }}
                        </p>
                        <p class="total-amount">
                            <i class="fas fa-dollar-sign"></i> Total Amount: {{ formatPrice(cartTotal) }}
                        </p>
                    </div>
                    <div class="cart-actions">
                        <button 
                            class="share-btn" 
                            @click="showShareModal = true"
                            :disabled="cartItems.length === 0"
                        >
                            <i class="fas fa-share-alt"></i> Share Cart
                        </button>
                        <button 
                            class="checkout-btn" 
                            @click="showOrdersModal = true" 
                            :disabled="checkedItemsCount === 0"
                        >
                            <i class="fas fa-credit-card"></i> Place Order
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="empty-cart">
                <i class="fas fa-shopping-cart empty-cart-icon"></i>
                <p>Your cart is empty</p>
                <button class="continue-shopping" @click="$router.push('/products')">
                    <i class="fas fa-store"></i> Continue Shopping
                </button>
            </div>
        </div>
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
        
        <!-- Add leave sharing confirmation modal -->
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
            showStopSharingModal: false, // Add this line
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
            // Clear any existing timeout
            if (this.notification.timeout) {
                clearTimeout(this.notification.timeout);
            }
            
            // Set icon based on type
            let icon = 'fas fa-check-circle';
            if (type === 'error') {
                icon = 'fas fa-exclamation-circle';
            } else if (type === 'info') {
                icon = 'fas fa-info-circle';
            }
            
            // Show notification
            this.notification = {
                show: true,
                message,
                type,
                icon,
                timeout: setTimeout(() => {
                    this.hideNotification();
                }, 5000) // Auto-hide after 5 seconds
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
        
        // Update confirmLeaveSharing method
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
                    
                    // Refresh cart after leaving
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
                    console.log('Partner username data:', data);
                    this.partnerUsername = data.username || 'another user';
                } else {
                    console.error('Error response when fetching username:', await response.text());
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
                    console.log('Sync status data:', data);
                    
                    if (data && data.shareId) {
                        this.syncStatus = data;
                        // Make sure we fetch the username immediately after setting sync status
                        await this.fetchPartnerUsername();
                    } else {
                        this.syncStatus = null;
                        this.partnerUsername = '';
                    }
                } else {
                    console.error('Error response when checking sync status:', await response.text());
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
        handleCartUpdate() {
            this.fetchCart(); // Refresh cart when updated
        },
        toggleItemCheck(itemId) {
            if (this.checkedItems.has(itemId)) {
                this.checkedItems.delete(itemId);
            } else {
                this.checkedItems.add(itemId);
            }
        },
       async handlePlaceOrder({ items, discountId }) {
            try {
                const token = localStorage.getItem('token');
                
                // Ensure items have all required properties
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
                    discountId: discountId
                };

                console.log('Sending order with data:', requestBody);

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

                const { orderId, finalAmount, appliedDiscount, pointsEarned } = await response.json();

                // Instead of trying to delete from server again, just update local UI
                // since the items are already processed in the order
                this.cartItems = this.cartItems.filter(cartItem => 
                    !items.some(item => item.id === cartItem.id)
                );
                
                // Clear selected items
                this.checkedItems.clear();
                
                // Update available discounts
                await this.fetchAvailableDiscounts();

                // Check if cart was being shared and notify user
                if (this.syncStatus) {
                    this.showNotification('Your order has been placed. Cart sharing has been automatically ended.', 'info');
                    this.syncStatus = null;
                    this.partnerUsername = '';
                }

                this.showOrdersModal = false;
                this.$router.push('/view-orders');
                
                // Dispatch cart update event
                window.dispatchEvent(new CustomEvent('cart-updated'));

            } catch (error) {
                console.error('Error placing order:', error);
                this.showNotification('Failed to place order: ' + (error.message || 'Unknown error'), 'error');
            }
        },
        
        handleImageError(e) {
            e.target.src = 'placeholder-image.jpg'; // Fallback image
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
                    // Remove item from local array and checked items
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
                    await this.fetchCart(); // Refresh cart after update
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
        
        // Check for sync status periodically
        this.syncInterval = setInterval(async () => {
            await this.checkSyncStatus();
            if (this.syncStatus) {
                await this.fetchCart(); // Refresh cart to see changes
            }
        }, 1000); // Check every 5 seconds
    },
    beforeDestroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
};
</script>

<style scoped>
.cart-container {
    font-family: Arial, sans-serif;
    min-height: 100vh;
    background-color: #f5f5f5;
}

.cart-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.cart-header {
    margin-bottom: 2rem;
}

.cart-header h1 {
    color: #2c3e50;
    font-size: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.cart-item:hover {
    transform: translateY(-2px);
}

.cart-item-image {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-item-details {
    flex-grow: 1;
}

.cart-item-details h3 {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.price, .subtotal {
    font-size: 1.1rem;
    color: #2c3e50;
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
}

.quantity-label {
    color: #666;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.quantity-btn:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #4CAF50;
    color: #4CAF50;
}

.quantity-value {
    font-size: 1.1rem;
    min-width: 2rem;
    text-align: center;
}

.remove-btn {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.remove-btn:hover {
    background-color: #c82333;
    transform: translateY(-1px);
}

.cart-summary {
    margin-top: 2rem;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cart-summary h3 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.summary-details {
    margin-bottom: 1.5rem;
}

.summary-details p {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    font-size: 1.1rem;
    color: #2c3e50;
}

.checkout-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.checkout-btn:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
}

.empty-cart {
    text-align: center;
    padding: 3rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.empty-cart-icon {
    font-size: 4rem;
    color: #cbd5e0;
    margin-bottom: 1rem;
}

.empty-cart p {
    color: #2c3e50;
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
}

.continue-shopping {
    background-color: #4CAF50;
    color: white;
    border: 2px solid transparent;
    padding: 1rem 2rem;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 auto;
    box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
    transition: all 0.3s ease;
}

.continue-shopping:hover {
    background-color: white;
    color: #4CAF50;
    border: 2px solid #4CAF50;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}
.cart-item-checkbox {
    display: flex;
    align-items: center;
    margin-right: 1rem;
}
.cart-item-checkbox input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}
.checkout-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}
.checkout-btn:disabled:hover {
    background-color: #cccccc;
    transform: none;
    box-shadow: none;
}
.cart-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.view-orders-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.view-orders-btn:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.view-orders-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.cart-actions button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}
.select-all-container {
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
}

.select-all-checkbox {
    display: flex;
    align-items: center;
}

.select-all-checkbox label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    color: #2c3e50;
    font-size: 1rem;
}

.select-all-checkbox input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

.checkbox-label {
    user-select: none;
}
@media (max-width: 768px) {
    .cart-item {
        flex-direction: column;
    }

    .cart-item-image {
        width: 100%;
        margin-right: 0;
        margin-bottom: 1rem;
    }

    .quantity-controls {
        justify-content: center;
    }
}
.choice-info {
    font-size: 0.95rem;
    color: #3498db;
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #eef6fd;
    padding: 0.5rem;
    border-radius: 4px;
    width: fit-content;
}
.share-btn {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    transition: all 0.3s ease;
}

.share-btn:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-2px);
}

.share-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
.sync-status {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.sync-badge {
    padding: 10px 15px;
    border-radius: 20px;
    font-size: 14px;
    color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
}

.sync-owner {
    background-color: #4CAF50;
}

.sync-receiver {
    background-color: #3498db;
}

.sync-badge i {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.cart-sharing-info {
    margin-top: 0.5rem;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 1rem;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
}

.owner-sharing, .receiver-sharing {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.owner-sharing {
    color: #4CAF50;
}

.owner-sharing i {
    color: #4CAF50;
}

.receiver-sharing {
    color: #3498db;
}

.receiver-sharing i {
    color: #3498db;
}
.stop-sharing-btn, .leave-sharing-btn {
    margin-left: 15px;
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.stop-sharing-btn {
    background-color: #dc3545;
    color: white;
}

.stop-sharing-btn:hover {
    background-color: #c82333;
}

.leave-sharing-btn {
    background-color: #6c757d;
    color: white;
}

.leave-sharing-btn:hover {
    background-color: #5a6268;
}
.notification {
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 400px;
    z-index: 2000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slide-in 0.3s ease-out forwards;
}

@keyframes slide-in {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification.success {
    background-color: #4CAF50;
}

.notification.error {
    background-color: #f44336;
}

.notification.info {
    background-color: #2196F3;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    display: flex;
    align-items: center;
}
</style>