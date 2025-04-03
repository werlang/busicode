/**
 * Notification Manager
 * Handles UI notifications like modals and toast messages
 * @deprecated Use Toast and Modal classes directly instead
 */
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class NotificationManager {
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     * @deprecated Use Toast.show() instead
     */
    static showToast(message, type = 'info', duration = 3000) {
        console.warn('NotificationManager.showToast is deprecated. Use Toast.show() instead.');
        return Toast.show(message, type, duration);
    }
    
    /**
     * Show a modal dialog
     * @param {Object} options - Modal options
     * @param {string} options.title - Modal title
     * @param {string} options.message - Modal message
     * @param {string} options.confirmText - Text for confirm button
     * @param {string} options.cancelText - Text for cancel button
     * @param {Function} options.onConfirm - Callback for confirm action
     * @param {Function} options.onCancel - Callback for cancel action
     * @param {string} options.type - Type of modal (default, warning, danger)
     * @returns {Object} Modal elements
     * @deprecated Use Modal.show() instead
     */
    static showModal(options) {
        console.warn('NotificationManager.showModal is deprecated. Use Modal.show() instead.');
        return Modal.show(options);
    }
    
    /**
     * Show an input modal dialog
     * @param {Object} options - Modal options
     * @param {string} options.title - Modal title
     * @param {string} options.message - Modal message
     * @param {Array} options.fields - Input fields configuration
     * @param {string} options.confirmText - Text for confirm button
     * @param {string} options.cancelText - Text for cancel button
     * @param {Function} options.onConfirm - Callback for confirm action with input values
     * @param {Function} options.onCancel - Callback for cancel action
     * @returns {Object} Modal elements
     * @deprecated Use Modal.showInput() instead
     */
    static showInputModal(options) {
        console.warn('NotificationManager.showInputModal is deprecated. Use Modal.showInput() instead.');
        return Modal.showInput(options);
    }
    
    /**
     * Show a loading spinner
     * @param {string} message - Optional message to display with the spinner
     * @returns {Object} Spinner elements and a close function
     * @deprecated Use Modal.showLoading() instead
     */
    static showLoading(message = '') {
        console.warn('NotificationManager.showLoading is deprecated. Use Modal.showLoading() instead.');
        return Modal.showLoading(message);
    }
}