const pool = require('./config/db');

async function listProducts() {
    try {
        const [products] = await pool.query(`
            SELECT 
                p.products_id,
                p.name,
                COUNT(DISTINCT o.order_id) as order_count,
                SUM(oi.quantity) as total_sold
            FROM products p
            LEFT JOIN order_items oi ON p.products_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id 
                AND o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup')
            GROUP BY p.products_id, p.name
            HAVING total_sold > 0
            ORDER BY total_sold DESC
            LIMIT 15
        `);
        
        console.log('\n📦 Product IDs for Training:\n');
        console.log('='.repeat(70));
        products.forEach((p, i) => {
            console.log(`${i+1}. ID ${p.products_id}: ${p.name.padEnd(30)} (${p.total_sold} sold, ${p.order_count} orders)`);
        });
        console.log('='.repeat(70));
        console.log('\n💡 To train on specific product:');
        console.log('   python services/forecastTrainer.py <PRODUCT_ID>');
        console.log('\n   Example: python services/forecastTrainer.py 1\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listProducts();
