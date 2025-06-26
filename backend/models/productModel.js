const db = require('../config/db');

class Product {
    static async create({ name, description, price, stock_quantity, category, image }) {
        try {
            const [result] = await db.execute(
                'INSERT INTO products (name, description, price, stock_quantity, category, image) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, price, stock_quantity, category, image]
            );
            return result.insertId;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }

    static async createChoice({ productId, name, price, stock, image }) {
        try {
            const safe = v => v === undefined ? null : v;

            const [result] = await db.execute(
                'INSERT INTO product_choices (product_id, name, price, stock, image) VALUES (?, ?, ?, ?, ?)',
                [
                    safe(productId),
                    safe(name),
                    safe(price),
                    safe(stock),
                    safe(image)
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            // Get all products
            const [products] = await db.execute(`
                SELECT p.*, COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.quantity ELSE 0 END), 0) as total_sold
                FROM products p
                LEFT JOIN order_items oi ON p.products_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                GROUP BY p.products_id
            `);
            
            // Get product choices for each product
            for (const product of products) {
                const [choices] = await db.execute(`
                    SELECT choice_id, name, price, stock, image
                    FROM product_choices
                    WHERE product_id = ?
                `, [product.products_id]);
                
                product.choices = choices;
            }
            
            return products;
        } catch (error) {
            throw error;
        }
    }

    static async getByCategory(category) {
        try {
            // Get products by category
            const [products] = await db.execute(
                `SELECT p.*, COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.quantity ELSE 0 END), 0) as total_sold
                FROM products p
                LEFT JOIN order_items oi ON p.products_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.order_id
                WHERE p.category = ?
                GROUP BY p.products_id`,
                [category]
            );
            
            // Get product choices for each product
            for (const product of products) {
                const [choices] = await db.execute(`
                    SELECT choice_id, name, price, stock, image
                    FROM product_choices
                    WHERE product_id = ?
                `, [product.products_id]);
                
                product.choices = choices;
            }
            
            return products;
        } catch (error) {
            throw error;
        }
    }
    static async update(id, updates) {
        try {
            // Filter out undefined and null values
            const validUpdates = Object.entries(updates)
                .filter(([_, value]) => value !== undefined && value !== null)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
    
            if (Object.keys(validUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }
    
            const setClause = Object.keys(validUpdates)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(validUpdates), id];
            
            const [result] = await db.execute(
                `UPDATE products SET ${setClause} WHERE products_id = ?`,
                values
            );
    
            return result;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
    static async updateChoice(choiceId, updates) {
        try {
            console.log('Updating choice with ID:', choiceId);
            console.log('Updates:', updates);
    
            // Filter out undefined and null values
            const validUpdates = Object.entries(updates)
                .filter(([_, value]) => value !== undefined && value !== null)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
    
            console.log('Valid updates after filtering:', validUpdates);
            
            if (Object.keys(validUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }
    
            const setClause = Object.keys(validUpdates)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(validUpdates), choiceId];
            
            console.log('SQL Set clause:', setClause);
            console.log('SQL Values:', values);
            
            const [result] = await db.execute(
                `UPDATE product_choices SET ${setClause} WHERE choice_id = ?`,
                values
            );
            
            console.log('Update result:', result);
            
            return result;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
    static async deleteChoice(choiceId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM product_choices WHERE choice_id = ?',
                [choiceId]
            );
            return result;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
}

module.exports = Product;