import Modal from './modal.js';
import Toast from './toast.js';

/**
 * Login Modal Component
 * Provides a modal interface for admin authentication
 */
export default class LoginModal {
    constructor(authManager) {
        this.authManager = authManager;
        this.modal = null;
        this.isLoggingIn = false;
    }

    /**
     * Show the login modal
     */
    show() {
        this.createLoginModal();
        this.modal.show();
    }

    /**
     * Hide the login modal
     */
    hide() {
        if (this.modal) {
            this.modal.hide();
        }
    }

    /**
     * Create the login modal HTML and functionality
     */
    createLoginModal() {
        const modalContent = `
            <div class="login-modal-content">
                <h3>Acesso Administrativo</h3>
                <p class="login-description">
                    Entre com suas credenciais de administrador para acessar as funções de edição.
                </p>
                
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="login-username">Usuário:</label>
                        <input 
                            type="text" 
                            id="login-username" 
                            name="username"
                            placeholder="Digite seu usuário"
                            required
                            autocomplete="username"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Senha:</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            name="password"
                            placeholder="Digite sua senha"
                            required
                            autocomplete="current-password"
                        >
                    </div>
                    
                    <div class="login-actions">
                        <button type="submit" id="login-submit-btn" class="btn-primary">
                            <span class="login-btn-text">Entrar</span>
                            <span class="login-btn-loading" style="display: none;">Entrando...</span>
                        </button>
                        <button type="button" id="login-cancel-btn" class="btn-secondary">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.modal = new Modal({
            id: 'login-modal',
            title: '',
            content: modalContent,
            showCloseButton: true,
            className: 'login-modal',
            onShown: () => {
                // Setup handlers when modal is fully rendered and in DOM
                this.setupLoginHandlers();
            }
        });
    }

    /**
     * Setup event handlers for the login form
     */
    setupLoginHandlers() {
        const form = document.getElementById('login-form');
        const submitBtn = document.getElementById('login-submit-btn');
        const cancelBtn = document.getElementById('login-cancel-btn');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');

        // Check if all elements exist before setting up handlers
        if (!form || !submitBtn || !cancelBtn || !usernameInput || !passwordInput) {
            console.error('Login form elements not found in DOM');
            return;
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.hide();
        });

        // Enter key on inputs
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isLoggingIn) {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        });

        // Focus username input when modal opens
        setTimeout(() => {
            usernameInput.focus();
        }, 100);
    }

    /**
     * Handle login form submission
     */
    async handleLogin() {
        if (this.isLoggingIn) return;

        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const submitBtn = document.getElementById('login-submit-btn');
        const btnText = submitBtn.querySelector('.login-btn-text');
        const btnLoading = submitBtn.querySelector('.login-btn-loading');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            Toast.show({
                message: 'Por favor, preencha usuário e senha.',
                type: 'error'
            });
            return;
        }

        try {
            this.isLoggingIn = true;
            
            // Update button state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';

            const result = await this.authManager.login(username, password);

            if (result.success) {
                Toast.show({
                    message: `Bem-vindo, ${result.admin.username}!`,
                    type: 'success'
                });
                
                this.hide();
                
                // Clear form
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                Toast.show({
                    message: result.message || 'Credenciais inválidas. Tente novamente.',
                    type: 'error'
                });
                
                // Focus password input for retry
                passwordInput.select();
            }
        } catch (error) {
            console.error('Login error:', error);
            Toast.show({
                message: 'Erro ao fazer login. Tente novamente.',
                type: 'error'
            });
        } finally {
            this.isLoggingIn = false;
            
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    /**
     * Show a quick login prompt with default credentials pre-filled
     */
    showQuickLogin() {
        this.show();
        
        // Pre-fill with default credentials after a short delay
        setTimeout(() => {
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            
            if (usernameInput && passwordInput) {
                usernameInput.value = 'admin';
                passwordInput.value = 'admin123';
                passwordInput.focus();
                passwordInput.select();
            }
        }, 200);
    }
}