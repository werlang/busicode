/**
 * Toast notification component
 */
export default class Toast {
    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.message - Toast message
     * @param {string} options.type - Toast type (info, success, warning, error)
     * @param {number} options.duration - Duration in milliseconds
     * @returns {HTMLElement} Toast element
     */
    static show(options = {}) {
        const {
            message = '',
            type = 'info',
            duration = 3000
        } = options;
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Trigger entrance animation using CSS classes
        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });
        
        // Set timeout to remove toast
        const timeout = setTimeout(() => {
            // Remove the visible class to trigger exit animation
            toast.classList.remove('toast-visible');
            
            // Remove from DOM after animation completes
            toast.addEventListener('transitionend', () => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, { once: true });
        }, duration);
        
        // Return toast element
        return toast;
    }
    
    /**
     * Show an info toast
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} Toast element
     */
    static info(message, duration = 3000) {
        return this.show({ message, type: 'info', duration });
    }
    
    /**
     * Show a success toast
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} Toast element
     */
    static success(message, duration = 3000) {
        return this.show({ message, type: 'success', duration });
    }
    
    /**
     * Show a warning toast
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} Toast element
     */
    static warning(message, duration = 3000) {
        return this.show({ message, type: 'warning', duration });
    }
    
    /**
     * Show an error toast
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {HTMLElement} Toast element
     */
    static error(message, duration = 3000) {
        return this.show({ message, type: 'error', duration });
    }
}