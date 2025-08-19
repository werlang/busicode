import { Router } from 'express';
import Admin from '../model/admin.js';
import { authenticateToken } from '../middleware/auth.js';
import CustomError from '../helpers/error.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate admin user with username and password
 */
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            throw new CustomError(400, 'Username and password are required');
        }
        
        const result = await Admin.authenticate(username, password);
        
        res.status(200).json({
            message: 'Login successful',
            token: result.token,
            admin: result.admin
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /auth/logout
 * Logout admin user (client-side token removal)
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
    try {
        // In a JWT system, logout is primarily handled client-side by removing the token
        // Server-side, we can log the logout action if needed
        
        res.status(200).json({
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /auth/verify
 * Verify if the current token is valid and return admin info
 */
router.get('/verify', authenticateToken, async (req, res, next) => {
    try {
        // If we reach here, the token is valid (middleware passed)
        res.status(200).json({
            valid: true,
            admin: req.admin
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /auth/status
 * Check authentication status without requiring valid token
 */
router.get('/status', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(200).json({
                authenticated: false,
                admin: null
            });
        }
        
        try {
            const decoded = Admin.verifyToken(token);
            const admin = await Admin.findByUsername(decoded.username);
            
            if (!admin || !admin.is_active) {
                return res.status(200).json({
                    authenticated: false,
                    admin: null
                });
            }
            
            res.status(200).json({
                authenticated: true,
                admin: {
                    id: admin.id,
                    username: admin.username
                }
            });
        } catch (error) {
            res.status(200).json({
                authenticated: false,
                admin: null
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /auth/create-admin
 * Create a new admin user (protected route - requires admin authentication)
 */
router.post('/create-admin', authenticateToken, async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        const admin = await Admin.create({ username, password });
        
        res.status(201).json({
            message: 'Admin user created successfully',
            admin: admin.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /auth/admins
 * Get all admin users (protected route)
 */
router.get('/admins', authenticateToken, async (req, res, next) => {
    try {
        const admins = await Admin.getAll();
        
        res.status(200).json({
            admins: admins.map(admin => admin.toJSON())
        });
    } catch (error) {
        next(error);
    }
});

export default router;