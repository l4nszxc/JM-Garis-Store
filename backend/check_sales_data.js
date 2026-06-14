const pool = require('./config/db');

async function checkSalesData() {
    try {
        // Check total paid orders
        const [totalOrders] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup')
        `);
        
        console.log('\n📊 Sales Data Summary');
        console.log('='.repeat(60));
        console.log(`Total Paid Orders: ${totalOrders[0].count}`);
        
        // Check recent sales days
        const [recentDays] = await pool.query(`
            SELECT 
                DATE(created_at) as date, 
                COUNT(*) as orders
            FROM orders 
            WHERE status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup')
            GROUP BY DATE(created_at) 
            ORDER BY date DESC 
            LIMIT 10
        `);
        
        console.log('\nRecent Sales Days:');
        console.log('-'.repeat(60));
        recentDays.forEach(r => {
            console.log(`  ${r.date}: ${r.orders} orders`);
        });
        
        // Check product sales
        const [productSales] = await pool.query(`
            SELECT 
                p.products_id,
                p.name,
                COUNT(DISTINCT o.order_id) as order_count,
                SUM(oi.quantity) as total_sold
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.products_id
            WHERE o.status IN ('paid', 'paid using gcash', 'preparing', 'ready for pickup')
            GROUP BY p.products_id, p.name
            ORDER BY total_sold DESC
            LIMIT 10
        `);
        
        console.log('\nTop Selling Products:');
        console.log('-'.repeat(60));
        productSales.forEach((p, i) => {
            console.log(`  ${i+1}. ${p.name}: ${p.total_sold} units sold (${p.order_count} orders)`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (totalOrders[0].count > 0) {
            console.log('✅ You have sales data! Ready for forecasting.');
            console.log('\n💡 Run: python services/forecastTrainer.py');
        } else {
            console.log('⚠️  No sales data found.');
            console.log('\n💡 Run: python services/generateSampleData.py');
        }
        console.log('='.repeat(60) + '\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkSalesData();
