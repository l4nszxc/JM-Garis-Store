<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>
          <i class="fas fa-redo"></i>
          Repeat Order #{{ orderId }}
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="order-items">
          <h3>Items to be added:</h3>
          <div v-for="item in orderItems" :key="item.product_id" class="item-preview">
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.choice_name" class="item-choice">{{ item.choice_name }}</span>
              <span class="item-quantity">Qty: {{ item.quantity }}</span>
            </div>
          </div>
        </div>

        <div class="cart-options">
          <label class="replace-cart-option">
            <input 
              type="checkbox" 
              v-model="replaceCart"
            >
            <span class="checkbox-custom"></span>
            <div class="option-text">
              <strong>Replace current cart</strong>
              <small>Clear your current cart and add only these items</small>
            </div>
          </label>
          
          <div class="option-description">
            <i class="fas fa-info-circle"></i>
            <span v-if="replaceCart">
              Your current cart will be cleared and replaced with items from this order.
            </span>
            <span v-else>
              Items will be added to your existing cart.
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-btn">
          <i class="fas fa-times"></i>
          Cancel
        </button>
        <button @click="confirmRepeat" class="repeat-btn" :disabled="loading">
          <i class="fas fa-redo" v-if="!loading"></i>
          <i class="fas fa-spinner fa-spin" v-if="loading"></i>
          {{ loading ? 'Adding...' : 'Add to Cart' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RepeatOrderModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    orderId: {
      type: String,
      required: true
    },
    orderItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      replaceCart: false,
      loading: false
    };
  },
  methods: {
    async confirmRepeat() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7904/api/orders/${this.orderId}/repeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            replaceCart: this.replaceCart
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to repeat order');
        }

        const result = await response.json();
        
        this.$emit('success', {
          message: result.message,
          replaceCart: this.replaceCart
        });
        
        this.$emit('close');
        
      } catch (error) {
        console.error('Error repeating order:', error);
        this.$emit('error', error.message);
      } finally {
        this.loading = false;
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.replaceCart = false;
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.order-items h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.item-preview {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.item-name {
  font-weight: 500;
  color: #2c3e50;
}

.item-choice {
  color: #3498db;
  font-size: 0.9rem;
}

.item-quantity {
  color: #666;
  font-size: 0.9rem;
}

.cart-options {
  margin-top: 2rem;
}

.replace-cart-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.replace-cart-option:hover {
  border-color: #4CAF50;
  background-color: #f8fff8;
}

.replace-cart-option input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
}

.replace-cart-option input[type="checkbox"]:checked + .checkbox-custom {
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.replace-cart-option input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.option-text {
  flex: 1;
}

.option-text strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.option-text small {
  color: #666;
  font-size: 0.85rem;
}

.option-description {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.option-description i {
  color: #3498db;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn, .repeat-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.repeat-btn {
  background-color: #4CAF50;
  color: white;
}

.repeat-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.repeat-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-btn, .repeat-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>