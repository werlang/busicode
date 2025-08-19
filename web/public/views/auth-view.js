import AuthManager from '../helpers/auth-manager.js';
import LoginModal from '../components/login-modal.js';
import Toast from '../components/toast.js';

/**
 * Authentication View
 * Manages authentication UI components and state across the application
 */
export default class AuthView {
    constructor() {
        this.authManager = new AuthManager();
        this.loginModal = new LoginModal(this.authManager);
        this.isReadOnlyMode = true;
        
        this.setupAuthControls();
        this.setupAuthEventListeners();
        this.updateAuthUI();
    }

    /**
     * Initialize authentication view
     * @returns {AuthView} This instance for chaining
     */
    async initialize() {
        // Check authentication status on load
        const isAuthenticated = await this.authManager.checkAuthStatus();
        
        // Update UI based on authentication state
        this.updateAuthUI();
        
        // Set read-only mode based on authentication
        this.isReadOnlyMode = !isAuthenticated;
        this.updateReadOnlyMode(); // This will call toggleReadOnlyElements
        
        return this;
    }

    /**
     * Setup authentication control event listeners
     */
    setupAuthControls() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showLoginModal();
            });
        } else {
            console.warn('Login button not found');
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    /**
     * Setup authentication event listeners
     */
    setupAuthEventListeners() {
        // Listen for authentication changes
        document.addEventListener('authenticationChanged', (event) => {
            const { type, isAuthenticated, admin } = event.detail;
            
            if (type === 'login') {
                this.isReadOnlyMode = false;
            } else if (type === 'logout') {
                this.isReadOnlyMode = true;
            }
            
            this.updateAuthUI();
            this.updateReadOnlyMode();
        });
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        if (this.authManager.isLoggedIn()) {
            return; // Already authenticated
        }
        
        this.loginModal.show();
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            const result = await this.authManager.logout();
            
            if (result.success) {
                Toast.show({
                    message: 'Logout realizado com sucesso.',
                    type: 'success'
                });
            } else {
                Toast.show({
                    message: 'Erro ao fazer logout.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
            Toast.show({
                message: 'Erro ao fazer logout.',
                type: 'error'
            });
        }
    }

    /**
     * Update authentication UI elements
     */
    updateAuthUI() {
        const authStatus = document.getElementById('auth-status');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        const authState = this.authManager.getAuthState();
        
        if (authState.isAuthenticated) {
            // Authenticated state
            if (authStatus) {
                authStatus.className = 'auth-indicator authenticated';
                authStatus.querySelector('.status-text').textContent = 
                    `Admin: ${authState.admin.username}`;
            }
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
        } else {
            // Not authenticated state
            if (authStatus) {
                authStatus.className = 'auth-indicator not-authenticated';
                authStatus.querySelector('.status-text').textContent = 'Modo Somente Leitura';
            }
            
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    /**
     * Update read-only mode across the application
     */
    updateReadOnlyMode() {
        // Dispatch event to notify other components about mode change
        const event = new CustomEvent('readOnlyModeChanged', {
            detail: {
                isReadOnly: this.isReadOnlyMode,
                isAuthenticated: this.authManager.isLoggedIn()
            }
        });
        document.dispatchEvent(event);
        
        this.toggleReadOnlyElements();
    }

    /**
     * Toggle read-only elements based on authentication state
     */
    toggleReadOnlyElements() {
        // Hide action elements completely in read-only mode
        const actionElements = document.querySelectorAll(`
            [data-auth-required="true"],
            .auth-required
        `);

        actionElements.forEach(element => {
            if (this.isReadOnlyMode) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });

        // Handle form sections that require authentication
        const authRequiredSections = document.querySelectorAll('.auth-required-section');
        authRequiredSections.forEach(section => {
            if (this.isReadOnlyMode) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
            }
        });

        // Handle input fields that should be disabled but not hidden
        const restrictedInputs = document.querySelectorAll('input:not([data-readonly-allow]), textarea:not([data-readonly-allow]), select:not([data-readonly-allow])');
        restrictedInputs.forEach(input => {
            // Skip auth-related inputs and filter inputs
            if (input.closest('#login-form') || 
                input.closest('.login-modal') || 
                input.hasAttribute('data-readonly-allow') ||
                input.id.includes('filter') ||
                input.id.includes('select')) {
                return;
            }
            
            if (this.isReadOnlyMode) {
                input.setAttribute('readonly', 'true');
                input.style.backgroundColor = '#f8f9fa';
                input.style.cursor = 'not-allowed';
                input.setAttribute('title', 'Faça login como administrador para editar');
            } else {
                input.removeAttribute('readonly');
                input.style.backgroundColor = '';
                input.style.cursor = '';
                input.removeAttribute('title');
            }
        });

        // Add read-only mode indicators
        this.addReadOnlyIndicators();
    }

    /**
     * Add read-only mode indicators to sections
     */
    addReadOnlyIndicators() {
        // Remove existing indicators
        document.querySelectorAll('.readonly-mode-indicator').forEach(el => el.remove());
        
        // Don't add read-only indicators - users should navigate freely
        // The auth status in the header is sufficient indication
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.authManager.isLoggedIn();
    }

    /**
     * Check if currently in read-only mode
     * @returns {boolean} Read-only status
     */
    isInReadOnlyMode() {
        return this.isReadOnlyMode;
    }

    /**
     * Get current admin info
     * @returns {Object|null} Admin info or null
     */
    getCurrentAdmin() {
        return this.authManager.getCurrentAdmin();
    }

    /**
     * Get authenticated request instance
     * @returns {Request} Request instance with auth headers
     */
    getAuthenticatedRequest() {
        return this.authManager.getAuthenticatedRequest();
    }
}