import Admin from '../model/admin.js';
import CustomError from '../helpers/error.js';

/**
 * Authentication middleware to verify JWT tokens
 * This middleware checks for a valid JWT token in the Authorization header
 * and attaches the decoded admin user to req.admin
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            throw new CustomError(401, 'Access token required');
        }
        
        const decoded = Admin.verifyToken(token);
        
        // Find the admin user to ensure it still exists and is active
        const admin = await Admin.findByUsername(decoded.username);
        if (!admin) {
            throw new CustomError(401, 'Admin user not found');
        }
        
        if (!admin.is_active) {
            throw new CustomError(401, 'Admin account is disabled');
        }
        
        // Attach admin info to request object
        req.admin = {
            id: admin.id,
            username: admin.username
        };
        
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication middleware
 * This middleware checks for authentication but doesn't fail if no token is provided
 * Useful for endpoints that behave differently based on authentication status
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            req.admin = null;
            return next();
        }
        
        const decoded = Admin.verifyToken(token);
        
        // Find the admin user to ensure it still exists and is active
        const admin = await Admin.findByUsername(decoded.username);
        if (!admin || !admin.is_active) {
            req.admin = null;
            return next();
        }
        
        // Attach admin info to request object
        req.admin = {
            id: admin.id,
            username: admin.username
        };
        
        next();
    } catch (error) {
        // If token verification fails, continue without authentication
        req.admin = null;
        next();
    }
};

/**
 * Middleware to check if the request is from an authenticated admin
 * Returns authentication status without failing
 */
export const checkAuthStatus = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            req.isAuthenticated = false;
            req.admin = null;
            return next();
        }
        
        const decoded = Admin.verifyToken(token);
        const admin = await Admin.findByUsername(decoded.username);
        
        if (!admin || !admin.is_active) {
            req.isAuthenticated = false;
            req.admin = null;
            return next();
        }
        
        req.isAuthenticated = true;
        req.admin = {
            id: admin.id,
            username: admin.username
        };
        
        next();
    } catch (error) {
        req.isAuthenticated = false;
        req.admin = null;
        next();
    }
};

export default { authenticateToken, optionalAuth, checkAuthStatus };