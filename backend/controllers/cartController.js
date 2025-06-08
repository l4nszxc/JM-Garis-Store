const Cart = require('../models/cartModel');
const SharedCart = require('../models/sharedCartModel');

exports.getCart = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const cartItems = await Cart.getCart(req.user.id);
        res.json(cartItems);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Error getting cart items' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { productId, quantity, choiceId } = req.body;
        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        await Cart.addToCart(req.user.id, productId, quantity, choiceId || null);
        
        // Check if user has an active shared cart
        const activeShare = await SharedCart.getActiveSharedCart(req.user.id);
        if (activeShare) {
            const partnerId = activeShare.partnerId;
            if (partnerId) {
                // Sync the product to the partner's cart
                await Cart.addToCart(partnerId, productId, quantity, choiceId || null);
            }
        }
        
        res.status(201).json({ message: 'Product added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding product to cart' });
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { cartId } = req.params;
        const { quantity } = req.body;
        
        if (!cartId || !quantity) {
            return res.status(400).json({ message: 'Cart ID and quantity are required' });
        }

        // Get product details before update
        const userCartItems = await Cart.getCart(req.user.id);
        const cartItem = userCartItems.find(item => item.id == cartId);
        
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        
        await Cart.updateQuantity(req.user.id, cartId, quantity);
        
        // Check if user has an active shared cart
        const activeShare = await SharedCart.getActiveSharedCart(req.user.id);
        if (activeShare && activeShare.partnerId) {
            // Find the same product in partner's cart
            const partnerCartItems = await Cart.getCart(activeShare.partnerId);
            const partnerItem = partnerCartItems.find(item => 
                item.product_id == cartItem.product_id && 
                item.choice_id == cartItem.choice_id
            );
            
            if (partnerItem) {
                await Cart.updateQuantity(activeShare.partnerId, partnerItem.id, quantity);
            }
        }
        
        res.json({ message: 'Cart updated successfully' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { cartId } = req.params;
        if (!cartId) {
            return res.status(400).json({ message: 'Cart ID is required' });
        }
        
        // Get product details before removal
        const userCartItems = await Cart.getCart(req.user.id);
        const cartItem = userCartItems.find(item => item.id == cartId);
        
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        await Cart.removeFromCart(req.user.id, cartId);
        
        // Check if user has an active shared cart
        const activeShare = await SharedCart.getActiveSharedCart(req.user.id);
        if (activeShare && activeShare.partnerId) {
            // Find the same product in partner's cart
            const partnerCartItems = await Cart.getCart(activeShare.partnerId);
            const partnerItem = partnerCartItems.find(item => 
                item.product_id == cartItem.product_id && 
                item.choice_id == cartItem.choice_id
            );
            
            if (partnerItem) {
                await Cart.removeFromCart(activeShare.partnerId, partnerItem.id);
            }
        }
        
        res.json({ message: 'Product removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Error removing product from cart' });
    }
};