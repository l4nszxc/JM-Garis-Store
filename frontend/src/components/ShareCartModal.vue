<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <h3><i class="fas fa-share-alt"></i> Share Your Cart</h3>
            <div class="sync-info">
                <i class="fas fa-info-circle"></i>
                <p>When you share your cart, any changes you make will be synchronized with the recipient in real-time, and vice versa.</p>
            </div>
            
            <div v-if="shareLink" class="share-link-container">
                <p>Share this link with others:</p>
                <div class="link-display">
                    <input 
                        type="text" 
                        :value="shareLink" 
                        readonly 
                        ref="linkInput"
                    >
                    <button @click="copyLink" class="copy-btn">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div v-if="copied" class="copy-success">
                    <i class="fas fa-check-circle"></i> Link copied to clipboard!
                </div>
                <p class="expiry-note">Link expires in 24 hours</p>
            </div>
            <div v-else>
                <p>Generate a link to share your cart with others:</p>
                <button @click="generateLink" class="generate-btn">
                    <i class="fas fa-magic"></i> Generate Share Link
                </button>
            </div>

            <div class="modal-actions">
                <button @click="$emit('close')" class="close-btn">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ShareCartModal',
    props: {
        show: Boolean
    },
    data() {
        return {
            shareLink: null,
            copied: false
        }
    },
    methods: {
        async generateLink() {
            try {
                const token = localStorage.getItem('token');
                const response = await this.$fetch('/api/shared-cart/share', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Generate the absolute URL
                    const baseUrl = window.location.origin;
                    this.shareLink = `${baseUrl}/shared-cart/${data.shareId}`;
                } else {
                    throw new Error('Failed to generate share link');
                }
            } catch (error) {
                console.error('Error generating share link:', error);
                alert('Failed to generate share link. Please try again.');
            }
        },
        copyLink() {
            this.$refs.linkInput.select();
            document.execCommand('copy');
            this.copied = true;
            
            // Hide the message after 3 seconds
            setTimeout(() => {
                this.copied = false;
            }, 3000);
        }
    }
}
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
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
}

.share-link-container {
    margin: 1.5rem 0;
}

.link-display {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
}

.link-display input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
}

.copy-btn {
    padding: 0.75rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.copy-success {
    color: #4CAF50;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.expiry-note {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
}

.generate-btn {
    width: 100%;
    padding: 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin: 1rem 0;
}

.modal-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
}

.close-btn {
    padding: 0.75rem 1.5rem;
    background: #e0e0e0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}
.sync-info {
    background-color: #e3f2fd;
    border-radius: 8px;
    padding: 12px;
    margin-top: 15px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.sync-info i {
    color: #2196F3;
    font-size: 18px;
    margin-top: 2px;
}

.sync-info p {
    margin: 0;
    font-size: 14px;
    color: #333;
    line-height: 1.4;
}
</style>


