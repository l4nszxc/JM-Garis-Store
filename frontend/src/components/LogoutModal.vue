<template>
    <div v-if="show" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div class="modal-buttons">
          <button @click="$emit('confirm')" class="confirm-btn">Yes, Logout</button>
          <button @click="$emit('cancel')" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LogoutModal',
    props: {
      show: {
        type: Boolean,
        default: false
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    text-align: center;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .confirm-btn, .cancel-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .confirm-btn {
    background-color: #dc3545;
    color: white;
  }
  
  .cancel-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .confirm-btn:hover {
    background-color: #c82333;
  }
  
  .cancel-btn:hover {
    background-color: #5a6268;
  }
  </style>