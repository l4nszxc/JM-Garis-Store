const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function importInsertedUsers() {
    const connection = await mysql.createConnection({
        host: 'switchback.proxy.rlwy.net',
        port: 59293,
        user: 'root',
        password: 'jJyLsLCVKSGQnoeTGsEIHoLpeGIqWPHg',
        database: 'railway',
        multipleStatements: true
    });

    // Default password for all users (hashed)
    const defaultPassword = await bcrypt.hash('password123', 10);
    const address = 'Sitio Pinyahan, Barcenaga Naujan City, Oriental Mindoro';

    const users = [
        {
            username: 'jessa.fabiano',
            firstname: 'Jessa',
            middlename: 'A.',
            lastname: 'Fabiano',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234567',
            address: address,
            birthdate: '1994-03-15',
            email: 'jessa.fabiano@gmail.com',
            password: defaultPassword
        },
        {
            username: 'marivic.laya',
            firstname: 'Marivic',
            middlename: 'F.',
            lastname: 'Laya',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234568',
            address: address,
            birthdate: '1984-07-22',
            email: 'marivic.laya@gmail.com',
            password: defaultPassword
        },
        {
            username: 'chora.aldea',
            firstname: 'Chora',
            middlename: '',
            lastname: 'Aldea',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234569',
            address: address,
            birthdate: '1974-11-08',
            email: 'chora.aldea@gmail.com',
            password: defaultPassword
        },
        {
            username: 'grace.matibag',
            firstname: 'Grace',
            middlename: 'H.',
            lastname: 'Matibag',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234570',
            address: address,
            birthdate: '1974-05-30',
            email: 'grace.matibag@gmail.com',
            password: defaultPassword
        },
        {
            username: 'jennyrose.gaba',
            firstname: 'Jenny Rose',
            middlename: 'C.',
            lastname: 'Gaba',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234571',
            address: address,
            birthdate: '1994-09-12',
            email: 'jennyrose.gaba@gmail.com',
            password: defaultPassword
        },
        {
            username: 'claris.hidalgo',
            firstname: 'Claris',
            middlename: 'H.',
            lastname: 'Hidalgo',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234572',
            address: address,
            birthdate: '1994-12-05',
            email: 'claris.hidalgo@gmail.com',
            password: defaultPassword
        },
        {
            username: 'maylyn.fabiano',
            firstname: 'Maylyn',
            middlename: 'A.',
            lastname: 'Fabiano',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234573',
            address: address,
            birthdate: '1974-02-18',
            email: 'maylyn.fabiano@gmail.com',
            password: defaultPassword
        },
        {
            username: 'mila.hardin',
            firstname: 'Mila',
            middlename: 'N.',
            lastname: 'Hardin',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234574',
            address: address,
            birthdate: '1964-06-25',
            email: 'mila.hardin@gmail.com',
            password: defaultPassword
        },
        {
            username: 'caren.eliaca',
            firstname: 'Caren',
            middlename: 'H.',
            lastname: 'Eliaca',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234575',
            address: address,
            birthdate: '1994-08-14',
            email: 'caren.eliaca@gmail.com',
            password: defaultPassword
        },
        {
            username: 'jerry.anonuevo',
            firstname: 'Jerry',
            middlename: 'O.',
            lastname: 'Anonuevo',
            gender: 'Male',
            civil_status: 'Married',
            phone_number: '09171234576',
            address: address,
            birthdate: '1974-04-20',
            email: 'jerry.anonuevo@gmail.com',
            password: defaultPassword
        },
        {
            username: 'rachell.atienza',
            firstname: 'Rachell',
            middlename: '',
            lastname: 'Atienza',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234577',
            address: address,
            birthdate: '1984-10-11',
            email: 'rachell.atienza@gmail.com',
            password: defaultPassword
        },
        {
            username: 'mercy.marceliana',
            firstname: 'Mercy',
            middlename: 'M.',
            lastname: 'Marceliana',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234578',
            address: address,
            birthdate: '1974-01-27',
            email: 'mercy.marceliana@gmail.com',
            password: defaultPassword
        },
        {
            username: 'raycie.panganiban',
            firstname: 'Raycie',
            middlename: '',
            lastname: 'Panganiban',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234579',
            address: address,
            birthdate: '1984-03-09',
            email: 'raycie.panganiban@gmail.com',
            password: defaultPassword
        },
        {
            username: 'hanzel.manalo',
            firstname: 'Hanzel',
            middlename: 'M.',
            lastname: 'Manalo',
            gender: 'Female',
            civil_status: 'Single',
            phone_number: '09171234580',
            address: address,
            birthdate: '2003-11-16',
            email: 'hanzel.manalo@gmail.com',
            password: defaultPassword
        },
        {
            username: 'jhon.reyes',
            firstname: 'Jhon Christopher',
            middlename: 'A.',
            lastname: 'Reyes',
            gender: 'Male',
            civil_status: 'Single',
            phone_number: '09171234581',
            address: address,
            birthdate: '2010-05-22',
            email: 'jhon.reyes@gmail.com',
            password: defaultPassword
        },
        {
            username: 'myra.delen',
            firstname: 'Myra',
            middlename: 'G.',
            lastname: 'Delen',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234582',
            address: address,
            birthdate: '1974-09-07',
            email: 'myra.delen@gmail.com',
            password: defaultPassword
        },
        {
            username: 'roseth.dulhin',
            firstname: 'Roseth',
            middlename: 'D.',
            lastname: 'Dulhin',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234583',
            address: address,
            birthdate: '1994-06-19',
            email: 'roseth.dulhin@gmail.com',
            password: defaultPassword
        },
        {
            username: 'venus.perez',
            firstname: 'Venus',
            middlename: 'A.',
            lastname: 'Perez',
            gender: 'Female',
            civil_status: 'Married',
            phone_number: '09171234584',
            address: address,
            birthdate: '1994-04-28',
            email: 'venus.perez@gmail.com',
            password: defaultPassword
        }
    ];

    const insertQuery = `INSERT INTO users (username, firstname, middlename, lastname, gender, civil_status, phone_number, address, birthdate, email, password, email_verified) VALUES ?`;

    const values = users.map(user => [
        user.username,
        user.firstname,
        user.middlename,
        user.lastname,
        user.gender,
        user.civil_status,
        user.phone_number,
        user.address,
        user.birthdate,
        user.email,
        user.password,
        true
    ]);

    try {
        const [result] = await connection.query(insertQuery, [values]);
        console.log(`✓ Successfully imported ${result.affectedRows} users`);
        console.log('✓ Default password for all users: password123');
    } catch (error) {
        console.error('✗ Error importing users:', error.message);
    } finally {
        await connection.end();
        console.log('✓ Database connection closed');
    }
}

importInsertedUsers();
