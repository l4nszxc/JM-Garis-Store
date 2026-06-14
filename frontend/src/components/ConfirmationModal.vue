<template>
    <div v-if="show" class="confirmation-modal-overlay">
        <div class="confirmation-modal-content">
            <div class="confirmation-modal-header">
                <h3><i :class="icon"></i> {{ title }}</h3>
                <button class="close-modal-btn" @click="$emit('cancel')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="confirmation-modal-body">
                <p>{{ message }}</p>
            </div>
            <div class="confirmation-modal-footer">
                <button class="cancel-btn" @click="$emit('cancel')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="confirm-btn" :class="confirmButtonClass" @click="$emit('confirm')">
                    <i :class="confirmIcon"></i> {{ confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ConfirmationModal',
    props: {
        show: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: 'fas fa-question-circle'
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        confirmIcon: {
            type: String,
            default: 'fas fa-check'
        },
        confirmButtonClass: {
            type: String,
            default: ''
        }
    }
}
</script>

<style scoped>
.confirmation-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.confirmation-modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.confirmation-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
}

.confirmation-modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
}

.close-modal-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6c757d;
    transition: color 0.2s;
}

.close-modal-btn:hover {
    color: #343a40;
}

.confirmation-modal-body {
    margin-bottom: 1.5rem;
}

.confirmation-modal-body p {
    font-size: 1rem;
    line-height: 1.5;
    color: #495057;
}

.confirmation-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.confirmation-modal-footer button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}

.cancel-btn {
    background-color: #f8f9fa;
    color: #6c757d;
    border: 1px solid #dee2e6;
}

.cancel-btn:hover {
    background-color: #e9ecef;
}

.confirm-btn {
    background-color: #0d6efd;
    color: white;
}

.confirm-btn:hover {
    background-color: #0b5ed7;
}

/* Custom button styles */
.confirm-btn.danger {
    background-color: #dc3545;
}

.confirm-btn.danger:hover {
    background-color: #c82333;
}

.confirm-btn.secondary {
    background-color: #6c757d;
}

.confirm-btn.secondary:hover {
    background-color: #5a6268;
}
</style>


