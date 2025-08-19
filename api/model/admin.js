import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Model from './model.js';
import Mysql from '../helpers/mysql.js';
import CustomError from '../helpers/error.js';
import { randomUUID } from 'crypto';

export default class Admin extends Model {
    constructor(admin = {}) {
        super();
        
        this.id = admin.id || randomUUID();
        this.username = admin.username || '';
        this.password_hash = admin.password_hash || '';
        this.created_at = admin.created_at || null;
        this.last_login = admin.last_login || null;
        this.is_active = admin.is_active !== undefined ? admin.is_active : true;
        
        this.table = 'admin_users';
        this.allowUpdate = ['password_hash', 'last_login', 'is_active'];
        this.insertFields = ['id', 'username', 'password_hash', 'is_active'];
    }

    /**
     * Hash a password using bcrypt
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify a password against its hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {boolean} True if password matches
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token for admin
     * @returns {string} JWT token
     */
    generateToken() {
        const payload = {
            id: this.id,
            username: this.username,
            type: 'admin'
        };
        
        const secret = process.env.JWT_SECRET || 'busicode-secret-key';
        const options = {
            expiresIn: '24h'
        };
        
        return jwt.sign(payload, secret, options);
    }

    /**
     * Verify and decode JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    static verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || 'busicode-secret-key';
            return jwt.verify(token, secret);
        } catch (error) {
            throw new CustomError(401, 'Invalid or expired token');
        }
    }

    /**
     * Find admin by username
     * @param {string} username - Username to search for
     * @returns {Admin|null} Admin instance or null if not found
     */
    static async findByUsername(username) {
        try {
            const result = await Mysql.find('admin_users', {
                filter: { username },
                opt: { limit: 1 }
            });
            
            if (result.length === 0) {
                return null;
            }
            
            return new Admin(result[0]);
        } catch (error) {
            throw new CustomError(500, 'Error finding admin user');
        }
    }

    /**
     * Authenticate admin with username and password
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Object} Authentication result with token
     */
    static async authenticate(username, password) {
        if (!username || !password) {
            throw new CustomError(400, 'Username and password are required');
        }
        
        const admin = await Admin.findByUsername(username);
        if (!admin) {
            throw new CustomError(401, 'Invalid credentials');
        }
        
        if (!admin.is_active) {
            throw new CustomError(401, 'Admin account is disabled');
        }
        
        const isPasswordValid = await Admin.verifyPassword(password, admin.password_hash);
        if (!isPasswordValid) {
            throw new CustomError(401, 'Invalid credentials');
        }
        
        // Update last login time
        admin.last_login = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await admin.update({ last_login: admin.last_login });
        
        const token = admin.generateToken();
        
        return {
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                last_login: admin.last_login
            }
        };
    }

    /**
     * Get all admin users
     * @returns {Array} Array of admin users (without password hashes)
     */
    static async getAll() {
        try {
            const admins = await Mysql.find('admin_users', {
                view: ['id', 'username', 'created_at', 'last_login', 'is_active']
            });
            
            return admins.map(admin => new Admin(admin));
        } catch (error) {
            throw new CustomError(500, 'Error retrieving admin users');
        }
    }

    /**
     * Create a new admin user
     * @param {Object} adminData - Admin user data
     * @returns {Admin} Created admin instance
     */
    static async create(adminData) {
        const { username, password } = adminData;
        
        if (!username || !password) {
            throw new CustomError(400, 'Username and password are required');
        }
        
        // Check if username already exists
        const existingAdmin = await Admin.findByUsername(username);
        if (existingAdmin) {
            throw new CustomError(409, 'Username already exists');
        }
        
        const passwordHash = await Admin.hashPassword(password);
        
        const admin = new Admin({
            username,
            password_hash: passwordHash
        });
        
        await admin.insert();
        return admin;
    }

    /**
     * Convert admin to JSON (excluding sensitive data)
     * @returns {Object} Admin data as JSON
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            created_at: this.created_at,
            last_login: this.last_login,
            is_active: this.is_active
        };
    }
}