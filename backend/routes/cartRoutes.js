const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all cart routes
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:cartId', cartController.updateQuantity);
router.delete('/:cartId', cartController.removeFromCart);

module.exports = router;