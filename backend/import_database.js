const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
    try {
        // Path to the SQL file to import
        const sqlFilePath = path.join(__dirname, 'config', 'FOR DEPLOYMENT DATABASE.sql');

        // Check if file exists
        if (!fs.existsSync(sqlFilePath)) {
            console.error(`✗ ERROR: SQL file not found at: ${sqlFilePath}`);
            process.exit(1);
        }

        console.log(`Reading SQL file: ${sqlFilePath}`);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Connect to Railway MySQL database
        const connection = await mysql.createConnection({
            host: 'switchback.proxy.rlwy.net',
            port: 59293,
            user: 'root',
            password: 'jJyLsLCVKSGQnoeTGsEIHoLpeGIqWPHg',
            database: 'railway',
            multipleStatements: true // Allow multiple SQL statements
        });

        console.log('✓ Connected to Railway MySQL database');

        // Split SQL content into individual statements
        // Remove comments and split by semicolons
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`\nFound ${statements.length} SQL statements to execute`);
        console.log('Starting import...\n');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Commands that should be skipped (not supported in prepared statements)
        const skipCommands = [
            'START TRANSACTION',
            'COMMIT',
            'SET SQL_MODE',
            'SET time_zone',
            'SET @OLD_CHARACTER_SET_CLIENT',
            'SET @OLD_CHARACTER_SET_RESULTS',
            'SET @OLD_COLLATION_CONNECTION',
            'SET NAMES',
            '/*!40101',
            '/*!40000'
        ];

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip empty statements
            if (!statement || statement.length < 5) continue;

            // Skip unsupported commands
            const shouldSkip = skipCommands.some(cmd => 
                statement.toUpperCase().trim().startsWith(cmd)
            );

            if (shouldSkip) {
                skippedCount++;
                continue;
            }

            try {
                await connection.execute(statement);
                successCount++;
                
                // Show progress for major operations
                if (statement.toUpperCase().includes('CREATE TABLE')) {
                    const match = statement.match(/CREATE TABLE [`']?(\w+)[`']?/i);
                    if (match) {
                        console.log(`✓ Created table: ${match[1]}`);
                    }
                } else if (statement.toUpperCase().includes('INSERT INTO')) {
                    const match = statement.match(/INSERT INTO [`']?(\w+)[`']?/i);
                    if (match && i % 10 === 0) { // Show every 10th insert to avoid spam
                        console.log(`✓ Inserting data into: ${match[1]}`);
                    }
                } else if (statement.toUpperCase().includes('DROP TABLE')) {
                    const match = statement.match(/DROP TABLE.*?[`']?(\w+)[`']?/i);
                    if (match) {
                        console.log(`✓ Dropped table: ${match[1]}`);
                    }
                }
            } catch (error) {
                errorCount++;
                // Only show first few errors to avoid spam
                if (errorCount <= 5) {
                    console.error(`✗ Error executing statement ${i + 1}:`, error.message);
                    if (errorCount === 5) {
                        console.log('... (suppressing further errors)');
                    }
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('Import Summary:');
        console.log('='.repeat(50));
        console.log(`✓ Successful statements: ${successCount}`);
        console.log(`⊘ Skipped statements: ${skippedCount} (unsupported commands)`);
        console.log(`✗ Failed statements: ${errorCount}`);
        console.log('='.repeat(50));

        // Verify tables were created
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n✓ Database now contains ${tables.length} tables:`);
        tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

        await connection.end();
        console.log('\n✓ Database connection closed');
        console.log('✓ Import completed successfully!');

    } catch (error) {
        console.error('\n✗ ERROR: Import failed:', error);
        process.exit(1);
    }
}

importDatabase();
