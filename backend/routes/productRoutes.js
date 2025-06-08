const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', productController.getAllProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.put('/choices/:choiceId', productController.uploadMiddleware, productController.updateProductChoice);
router.delete('/choices/:choiceId', productController.deleteProductChoice); 
router.post('/', productController.uploadMiddleware, productController.insertProduct);
router.put('/:id', productController.uploadMiddleware, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/:id/has-choices', authenticate, productController.hasChoices);

module.exports = router;