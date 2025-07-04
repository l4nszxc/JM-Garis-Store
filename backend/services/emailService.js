const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'lanslorence@gmail.com',
        pass: process.env.EMAIL_PASS || 'dwha kvpo ogpk txmg'
    }
});

exports.sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"JM Garis Store" <${process.env.EMAIL_USER || 'storeofjmgaris@gmail.com'}>`,
            to: email,
            subject: "Email Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Email Verification</h2>
                    <p>Your OTP for email verification is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                </div>
            `
        });
    } catch (error) {
        throw error;
    }
};

exports.sendPasswordResetOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"JM Garis Store" <${process.env.EMAIL_USER || 'storeofjmgaris@gmail.com'}>`,
            to: email,
            subject: "Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>Password Reset Request</h2>
                    <p>Your OTP for password reset is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });
    } catch (error) {
        throw error;
    }
};