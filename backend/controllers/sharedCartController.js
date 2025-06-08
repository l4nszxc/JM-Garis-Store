const SharedCart = require('../models/sharedCartModel');
const Cart = require('../models/cartModel');
const db = require('../config/db'); // Add this import at the top

exports.createShareLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await SharedCart.createShareLink(userId);
        res.json(result);
    } catch (error) {
        console.error('Error creating share link:', error);
        res.status(500).json({ message: 'Failed to create share link' });
    }
};

exports.getSharedCart = async (req, res) => {
    try {
        const { shareId } = req.params;
        const result = await SharedCart.getSharedCart(shareId);
        res.json(result);
    } catch (error) {
        console.error('Error getting shared cart:', error);
        res.status(404).json({ message: 'Shared cart not found or expired' });
    }
};

exports.acceptSharedCart = async (req, res) => {
    try {
        const { shareId } = req.params;
        const userId = req.user.id;
        
        // Accept the shared cart invitation
        const { ownerId } = await SharedCart.acceptSharedCart(shareId, userId);
        
        // Get owner's cart items
        const ownerItems = await Cart.getCart(ownerId);
        
        // Remove current items from receiver's cart
        const receiverItems = await Cart.getCart(userId);
        for (const item of receiverItems) {
            await Cart.removeFromCart(userId, item.id);
        }
        
        // Copy items to receiver's cart
        for (const item of ownerItems) {
            await Cart.addToCart(userId, item.product_id, item.quantity, item.choice_id);
        }
        
        res.json({ message: 'Cart items synchronized successfully' });
    } catch (error) {
        console.error('Error accepting shared cart:', error);
        res.status(500).json({ message: 'Failed to accept shared cart' });
    }
};

exports.getActiveShare = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeShare = await SharedCart.getActiveSharedCart(userId);
        res.json(activeShare || { active: false });
    } catch (error) {
        console.error('Error getting active share:', error);
        res.status(500).json({ message: 'Error checking active share status' });
    }
};

exports.stopSharing = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find active shares where the user is the owner
        const [shares] = await db.execute(
            'SELECT * FROM shared_carts WHERE owner_id = ? AND status = "active"',
            [userId]
        );
        
        if (shares.length === 0) {
            return res.status(404).json({ message: 'No active shared cart found' });
        }
        
        // Update the share status to expired instead of inactive
        await db.execute(
            'UPDATE shared_carts SET status = "expired" WHERE owner_id = ? AND status = "active"',
            [userId]
        );
        
        res.json({ message: 'Successfully stopped sharing cart' });
    } catch (error) {
        console.error('Error stopping cart sharing:', error);
        res.status(500).json({ message: 'Failed to stop sharing cart' });
    }
};

exports.leaveSharing = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find active shares where the user is the receiver
        const [shares] = await db.execute(
            'SELECT * FROM shared_carts WHERE shared_with = ? AND status = "active"',
            [userId]
        );
        
        if (shares.length === 0) {
            return res.status(404).json({ message: 'No active shared cart found' });
        }
        
        // Update to expired instead of inactive
        await db.execute(
            'UPDATE shared_carts SET status = "expired" WHERE shared_with = ? AND status = "active"',
            [userId]
        );
        
        res.json({ message: 'Successfully left shared cart' });
    } catch (error) {
        console.error('Error leaving shared cart:', error);
        res.status(500).json({ message: 'Failed to leave shared cart' });
    }
};