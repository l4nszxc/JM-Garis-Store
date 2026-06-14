const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportDatabase() {
    try {
        // Connect to Railway MySQL database
        const connection = await mysql.createConnection({
            host: 'switchback.proxy.rlwy.net',
            port: 59293,
            user: 'root',
            password: 'jJyLsLCVKSGQnoeTGsEIHoLpeGIqWPHg',
            database: 'railway',
            charset: 'utf8mb4'
        });

        console.log('Connected to Railway MySQL database');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Found tables:', tables.map(t => Object.values(t)[0]));

        let sqlExport = '';
        sqlExport += '-- Railway Database Export\n';
        sqlExport += `-- Exported on ${new Date().toISOString()}\n`;
        sqlExport += '-- Database: railway\n\n';

        sqlExport += 'SET NAMES utf8mb4;\n';
        sqlExport += 'SET CHARACTER_SET_CLIENT = utf8mb4;\n';
        sqlExport += 'SET CHARACTER_SET_RESULTS = utf8mb4;\n';
        sqlExport += 'SET COLLATION_CONNECTION = utf8mb4_unicode_ci;\n';
        sqlExport += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            console.log(`Exporting table: ${tableName}`);

            // Get CREATE TABLE statement
            const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
            sqlExport += `-- Table: ${tableName}\n`;
            sqlExport += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sqlExport += createTable[0]['Create Table'] + ';\n\n';

            // Get table data
            const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
            
            if (rows.length > 0) {
                sqlExport += `-- Data for table: ${tableName}\n`;
                
                // Get column names
                const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
                const columnNames = columns.map(col => `\`${col.Field}\``).join(', ');
                
                sqlExport += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;
                
                const values = rows.map(row => {
                    const rowValues = Object.values(row).map(value => {
                        if (value === null) return 'NULL';
                        if (Buffer.isBuffer(value)) {
                            // Handle binary data
                            return `0x${value.toString('hex')}`;
                        }
                        if (typeof value === 'string') {
                            // Escape special characters properly
                            const escaped = value
                                .replace(/\\/g, '\\\\')
                                .replace(/'/g, "\\'")
                                .replace(/"/g, '\\"')
                                .replace(/\n/g, '\\n')
                                .replace(/\r/g, '\\r')
                                .replace(/\t/g, '\\t')
                                .replace(/\0/g, '\\0');
                            return `'${escaped}'`;
                        }
                        if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        if (typeof value === 'boolean') return value ? '1' : '0';
                        if (typeof value === 'number') return value;
                        return `'${value}'`;
                    });
                    return `(${rowValues.join(', ')})`;
                });
                
                sqlExport += values.join(',\n') + ';\n\n';
            }
        }

        sqlExport += 'SET FOREIGN_KEY_CHECKS = 1;\n';
        fs.writeFileSync('railway_database_export.sql', sqlExport, 'utf8');
        console.log('Database exported successfully to railway_database_export.sql');

        await connection.end();
    } catch (error) {
        console.error('Export failed:', error);
    }
}

exportDatabase();