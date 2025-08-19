/**
 * Class View
 * Handles UI rendering for classes and their students
 */
import ClassManager from '../helpers/class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class ClassView {
    constructor(isAuthenticated = false) {
        this.classManager = new ClassManager();
        this.isReadOnlyMode = !isAuthenticated; // Set based on initial auth state
    }
    
    /**
     * Initialize the UI components
     */
    async initialize() {
        await this.renderClassList();
        document.querySelector('#create-class-btn').addEventListener('click', async () => await this.createClass());
        document.querySelector('#import-students-btn').addEventListener('click', async () => await this.importStudents());
        document.querySelector('#add-student-btn')?.addEventListener('click', async () => await this.showAddStudentModal());
        document.querySelector('#class-bulk-action-btn')?.addEventListener('click', async () => await this.showClassBulkActionModal());

        document.addEventListener('studentBalanceUpdated', async () => await this.renderClassList());
        document.addEventListener('classSelectsUpdated', async () => {
            await this.updateClassSelects();
        });

        // Listen for read-only mode changes
        document.addEventListener('readOnlyModeChanged', async (event) => {
            this.isReadOnlyMode = event.detail.isReadOnly;
            await this.handleReadOnlyMode();
        });

        return this;
    }

    /**
     * Handle read-only mode changes for dynamically generated elements
     */
    async handleReadOnlyMode() {
        // Re-render the class list to apply read-only state to dynamic buttons
        await this.renderClassList();
    }

    /**
     * Create a new class
     */
    async createClass() {
        const classNameInput = document.querySelector('#class-name');
        const className = classNameInput.value.trim();

        if (!className) {
            Toast.show({ message: 'Por favor, insira um nome para a turma.', type: 'error' });
            return;
        }

        const result = await this.classManager.createClass(className);
        
        if (result) {
            Toast.show({ message: `Turma "${className}" criada com sucesso!`, type: 'success' });
            classNameInput.value = '';
            document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
            await this.renderClassList();
        } else {
            Toast.show({ message: `A turma "${className}" já existe.`, type: 'warning' });
        }
    }

    /**
     * Render the list of classes and their students
     */
    async renderClassList() {
        const classesList = document.querySelector('#classes-list');
        classesList.innerHTML = '';

        const classes = await this.classManager.getAllClasses(true);
        
        // Ensure classes is always an array
        const classesArray = Array.isArray(classes) ? classes : [];
        
        if (classesArray.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'student-list-empty';
            emptyMessage.textContent = 'Nenhuma turma cadastrada.';
            classesList.appendChild(emptyMessage);
            return;
        }
        
        // Sort classes alphabetically by name
        classesArray.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
        
        classesArray.forEach(classObj => {
            const classId = classObj.id;
            const className = classObj.name;
            const students = classObj.students || [];
            
            // Sort students alphabetically by name
            students.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
            
            const classCard = document.createElement('div');
            classCard.className = 'card';
            classCard.dataset.classId = classId;
            
            const classHeader = document.createElement('div');
            classHeader.className = 'class-header';
            
            // Create editable class name
            const classNameContainer = document.createElement('div');
            classNameContainer.className = 'class-name-container';
            
            const classNameDisplay = document.createElement('h4');
            classNameDisplay.textContent = className;
            classNameDisplay.className = 'class-name-display';
            
            classNameContainer.appendChild(classNameDisplay);
            
            // Only render edit button if not in read-only mode
            if (!this.isReadOnlyMode) {
                const editButton = document.createElement('button');
                editButton.innerHTML = '✏️';
                editButton.className = 'edit-class-name-btn';
                editButton.title = 'Renomear Turma';
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showRenameClassUI(classId, classNameContainer, className);
                });
                
                classNameContainer.appendChild(editButton);
            }
            
            const studentCountDisplay = document.createElement('p');
            studentCountDisplay.innerHTML = `<strong>${students.length}</strong> alunos`;
            
            classHeader.appendChild(classNameContainer);
            classHeader.appendChild(studentCountDisplay);
            
            // Class action buttons - only render if not in read-only mode
            const classActions = document.createElement('div');
            classActions.className = 'class-actions';
            
            if (!this.isReadOnlyMode) {
                // Bulk action button for entire class
                const bulkActionBtn = document.createElement('button');
                bulkActionBtn.textContent = 'Ações em Massa';
                bulkActionBtn.className = 'bulk-action-button';
                bulkActionBtn.addEventListener('click', async () => await this.showClassBulkActionModal(classId));
                
                // Add student button
                const addStudentBtn = document.createElement('button');
                addStudentBtn.textContent = 'Adicionar Aluno';
                addStudentBtn.className = 'add-student-button';
                addStudentBtn.addEventListener('click', async () => await this.showAddStudentModal(classId));
                
                classActions.appendChild(bulkActionBtn);
                classActions.appendChild(addStudentBtn);
            }
            
            const studentsList = document.createElement('ul');
            studentsList.className = 'student-list';
            
            students.forEach(student => {
                const listItem = document.createElement('li');
                listItem.className = 'student-list-item';
                
                // Student info container
                const studentInfo = document.createElement('div');
                studentInfo.className = 'student-info';
                
                // Create element for student name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'student-name';
                nameSpan.textContent = student.name;
                
                // Create element for student balance
                const balanceSpan = document.createElement('span');
                balanceSpan.className = 'student-balance';
                balanceSpan.textContent = `R$ ${student.currentBalance.toFixed(2)}`;
                
                // Add elements to student info
                studentInfo.appendChild(nameSpan);
                studentInfo.appendChild(balanceSpan);
                
                // Student actions container - only render if not in read-only mode
                const studentActions = document.createElement('div');
                studentActions.className = 'student-actions';
                
                if (!this.isReadOnlyMode) {
                    // Add balance button
                    const addBalanceBtn = document.createElement('button');
                    addBalanceBtn.innerHTML = '+';
                    addBalanceBtn.className = 'balance-action-button add-balance';
                    addBalanceBtn.title = 'Adicionar Saldo';
                    addBalanceBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await this.showBalanceActionModal(classId, student.id, 'add');
                    });
                    
                    // Remove balance button
                    const removeBalanceBtn = document.createElement('button');
                    removeBalanceBtn.innerHTML = '-';
                    removeBalanceBtn.className = 'balance-action-button remove-balance';
                    removeBalanceBtn.title = 'Remover Saldo';
                    removeBalanceBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await this.showBalanceActionModal(classId, student.id, 'remove');
                    });
                    
                    // Remove student button
                    const removeStudentBtn = document.createElement('button');
                    removeStudentBtn.innerHTML = '×';
                    removeStudentBtn.className = 'balance-action-button remove-student';
                    removeStudentBtn.title = 'Remover Aluno';
                    removeStudentBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await this.showRemoveStudentModal(classId, student.id, student.name);
                    });
                    
                    // Add buttons to actions
                    studentActions.appendChild(addBalanceBtn);
                    studentActions.appendChild(removeBalanceBtn);
                    studentActions.appendChild(removeStudentBtn);
                }
                
                // Add the elements to list item
                listItem.appendChild(studentInfo);
                listItem.appendChild(studentActions);
                
                studentsList.appendChild(listItem);
            });
            
            classCard.appendChild(classHeader);
            classCard.appendChild(classActions);
            classCard.appendChild(studentsList);
            
            // Delete class button - only render if not in read-only mode
            if (!this.isReadOnlyMode) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Excluir Turma';
                deleteBtn.className = 'delete-button';
                deleteBtn.addEventListener('click', () => {
                    Modal.show({
                        title: 'Confirmar Exclusão',
                        message: `Tem certeza que deseja excluir a turma "${className}"?`,
                        confirmText: 'Excluir',
                        cancelText: 'Cancelar',
                        type: 'danger',
                        onConfirm: async () => {
                            await this.classManager.deleteClass(classId);
                            await this.renderClassList();
                            document.dispatchEvent(new CustomEvent('classDeleted', { detail: { classId, className } }));
                            document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
                            Toast.show({ message: `Turma "${className}" excluída com sucesso.`, type: 'success' });
                        }
                    });
                });
                
                classCard.appendChild(deleteBtn);
            }
            
            classesList.appendChild(classCard);
        });

        this.updateClassSelects();
    }

    /**
     * Show in-place UI for renaming a class
     * @param {string} classId - The ID of the class to rename
     * @param {HTMLElement} container - The container element to add the rename UI to
     * @param {string} currentName - The current name of the class
     */
    showRenameClassUI(classId, container, currentName) {
        // Clear the container
        container.innerHTML = '';
        
        // Create the input field
        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = currentName;
        inputField.className = 'rename-class-input';
        
        // Create the save button
        const saveButton = document.createElement('button');
        saveButton.textContent = '✓';
        saveButton.className = 'rename-class-save';
        saveButton.title = 'Salvar';
        
        // Create the cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '✕';
        cancelButton.className = 'rename-class-cancel';
        cancelButton.title = 'Cancelar';
        
        // Add the elements to the container
        container.appendChild(inputField);
        container.appendChild(saveButton);
        container.appendChild(cancelButton);
        
        // Focus the input field
        inputField.focus();
        inputField.select();
        
        // Handle save button click
        saveButton.addEventListener('click', async () => {
            const newName = inputField.value.trim();
            await this.saveClassRename(classId, currentName, newName, container);
        });
        
        // Handle cancel button click
        cancelButton.addEventListener('click', () => {
            this.cancelClassRename(container, currentName);
        });
        
        // Handle Enter key press
        inputField.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const newName = inputField.value.trim();
                await this.saveClassRename(classId, currentName, newName, container);
            } else if (e.key === 'Escape') {
                this.cancelClassRename(container, currentName);
            }
        });
    }
    
    /**
     * Save a class rename
     * @param {string} classId - The ID of the class
     * @param {string} oldName - The old name of the class
     * @param {string} newName - The new name for the class
     * @param {HTMLElement} container - The container element with the rename UI
     */
    async saveClassRename(classId, oldName, newName, container) {
        if (!newName) {
            Toast.show({ message: 'O nome da turma não pode estar vazio.', type: 'error' });
            return;
        }
        
        if (newName === oldName) {
            // No change, just restore the display
            this.cancelClassRename(container, oldName);
            return;
        }
        
        const success = await this.classManager.renameClass(classId, newName);
        
        if (success) {
            // Update the UI
            Toast.show({ message: `Turma renomeada de "${oldName}" para "${newName}".`, type: 'success' });
            await this.renderClassList();
            document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
        } else {
            Toast.show({ message: `Já existe uma turma com o nome "${newName}".`, type: 'error' });
            // Restore the display
            this.cancelClassRename(container, oldName);
        }
    }
    
    /**
     * Cancel a class rename and restore the display
     * @param {HTMLElement} container - The container element with the rename UI
     * @param {string} originalName - The original name to display
     */
    cancelClassRename(container, originalName) {
        // Clear the container
        container.innerHTML = '';
        
        // Restore the original name display
        const classNameDisplay = document.createElement('h4');
        classNameDisplay.textContent = originalName;
        classNameDisplay.className = 'class-name-display';
        
        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️';
        editButton.className = 'edit-class-name-btn';
        editButton.title = 'Renomear Turma';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const classId = container.closest('.card').dataset.classId;
            this.showRenameClassUI(classId, container, originalName);
        });
        
        container.appendChild(classNameDisplay);
        container.appendChild(editButton);
    }

    /**
     * Import students from CSV input
     */
    async importStudents() {
        const classSelect = document.querySelector('#class-select');
        const studentCsvInput = document.querySelector('#student-csv');
        const studentInitialBalanceInput = document.querySelector('#student-initial-balance');

        const classId = classSelect.value;
        const csvString = studentCsvInput.value.trim();
        const initialBalance = parseFloat(studentInitialBalanceInput.value) || 0;
        
        if (!classId) {
            Toast.show({ message: 'Por favor, selecione uma turma.', type: 'error' });
            return;
        }
        
        if (!csvString) {
            Toast.show({ message: 'Por favor, insira pelo menos um nome de aluno.', type: 'error' });
            return;
        }
        
        const classObj = await this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        const addedCount = await this.classManager.addStudentsFromCSV(classId, csvString, initialBalance);
        
        if (addedCount > 0) {
            Toast.show({ message: `${addedCount} aluno(s) adicionado(s) à turma "${className}".`, type: 'success' });
            studentCsvInput.value = '';
            studentInitialBalanceInput.value = '';
            await this.renderClassList();
        } else {
            Toast.show({ message: 'Nenhum aluno foi adicionado. Verifique o formato da entrada.', type: 'error' });
        }
    }

    /**
     * Show a modal for adding a new student to a class
     * @param {string} classId - The ID of the class to add student to
     */
    async showAddStudentModal(classId) {
        const classObj = await this.classManager.getClassById(classId);
        if (!classObj) return;
        
        const className = classObj.name;
        
        Modal.showInput({
            title: 'Adicionar Aluno',
            message: `Adicione um novo aluno à turma "${className}"`,
            fields: [
                {
                    id: 'studentName',
                    label: 'Nome do Aluno',
                    type: 'text',
                    placeholder: 'Digite o nome do aluno',
                    required: true
                },
                {
                    id: 'initialBalance',
                    label: 'Saldo Inicial',
                    type: 'number',
                    placeholder: '0.00',
                    value: '0'
                }
            ],
            confirmText: 'Adicionar',
            cancelText: 'Cancelar',
            onConfirm: async (values) => {
                const studentName = values.studentName.trim();
                const initialBalance = parseFloat(values.initialBalance) || 0;
                
                if (!studentName) {
                    Toast.show({ message: 'Por favor, insira um nome para o aluno.', type: 'error' });
                    return false;
                }
                
                await this.classManager.addStudent(classId, studentName, initialBalance);
                Toast.show({ message: `Aluno "${studentName}" adicionado à turma "${className}" com saldo inicial de R$ ${initialBalance.toFixed(2)}.`, type: 'success' });
                await this.renderClassList();
                
                return true;
            }
        });
    }

    /**
     * Show a modal for adjusting a student's balance
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student
     * @param {string} action - Either 'add' or 'remove'
     */
    async showBalanceActionModal(classId, studentId, action) {
        const students = await this.classManager.getStudents(classId);
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        const classObj = await this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        const isAdding = action === 'add';
        const title = isAdding ? 'Adicionar Saldo' : 'Remover Saldo';
        const actionText = isAdding ? 'Adicionar' : 'Remover';
        
        Modal.showInput({
            title: title,
            message: `${actionText} saldo para o aluno "${student.name}"`,
            fields: [
                {
                    id: 'amount',
                    label: 'Valor (R$)',
                    type: 'number',
                    placeholder: '0.00',
                    required: true
                }
            ],
            confirmText: actionText,
            cancelText: 'Cancelar',
            onConfirm: async (values) => {
                const amount = parseFloat(values.amount);
                
                if (isNaN(amount) || amount <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor positivo válido.', type: 'error' });
                    return false;
                }
                
                if (!isAdding && amount > student.currentBalance) {
                    Toast.show({ message: `O aluno não possui saldo suficiente (R$ ${student.currentBalance.toFixed(2)}) para deduzir R$ ${amount.toFixed(2)}.`, type: 'error' });
                    return false;
                }
                
                const success = await this.classManager.modifyStudentBalance(classId, studentId, amount, action);
                
                if (success) {
                    await this.renderClassList();
                    
                    const message = isAdding 
                        ? `Saldo de R$ ${amount.toFixed(2)} adicionado ao aluno "${student.name}".`
                        : `Saldo de R$ ${amount.toFixed(2)} removido do aluno "${student.name}".`;
                    
                    Toast.show({ message, type: 'success' });
                    
                    document.dispatchEvent(new CustomEvent('studentBalanceUpdated', {
                        detail: {
                            studentIds: [student.id],
                            className: className,
                            classId: classId
                        }
                    }));
                    
                    return true;
                }
                
                return false;
            }
        });
    }

    /**
     * Show a modal for confirming student removal
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student to remove
     * @param {string} studentName - The name of the student
     */
    async showRemoveStudentModal(classId, studentId, studentName) {
        const classObj = await this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        Modal.show({
            title: 'Remover Aluno',
            message: `Tem certeza que deseja remover o aluno "${studentName}" da turma "${className}"?`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            type: 'danger',
            onConfirm: async () => {
                const removed = await this.classManager.removeStudent(classId, studentId);
                if (removed) {
                    Toast.show({ message: `Aluno "${studentName}" removido da turma "${className}".`, type: 'success' });
                    await this.renderClassList();
                } else {
                    Toast.show({ message: 'Não foi possível remover o aluno.', type: 'error' });
                }
            }
        });
    }

    /**
     * Show modal for bulk actions on a class
     * @param {string} classId - The ID of the class
     */
    async showClassBulkActionModal(classId) {
        const students = await this.classManager.getStudents(classId);
        if (!students || students.length === 0) {
            Toast.show({ message: 'Esta turma não possui alunos.', type: 'warning' });
            return;
        }
        
        const classObj = await this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        Modal.showInput({
            title: 'Ações em Massa',
            message: `Aplicar ação em massa para todos os alunos da turma "${className}"`,
            fields: [
                {
                    id: 'action',
                    label: 'Ação',
                    type: 'select',
                    options: [
                        { value: 'add', text: 'Adicionar saldo' },
                        { value: 'remove', text: 'Remover saldo' }
                    ]
                },
                {
                    id: 'amount',
                    label: 'Valor (R$)',
                    type: 'number',
                    placeholder: '0.00',
                    required: true
                }
            ],
            confirmText: 'Aplicar',
            cancelText: 'Cancelar',
            onConfirm: async (values) => {
                const action = values.action;
                const amount = parseFloat(values.amount);
                
                if (isNaN(amount) || amount <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor positivo válido.', type: 'error' });
                    return false;
                }
                
                const result = await this.classManager.applyBulkAction(classId, action, amount);
                const { successCount, failCount, studentIds } = result;
                
                const isAdding = action === 'add';
                const actionText = isAdding ? 'adicionado a' : 'removido de';
                
                if (successCount > 0) {
                    const message = `Saldo de R$ ${amount.toFixed(2)} ${actionText} ${successCount} alunos.`;
                    Toast.show({ message, type: 'success' });
                    
                    document.dispatchEvent(new CustomEvent('studentBalanceUpdated', {
                        detail: {
                            studentIds,
                            className,
                            classId
                        }
                    }));
                }
                
                if (failCount > 0) {
                    const failMessage = `Não foi possível ${isAdding ? 'adicionar' : 'remover'} saldo para ${failCount} alunos.`;
                    Toast.show({ message: failMessage, type: 'warning' });
                }
                
                return true;
            }
        });
    }

    /**
     * Update class select dropdowns
     */
    async updateClassSelects() {
        const classes = await this.classManager.getAllClasses();
        
        // Ensure classes is always an array
        const classesArray = Array.isArray(classes) ? classes : [];
        
        // Sort classes alphabetically by name
        classesArray.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
        
        // Update class select
        // Store the current selection
        const classSelect = document.querySelector('#class-select');
        if (!classSelect) return;
        const currentSelection = classSelect.value;
        
        // Clear options except the placeholder
        while (classSelect.options.length > 1) {
            classSelect.options.remove(1);
        }
        
        // Add class options
        classesArray.forEach(classObj => {
            const option = document.createElement('option');
            option.value = classObj.id;
            option.textContent = classObj.name;
            classSelect.appendChild(option);
        });
        
        // Restore selection if possible
        const classExists = Array.isArray(classesArray) && classesArray.some(c => c.id === currentSelection);
        if (classExists) {
            classSelect.value = currentSelection;
        }        
    }
}