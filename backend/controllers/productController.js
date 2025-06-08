const Product = require('../models/productModel');
const Admin = require('../models/adminModel');
const multer = require('multer');
const { uploadToImgBB } = require('../services/imgbbService');
const db = require('../config/db');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'choiceImage', maxCount: 10 } // Allow up to 10 choice images
]);
exports.uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(500).json({ message: `Server error: ${err.message}` });
        }
        next();
    });
};

exports.insertProduct = async (req, res) => {
    try {
        const { name, description, price, stock_quantity, category, hasChoices, choices } = req.body;
        let imageUrl = null;

        if (req.files && req.files.image && req.files.image[0]) {
            imageUrl = await uploadToImgBB(req.files.image[0].buffer);
        }

        // Validate input data
        if (!name || !description || !price || category === undefined) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // Ensure stock_quantity is a valid integer
        const parsedStock = parseInt(stock_quantity) || 0;

        // Create the product
        const productId = await Product.create({
            name,
            description,
            price,
            stock_quantity: parsedStock,
            category,
            image: imageUrl
        });

        // Handle product choices if they exist
        if (hasChoices && choices) {
            const choicesArray = JSON.parse(choices);
            const choiceImages = req.files.choiceImage || [];
            
            for (let i = 0; i < choicesArray.length; i++) {
                const choice = choicesArray[i];
                let choiceImageUrl = null;
                
                // Upload choice image if provided
                if (choiceImages[i]) {
                    choiceImageUrl = await uploadToImgBB(choiceImages[i].buffer);
                }
                
                // Create the choice
                await Product.createChoice({
                    productId,
                    name: choice.name,
                    price: choice.price,
                    stock: choice.stock,
                    image: choiceImageUrl
                });
            }
        }

        res.status(201).json({ 
            message: 'Product added successfully',
            productId,
            imageUrl
        });
    } catch (error) {
        console.error('Product insertion error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update the existing routes to fetch product choices too
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.getAll();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;
        const products = await Product.getByCategory(category);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock_quantity, category, hasChoices, choices } = req.body;
        let imageUrl = null;

        // Handle image upload to ImgBB if a new image was provided
        if (req.files && req.files.image && req.files.image[0]) {
            imageUrl = await uploadToImgBB(req.files.image[0].buffer);
        }

        // Create updates object
        const updates = {
            name,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            category
        };

        // Only include image if a new one was uploaded
        if (imageUrl) {
            updates.image = imageUrl;
        }

        // Update the main product
        await Product.update(id, updates);

        // Handle choices if they exist
        if (hasChoices && choices) {
            const choicesArray = JSON.parse(choices);
            const choiceImages = req.files.choiceImage || [];
            const choiceImageIndexes = req.body.choiceImageIndex || [];

            for (let i = 0; i < choicesArray.length; i++) {
                const choice = choicesArray[i];
                let choiceImageUrl = null;

                // Check if there's a new image for this choice
                const imageIndex = choiceImageIndexes.indexOf(i.toString());
                if (imageIndex !== -1 && choiceImages[imageIndex]) {
                    choiceImageUrl = await uploadToImgBB(choiceImages[imageIndex].buffer);
                }

                if (choice.choice_id) {
                    // Update existing choice
                    const choiceUpdates = {
                        name: choice.name,
                        price: choice.price,
                        stock: choice.stock
                    };
                    if (choiceImageUrl) {
                        choiceUpdates.image = choiceImageUrl;
                    }
                    await Product.updateChoice(choice.choice_id, choiceUpdates);
                } else {
                    // Create new choice
                    await Product.createChoice({
                        productId: id,
                        name: choice.name,
                        price: choice.price,
                        stock: choice.stock,
                        image: choiceImageUrl || choice.image
                    });
                }
            }
        }

        res.json({ 
            message: 'Product updated successfully',
            imageUrl: imageUrl // Return the new image URL if one was uploaded
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            message: 'Error updating product',
            error: error.message 
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Admin.deleteProduct(id); // Change Product.delete to Admin.deleteProduct
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.getById(id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
};
exports.updateProductChoice = async (req, res) => {
    try {
        const { choiceId } = req.params;
        const { name, price, stock } = req.body;
        let imageUrl = null;

        // Handle image upload to ImgBB if a new image was provided
        if (req.files && req.files.image && req.files.image[0]) {
            imageUrl = await uploadToImgBB(req.files.image[0].buffer);
        }

        // Create updates object
        const updates = {
            name,
            price: parseFloat(price),
            stock: parseInt(stock)
        };

        // Only include image if a new one was uploaded
        if (imageUrl) {
            updates.image = imageUrl;
        }

        await Product.updateChoice(choiceId, updates);

        res.json({ 
            message: 'Product choice updated successfully',
            imageUrl: imageUrl // Return the new image URL if one was uploaded
        });
    } catch (error) {
        console.error('Error updating product choice:', error);
        res.status(500).json({ 
            message: 'Error updating product choice',
            error: error.message 
        });
    }
};
exports.deleteProductChoice = async (req, res) => {
    try {
        const { choiceId } = req.params;
        
        if (!choiceId) {
            return res.status(400).json({ message: 'Choice ID is required' });
        }

        // Delete the choice
        await Product.deleteChoice(choiceId);

        res.json({ message: 'Product choice deleted successfully' });
    } catch (error) {
        console.error('Error deleting product choice:', error);
        res.status(500).json({ message: 'Error deleting product choice', error: error.message });
    }
};
exports.hasChoices = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Check if the product has any choices/variants
        const [rows] = await db.query(
            'SELECT COUNT(*) as choiceCount FROM product_choices WHERE product_id = ?',
            [productId]
        );
        
        const hasChoices = rows[0].choiceCount > 0;
        
        res.json({ hasChoices });
    } catch (error) {
        console.error('Error checking product choices:', error);
        res.status(500).json({ message: 'Error checking product choices' });
    }
};