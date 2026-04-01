import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { protect } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register driver with OTP
router.post('/register-driver', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('license_number').notEmpty(),
    body('phone').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password, name, license_number, phone } = req.body;

        console.log('Registration attempt:', { email, name, license_number });

        // Check if user exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if driver with license exists
        const existingDriver = await pool.query('SELECT * FROM drivers WHERE license_number = $1', [license_number]);
        if (existingDriver.rows.length > 0) {
            return res.status(400).json({ message: 'License number already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 10);

        console.log('Generated OTP:', otp);

        // Create user
        const userResult = await pool.query(
            'INSERT INTO users (email, password, name, role, is_verified, otp_code, otp_expires) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name',
            [email, hashedPassword, name, 'driver', false, otp, otpExpires]
        );

        // Create driver profile
        await pool.query(
            'INSERT INTO drivers (user_id, name, license_number, phone, email) VALUES ($1, $2, $3, $4, $5)',
            [userResult.rows[0].id, name, license_number, phone, email]
        );

        // Try to send OTP
        try {
            await sendOTP(email, otp);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        logger.info(`Driver registered: ${email}`);

        res.status(201).json({
            message: 'Registration successful. Please verify OTP sent to your email.',
            otp: otp, // For development only
            userId: userResult.rows[0].id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Verify OTP
router.post('/verify-otp', [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, otp } = req.body;

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expires > NOW()',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await pool.query(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires = NULL WHERE id = $1',
            [result.rows[0].id]
        );

        const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        const driverResult = await pool.query('SELECT * FROM drivers WHERE user_id = $1', [result.rows[0].id]);

        res.json({
            token,
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email,
                name: result.rows[0].name,
                role: result.rows[0].role,
                driver: driverResult.rows[0]
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend OTP
router.post('/resend-otp', [
    body('email').isEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email } = req.body;
        const otp = generateOTP();
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 10);

        const result = await pool.query(
            'UPDATE users SET otp_code = $1, otp_expires = $2 WHERE email = $3 AND is_verified = FALSE RETURNING *',
            [otp, otpExpires, email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found or already verified' });
        }

        await sendOTP(email, otp);

        res.json({ message: 'OTP resent successfully', otp: otp });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin login
router.post('/login-admin', [
    body('email').isEmail(),
    body('password').notEmpty(),
    body('secretCode').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password, secretCode } = req.body;

        if (secretCode !== 'ADMIN2024!') {
            return res.status(401).json({ message: 'Invalid secret code' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'admin']);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Driver login
router.post('/login-driver', [
    body('email').isEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'driver']);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_verified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        const driverResult = await pool.query('SELECT * FROM drivers WHERE user_id = $1', [user.id]);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                driver: driverResult.rows[0]
            }
        });
    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    if (req.user.role === 'driver') {
        const driverResult = await pool.query('SELECT * FROM drivers WHERE user_id = $1', [req.user.id]);
        res.json({ user: req.user, driver: driverResult.rows[0] });
    } else {
        res.json({ user: req.user });
    }
});

// Debug endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

// Debug admin check
router.get('/debug/admin-check', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', ['admin@marytechenock.com']);
        res.json({
            adminExists: result.rows.length > 0,
            admin: result.rows[0] || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

console.log('✅ Auth routes loaded');

// THIS IS THE IMPORTANT PART - Make sure this export exists
export default router;