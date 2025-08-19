import Request from './request.js';
import Storage from './storage.js';

/**
 * Authentication Manager
 * Handles user authentication, token management, and admin session state
 */
export default class AuthManager {
    constructor() {
        this.request = new Request({
            url: 'http://localhost:3000',
        });
        this.storage = new Storage('busicode_auth');
        this.isAuthenticated = false;
        this.admin = null;
        
        // Check authentication status on initialization
        this.checkAuthStatus();
    }

    /**
     * Login with username and password
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Login result
     */
    async login(username, password) {
        try {
            const response = await this.request.post('auth/login', {
                username,
                password
            });

            if (response.token) {
                // Store token and admin info
                this.storage.saveData({
                    token: response.token,
                    admin: response.admin,
                    loginTime: new Date().toISOString()
                });

                // Set authorization header for future requests
                this.request.setHeader('Authorization', `Bearer ${response.token}`);
                
                // Update internal state
                this.isAuthenticated = true;
                this.admin = response.admin;
                
                // Dispatch authentication changed event
                this.dispatchAuthEvent('login', response.admin);
                
                return {
                    success: true,
                    admin: response.admin
                };
            }
            
            return { success: false, message: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.message || 'Login failed' 
            };
        }
    }

    /**
     * Logout current admin
     * @returns {Promise<Object>} Logout result
     */
    async logout() {
        try {
            // If authenticated, call logout endpoint
            if (this.isAuthenticated) {
                try {
                    await this.request.post('auth/logout');
                } catch (error) {
                    // Continue with logout even if server call fails
                    console.warn('Server logout failed:', error);
                }
            }

            // Clear local storage
            this.storage.clearData();
            
            // Remove authorization header
            this.request.removeHeader('Authorization');
            
            // Update internal state
            this.isAuthenticated = false;
            this.admin = null;
            
            // Dispatch authentication changed event
            this.dispatchAuthEvent('logout', null);
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { 
                success: false, 
                message: error.message || 'Logout failed' 
            };
        }
    }

    /**
     * Check current authentication status
     * @returns {Promise<boolean>} Authentication status
     */
    async checkAuthStatus() {
        try {
            // Check if we have stored credentials
            const authData = this.storage.loadData();
            if (!authData || !authData.token) {
                this.isAuthenticated = false;
                this.admin = null;
                return false;
            }

            // Set the token for the request
            this.request.setHeader('Authorization', `Bearer ${authData.token}`);

            // Verify token with server
            try {
                const response = await this.request.get('auth/verify');
                if (response.valid && response.admin) {
                    this.isAuthenticated = true;
                    this.admin = response.admin;
                    
                    // Update stored admin info if needed
                    authData.admin = response.admin;
                    this.storage.saveData(authData);
                    
                    return true;
                }
            } catch (error) {
                // Token is invalid, clear stored data
                console.warn('Token verification failed:', error);
                this.storage.clearData();
                this.request.removeHeader('Authorization');
            }

            this.isAuthenticated = false;
            this.admin = null;
            return false;
        } catch (error) {
            console.error('Auth status check error:', error);
            this.isAuthenticated = false;
            this.admin = null;
            return false;
        }
    }

    /**
     * Get current authentication status (synchronous)
     * @returns {Object} Current auth state
     */
    getAuthState() {
        return {
            isAuthenticated: this.isAuthenticated,
            admin: this.admin
        };
    }

    /**
     * Check if user is authenticated (synchronous)
     * @returns {boolean} Authentication status
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }

    /**
     * Get current admin info
     * @returns {Object|null} Admin info or null if not authenticated
     */
    getCurrentAdmin() {
        return this.admin;
    }

    /**
     * Get stored token
     * @returns {string|null} JWT token or null if not stored
     */
    getToken() {
        const authData = this.storage.loadData();
        return authData ? authData.token : null;
    }

    /**
     * Dispatch authentication events
     * @param {string} type - Event type ('login' or 'logout')
     * @param {Object|null} admin - Admin data or null
     */
    dispatchAuthEvent(type, admin) {
        const event = new CustomEvent('authenticationChanged', {
            detail: {
                type,
                isAuthenticated: this.isAuthenticated,
                admin
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Create a Request instance with authentication header
     * @returns {Request} Authenticated request instance
     */
    getAuthenticatedRequest() {
        const request = new Request({
            url: 'http://localhost:3000',
        });
        
        if (this.isAuthenticated) {
            const token = this.getToken();
            if (token) {
                request.setHeader('Authorization', `Bearer ${token}`);
            }
        }
        
        return request;
    }

    /**
     * Check if the current session is valid based on storage timestamp
     * @returns {boolean} Session validity
     */
    isSessionValid() {
        const authData = this.storage.loadData();
        if (!authData || !authData.loginTime) return false;
        
        const loginTime = new Date(authData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Token expires after 24 hours (as set in backend)
        return hoursDiff < 24;
    }
}