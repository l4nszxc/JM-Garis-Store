const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async create(username, firstname, middlename, lastname, gender, civilStatus, phoneNumber, address, birthdate, email, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.execute(
                'INSERT INTO users (username, firstname, middlename, lastname, gender, civil_status, phone_number, address, birthdate, email, password, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false)',
                [username, firstname, middlename, lastname, gender, civilStatus, phoneNumber, address, birthdate, email, hashedPassword]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    static async updateProfile(userId, data) {
        try {
          const [result] = await db.execute(
            `UPDATE users 
             SET username = ?, 
                 firstname = ?, 
                 middlename = ?, 
                 lastname = ?, 
                 gender = ?, 
                 civil_status = ?, 
                 phone_number = ?, 
                 address = ?,
                 birthdate = ?
             WHERE id = ?`,
            [
              data.username,
              data.firstname,
              data.middlename || null, // Convert empty string to null
              data.lastname,
              data.gender,
              data.civil_status,
              data.phone_number,
              data.address,
              data.birthdate,
              userId
            ]
          );
          return result;
        } catch (error) {
          console.error('Database error:', error);
          throw error;
        }
      }

    static async updateOTP(email, otp) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET otp = ?, otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?',
                [otp, email]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async verifyOTP(email, otp) {
      try {
          const [rows] = await db.execute(
              'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expires > NOW()',
              [email, otp]
          );
          return rows[0];
      } catch (error) {
          throw error;
      }
  }

  static async markEmailAsVerified(email) {
    try {
        const [result] = await db.execute(
            'UPDATE users SET email_verified = true, otp = NULL, otp_expires = NULL WHERE email = ?',
            [email]
        );
        return result;
    } catch (error) {
        throw error;
    }
  }
  static async isEmailVerified(email) {
    try {
        const [rows] = await db.execute(
            'SELECT email_verified FROM users WHERE email = ?',
            [email]
        );
        return rows[0]?.email_verified === 1;
    } catch (error) {
        throw error;
    }
  }
  static async createVerifiedUser(username, email, password, role = 'user') {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, true)',
            [username, email, hashedPassword, role]
        );
        return result;
    } catch (error) {
        throw error;
    }
}
static async updatePasswordResetOTP(email, otp) {
    try {
        const [result] = await db.execute(
            'UPDATE users SET password_reset_otp = ?, password_reset_otp_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?',
            [otp, email]
        );
        return result;
    } catch (error) {
        throw error;
    }
}

static async verifyPasswordResetOTP(email, otp) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND password_reset_otp = ? AND password_reset_otp_expires > NOW()',
            [email, otp]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}

static async resetPassword(email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'UPDATE users SET password = ?, password_reset_otp = NULL, password_reset_otp_expires = NULL WHERE email = ?',
            [hashedPassword, email]
        );
        return result;
    } catch (error) {
        throw error;
    }
}
static async findById(id) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}
static async updateProfilePicture(userId, imageUrl) {
    try {
        const [result] = await db.execute(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [imageUrl, userId]
        );
        return result;
    } catch (error) {
        throw error;
    }
}
}


module.exports = User;