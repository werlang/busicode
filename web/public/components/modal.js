/**
 * Modal Component
 * Handles modal dialogs for the application
 */
export default class Modal {
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
     */
    static show(options) {
        const {
            title = 'Mensagem',
            message = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            onConfirm = () => {},
            onCancel = () => {},
            type = 'default'
        } = options;
        
        // Create modal elements
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        
        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        const modalMessage = document.createElement('p');
        modalMessage.innerHTML = message;
        
        // Modal footer with buttons
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        // Create buttons
        const confirmButton = document.createElement('button');
        confirmButton.textContent = confirmText;
        confirmButton.className = `modal-confirm ${type !== 'default' ? `modal-confirm-${type}` : ''}`;
        
        let cancelButton;
        if (cancelText) {
            cancelButton = document.createElement('button');
            cancelButton.textContent = cancelText;
            cancelButton.className = 'modal-cancel';
            modalFooter.appendChild(cancelButton);
        }
        
        // Assemble modal
        modalHeader.appendChild(modalTitle);
        modalBody.appendChild(modalMessage);
        modalFooter.appendChild(confirmButton);
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modalOverlay);
        
        // Trigger animation using CSS classes
        requestAnimationFrame(() => {
            modalOverlay.classList.add('modal-visible');
            modalContent.classList.add('modal-content-visible');
        });
        
        // Event listeners
        const closeModal = () => {
            modalOverlay.classList.remove('modal-visible');
            modalContent.classList.remove('modal-content-visible');
            
            // Remove from DOM after animation completes
            modalOverlay.addEventListener('transitionend', () => {
                if (document.body.contains(modalOverlay)) {
                    document.body.removeChild(modalOverlay);
                }
            }, { once: true });
        };
        
        confirmButton.addEventListener('click', () => {
            onConfirm();
            closeModal();
        });
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                onCancel();
                closeModal();
            });
        }
        
        return { modalOverlay, modalContent, closeModal };
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
     */
    static showInput(options) {
        const {
            title = 'Entrada',
            message = '',
            fields = [],
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;
        
        // Create modal elements
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = title;
        
        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        // Add message if provided
        if (message) {
            const modalMessage = document.createElement('p');
            modalMessage.textContent = message;
            modalMessage.className = 'modal-message';
            modalBody.appendChild(modalMessage);
        }
        
        // Add input fields
        const inputElements = {};
        fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = field.label || '';
            
            let input;
            
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'form-textarea';
            } else if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-select';
                if (field.multiple) {
                    input.multiple = true;
                    input.classList.add('form-select-multiple');
                }
                
                if (field.options) {
                    field.options.forEach(option => {
                        const optionEl = document.createElement('option');
                        optionEl.value = option.value;
                        optionEl.textContent = option.text;
                        if (option.selected) {
                            optionEl.selected = true;
                        }
                        input.appendChild(optionEl);
                    });
                }
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.className = 'form-input';
            }
            
            // Common properties
            input.id = `modal-input-${field.id}`;
            input.name = field.id;
            input.placeholder = field.placeholder || '';
            input.value = field.value || '';
            input.required = field.required || false;
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            modalBody.appendChild(formGroup);
            
            inputElements[field.id] = input;
        });
        
        // Modal footer with buttons
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = cancelText;
        cancelButton.className = 'modal-cancel';
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = confirmText;
        confirmButton.className = 'modal-confirm';
        
        // Assemble modal
        modalHeader.appendChild(modalTitle);
        modalFooter.appendChild(cancelButton);
        modalFooter.appendChild(confirmButton);
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modalOverlay);
        
        // Trigger animation using CSS classes
        requestAnimationFrame(() => {
            modalOverlay.classList.add('modal-visible');
            modalContent.classList.add('modal-content-visible');
        });
        
        // Event listeners
        const closeModal = () => {
            modalOverlay.classList.remove('modal-visible');
            modalContent.classList.remove('modal-content-visible');
            
            // Remove from DOM after animation completes
            modalOverlay.addEventListener('transitionend', () => {
                if (document.body.contains(modalOverlay)) {
                    document.body.removeChild(modalOverlay);
                }
            }, { once: true });
        };
        
        confirmButton.addEventListener('click', () => {
            const values = {};
            Object.keys(inputElements).forEach(key => {
                if (inputElements[key].multiple && inputElements[key].tagName === 'SELECT') {
                    values[key] = Array.from(inputElements[key].selectedOptions).map(option => option.value);
                } else {
                    values[key] = inputElements[key].value;
                }
            });
            
            const close = onConfirm(values);
            if (close) closeModal();
        });
        
        cancelButton.addEventListener('click', () => {
            onCancel();
            closeModal();
        });
        
        return { modalOverlay, modalContent, inputElements, closeModal };
    }

    /**
     * Show a loading spinner
     * @param {string} message - Optional message to display with the spinner
     * @returns {Object} Spinner elements and a close function
     */
    static showLoading(message = '') {
        // Create spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.className = 'loading-spinner';

        // Create spinner element
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinnerOverlay.appendChild(spinner);

        // Add optional message
        if (message) {
            const spinnerMessage = document.createElement('p');
            spinnerMessage.textContent = message;
            spinnerMessage.className = 'spinner-message';
            spinnerOverlay.appendChild(spinnerMessage);
        }

        document.body.appendChild(spinnerOverlay);

        // Return a function to close the spinner
        const closeSpinner = () => {
            document.body.removeChild(spinnerOverlay);
        };

        return { spinnerOverlay, closeSpinner };
    }

    /**
     * Show a "Continue to iterate?" confirmation modal
     * @param {Object} options - Modal options
     * @param {string} options.title - Modal title
     * @param {string} options.message - Modal message
     * @param {string} options.confirmText - Text for confirm button
     * @param {string} options.cancelText - Text for cancel button
     * @param {Function} options.onConfirm - Callback for confirm action
     * @param {Function} options.onCancel - Callback for cancel action
     * @returns {Object} Modal elements
     */
    static showContinueIteration(options = {}) {
        const {
            title = 'Iteração',
            message = 'Continuar para próxima iteração?',
            confirmText = 'Continuar',
            cancelText = 'Finalizar',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;
        
        const { modalOverlay, modalContent, closeModal } = this.show({
            title,
            message,
            confirmText,
            cancelText,
            onConfirm,
            onCancel,
            type: 'default'
        });

        // Add special styling for continue iteration modal
        modalOverlay.classList.add('modal-continue-iterate');
        modalContent.classList.add('modal-content-continue-iterate');
        
        // Find confirm and cancel buttons and add special classes
        const confirmButton = modalContent.querySelector('.modal-confirm');
        const cancelButton = modalContent.querySelector('.modal-cancel');
        
        if (confirmButton) confirmButton.classList.add('modal-confirm-continue');
        if (cancelButton) cancelButton.classList.add('modal-cancel-continue');
        
        return { modalOverlay, modalContent, closeModal };
    }
}