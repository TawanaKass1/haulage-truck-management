import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

// Only create transporter if email credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your-email@gmail.com') {
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log('✅ Email transporter configured');
    } catch (error) {
        console.error('Email configuration error:', error);
        transporter = null;
    }
} else {
    console.log('⚠️ Email not configured. OTP will be shown in console and API response.');
    transporter = null;
}

export const sendOTP = async (email, otp) => {
    // If no transporter, just log the OTP
    if (!transporter) {
        console.log(`\n📧 =========================================`);
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`📧 Use this OTP to verify your account`);
        console.log(`📧 =========================================\n`);
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Haulage System - OTP Verification',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #bf6a39;">Haulage Truck Management System</h2>
        <p>Hello,</p>
        <p>Your OTP for verification is:</p>
        <h1 style="color: #bf6a39; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">© 2024 Haulage System. All rights reserved.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent to:', email);
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};