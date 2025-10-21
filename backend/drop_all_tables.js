const mysql = require('mysql2/promise');

async function dropAllTables() {
    try {
        // Connect to Railway MySQL database
        const connection = await mysql.createConnection({
            host: 'switchback.proxy.rlwy.net',
            port: 59293,
            user: 'root',
            password: 'jJyLsLCVKSGQnoeTGsEIHoLpeGIqWPHg',
            database: 'railway'
        });

        console.log('Connected to Railway MySQL database');

        // Disable foreign key checks to allow dropping tables with dependencies
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        console.log(`Found ${tableNames.length} tables:`, tableNames);

        if (tableNames.length === 0) {
            console.log('No tables to drop. Database is already empty.');
            await connection.end();
            return;
        }

        // Confirm before proceeding
        console.log('\n⚠️  WARNING: This will permanently delete all tables and data!');
        console.log('Tables to be dropped:');
        tableNames.forEach(table => console.log(`  - ${table}`));
        console.log('\nProceeding with table deletion in 3 seconds...');
        
        // Wait 3 seconds to give user a chance to cancel
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Drop each table
        for (const tableName of tableNames) {
            try {
                await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
                console.log(`✓ Dropped table: ${tableName}`);
            } catch (error) {
                console.error(`✗ Failed to drop table ${tableName}:`, error.message);
            }
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\nForeign key checks re-enabled');

        // Verify all tables are dropped
        const [remainingTables] = await connection.execute('SHOW TABLES');
        
        if (remainingTables.length === 0) {
            console.log('\n✓ SUCCESS: All tables have been dropped successfully!');
        } else {
            console.log('\n⚠️  WARNING: Some tables remain:');
            remainingTables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));
        }

        await connection.end();
        console.log('\nDatabase connection closed');

    } catch (error) {
        console.error('\n✗ ERROR: Drop operation failed:', error);
        process.exit(1);
    }
}

dropAllTables();
