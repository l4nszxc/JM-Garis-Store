const mysql = require('mysql2/promise');

async function importInsertedUsers() {
    const connection = await mysql.createConnection({
        host: 'switchback.proxy.rlwy.net',
        port: 59293,
        user: 'root',
        password: 'jJyLsLCVKSGQnoeTGsEIHoLpeGIqWPHg',
        database: 'railway',
        multipleStatements: true
    });

    const insertQuery = `DROP INTO orders (order_id, user_id, total_amount, status, payment_status, created_at, updated_at, cancel_reason, accepted_by, accepted_at, cash_amount, change_amount, customer_name, is_physical_order, packaging_preference, payment_intent_id, payment_method)
VALUES
('TXN1027', 1027, 1200.00, 'pending', 'pending', '2025-10-10 10:05:00', '2025-10-10 10:05:00', NULL, NULL, NULL, 300.00, 0.00, 'Josephine Mendoza', 1, 'eco', NULL, 'downpayment_cash_on_pickup'),
('TXN1028', 1028, 850.00, 'pending', 'pending', '2025-10-12 11:40:00', '2025-10-12 11:40:00', NULL, NULL, NULL, 850.00, 0.00, 'Mark Santos', 1, 'plastic', NULL, 'cash_on_pickup'),
('TXN1029', 1029, 650.00, 'pending', 'pending', '2025-10-14 14:00:00', '2025-10-14 14:00:00', NULL, NULL, NULL, NULL, NULL, 'Angelica Dela Cruz', 0, 'eco', NULL, 'gcash'),
('TXN1030', 1030, 950.00, 'pending', 'pending', '2025-10-16 16:10:00', '2025-10-16 16:10:00', NULL, NULL, NULL, 950.00, 0.00, 'Daniel Garcia', 1, 'eco', NULL, 'cash_on_pickup'),
('TXN1031', 1031, 1500.00, 'pending', 'pending', '2025-10-18 18:20:00', '2025-10-18 18:20:00', NULL, NULL, NULL, 1500.00, 0.00, 'Kristine Ramos', 1, 'eco', NULL, 'hatid');
`;

    try {
        const [result] = await connection.execute(insertQuery);
        console.log('✓ Successfully imported 5 users');
    } catch (error) {
        console.error('✗ Error importing users:', error.message);
    } finally {
        await connection.end();
        console.log('✓ Database connection closed');
    }
}

importInsertedUsers();
