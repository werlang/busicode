/**
 * Class View
 * Handles UI rendering for classes and students in the BusiCode application
 */
import ClassManager from '../helpers/class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class ClassView {
    constructor() {
        this.classManager = new ClassManager();
    }
    
    /**
     * Initialize the UI components
     */
    initialize() {
        this.renderClassList();
        document.querySelector('#create-class-btn').addEventListener('click', () => this.createClass());
        document.querySelector('#import-students-btn').addEventListener('click', () => this.importStudents());
        document.querySelector('#add-student-btn')?.addEventListener('click', () => this.showAddStudentModal());
        document.querySelector('#class-bulk-action-btn')?.addEventListener('click', () => this.showClassBulkActionModal());

        document.addEventListener('studentBalanceUpdated', () => this.renderClassList());

        return this;
    }

    /**
     * Create a new class
     */
    createClass() {
        const classNameInput = document.querySelector('#class-name');
        const className = classNameInput.value.trim();

        if (!className) {
            Toast.show({ message: 'Por favor, insira um nome para a turma.', type: 'error' });
            return;
        }

        const result = this.classManager.createClass(className);
        
        if (result) {
            Toast.show({ message: `Turma "${className}" criada com sucesso!`, type: 'success' });
            classNameInput.value = '';
            document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
            this.renderClassList();
        } else {
            Toast.show({ message: `A turma "${className}" já existe.`, type: 'warning' });
        }
    }

    /**
     * Render the list of classes and their students
     */
    renderClassList() {
        const classesList = document.querySelector('#classes-list');
        classesList.innerHTML = '';
        
        const classes = this.classManager.getAllClasses();
        
        if (classes.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'student-list-empty';
            emptyMessage.textContent = 'Nenhuma turma cadastrada.';
            classesList.appendChild(emptyMessage);
            return;
        }
        
        classes.forEach(classObj => {
            const classId = classObj.id;
            const className = classObj.name;
            const students = classObj.students || [];
            
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
            
            const editButton = document.createElement('button');
            editButton.innerHTML = '✏️';
            editButton.className = 'edit-class-name-btn';
            editButton.title = 'Renomear Turma';
            editButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showRenameClassUI(classId, classNameContainer, className);
            });
            
            classNameContainer.appendChild(classNameDisplay);
            classNameContainer.appendChild(editButton);
            
            const studentCountDisplay = document.createElement('p');
            studentCountDisplay.innerHTML = `<strong>${students.length}</strong> alunos`;
            
            classHeader.appendChild(classNameContainer);
            classHeader.appendChild(studentCountDisplay);
            
            // Class action buttons
            const classActions = document.createElement('div');
            classActions.className = 'class-actions';
            
            // Bulk action button for entire class
            const bulkActionBtn = document.createElement('button');
            bulkActionBtn.textContent = 'Ações em Massa';
            bulkActionBtn.className = 'bulk-action-button';
            bulkActionBtn.addEventListener('click', () => this.showClassBulkActionModal(classId));
            
            // Add student button
            const addStudentBtn = document.createElement('button');
            addStudentBtn.textContent = 'Adicionar Aluno';
            addStudentBtn.className = 'add-student-button';
            addStudentBtn.addEventListener('click', () => this.showAddStudentModal(classId));
            
            classActions.appendChild(bulkActionBtn);
            classActions.appendChild(addStudentBtn);
            
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
                
                // Student actions container
                const studentActions = document.createElement('div');
                studentActions.className = 'student-actions';
                
                // Add balance button
                const addBalanceBtn = document.createElement('button');
                addBalanceBtn.innerHTML = '+';
                addBalanceBtn.className = 'balance-action-button add-balance';
                addBalanceBtn.title = 'Adicionar Saldo';
                addBalanceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showBalanceActionModal(classId, student.id, 'add');
                });
                
                // Remove balance button
                const removeBalanceBtn = document.createElement('button');
                removeBalanceBtn.innerHTML = '-';
                removeBalanceBtn.className = 'balance-action-button remove-balance';
                removeBalanceBtn.title = 'Remover Saldo';
                removeBalanceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showBalanceActionModal(classId, student.id, 'remove');
                });
                
                // Remove student button
                const removeStudentBtn = document.createElement('button');
                removeStudentBtn.innerHTML = '×';
                removeStudentBtn.className = 'balance-action-button remove-student';
                removeStudentBtn.title = 'Remover Aluno';
                removeStudentBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showRemoveStudentModal(classId, student.id, student.name);
                });
                
                // Add buttons to actions
                studentActions.appendChild(addBalanceBtn);
                studentActions.appendChild(removeBalanceBtn);
                studentActions.appendChild(removeStudentBtn);
                
                // Add the elements to list item
                listItem.appendChild(studentInfo);
                listItem.appendChild(studentActions);
                
                studentsList.appendChild(listItem);
            });
            
            // Delete class button
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
                    onConfirm: () => {
                        this.classManager.deleteClass(classId);
                        this.renderClassList();
                        document.dispatchEvent(new CustomEvent('classDeleted', { detail: { classId, className } }));
                        Toast.show({ message: `Turma "${className}" excluída com sucesso.`, type: 'success' });
                    }
                });
            });
            
            classCard.appendChild(classHeader);
            classCard.appendChild(classActions);
            classCard.appendChild(studentsList);
            classCard.appendChild(deleteBtn);
            
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
        saveButton.addEventListener('click', () => {
            const newName = inputField.value.trim();
            this.saveClassRename(classId, currentName, newName, container);
        });
        
        // Handle cancel button click
        cancelButton.addEventListener('click', () => {
            this.cancelClassRename(container, currentName);
        });
        
        // Handle Enter key press
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newName = inputField.value.trim();
                this.saveClassRename(classId, currentName, newName, container);
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
    saveClassRename(classId, oldName, newName, container) {
        if (!newName) {
            Toast.show({ message: 'O nome da turma não pode estar vazio.', type: 'error' });
            return;
        }
        
        if (newName === oldName) {
            // No change, just restore the display
            this.cancelClassRename(container, oldName);
            return;
        }
        
        const success = this.classManager.renameClass(classId, newName);
        
        if (success) {
            // Update the UI
            Toast.show({ message: `Turma renomeada de "${oldName}" para "${newName}".`, type: 'success' });
            this.renderClassList();
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
    importStudents() {
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
        
        const classObj = this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        const addedCount = this.classManager.addStudentsFromCSV(classId, csvString, initialBalance);
        
        if (addedCount > 0) {
            Toast.show({ message: `${addedCount} alunos adicionados à turma "${className}" com saldo inicial de R$ ${initialBalance.toFixed(2)}.`, type: 'success' });
            studentCsvInput.value = '';
            this.renderClassList();
        } else {
            Toast.show({ message: 'Nenhum aluno foi adicionado. Verifique o formato da entrada.', type: 'error' });
        }
    }

    /**
     * Show a modal for adding a new student to a class
     * @param {string} classId - The ID of the class to add student to
     */
    showAddStudentModal(classId) {
        const classObj = this.classManager.getClassById(classId);
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
            onConfirm: (values) => {
                const studentName = values.studentName.trim();
                const initialBalance = parseFloat(values.initialBalance) || 0;
                
                if (!studentName) {
                    Toast.show({ message: 'Por favor, insira um nome para o aluno.', type: 'error' });
                    return false;
                }
                
                this.classManager.addStudent(classId, studentName, initialBalance);
                Toast.show({ message: `Aluno "${studentName}" adicionado à turma "${className}" com saldo inicial de R$ ${initialBalance.toFixed(2)}.`, type: 'success' });
                this.renderClassList();
                
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
    showBalanceActionModal(classId, studentId, action) {
        const students = this.classManager.getStudents(classId);
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        const classObj = this.classManager.getClassById(classId);
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
            onConfirm: (values) => {
                const amount = parseFloat(values.amount);
                
                if (isNaN(amount) || amount <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor positivo válido.', type: 'error' });
                    return false;
                }
                
                if (!isAdding && amount > student.currentBalance) {
                    Toast.show({ message: `O aluno não possui saldo suficiente (R$ ${student.currentBalance.toFixed(2)}) para deduzir R$ ${amount.toFixed(2)}.`, type: 'error' });
                    return false;
                }
                
                const success = this.classManager.modifyStudentBalance(classId, studentId, amount, action);
                
                if (success) {
                    this.renderClassList();
                    
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
    showRemoveStudentModal(classId, studentId, studentName) {
        const classObj = this.classManager.getClassById(classId);
        const className = classObj ? classObj.name : classId;
        
        Modal.show({
            title: 'Remover Aluno',
            message: `Tem certeza que deseja remover o aluno "${studentName}" da turma "${className}"?`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            type: 'danger',
            onConfirm: () => {
                const removed = this.classManager.removeStudent(classId, studentId);
                if (removed) {
                    Toast.show({ message: `Aluno "${studentName}" removido da turma "${className}".`, type: 'success' });
                    this.renderClassList();
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
    showClassBulkActionModal(classId) {
        const students = this.classManager.getStudents(classId);
        if (!students || students.length === 0) {
            Toast.show({ message: 'Esta turma não possui alunos.', type: 'warning' });
            return;
        }
        
        const classObj = this.classManager.getClassById(classId);
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
            onConfirm: (values) => {
                const action = values.action;
                const amount = parseFloat(values.amount);
                
                if (isNaN(amount) || amount <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor positivo válido.', type: 'error' });
                    return false;
                }
                
                const result = this.classManager.applyBulkAction(classId, action, amount);
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
                
                this.renderClassList();
                return true;
            }
        });
    }

    /**
     * Update class select dropdowns
     */
    updateClassSelects() {
        const classes = this.classManager.getAllClasses();
        
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
        classes.forEach(classObj => {
            const option = document.createElement('option');
            option.value = classObj.id;
            option.textContent = classObj.name;
            classSelect.appendChild(option);
        });
        
        // Restore selection if possible
        const classExists = classes.some(c => c.id === currentSelection);
        if (classExists) {
            classSelect.value = currentSelection;
        }
        
        // Notify other components that class list has changed
        document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
    }
}