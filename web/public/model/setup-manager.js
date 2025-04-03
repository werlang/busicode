/**
 * Setup Manager
 * Manages the creation and management of classes and students
 */
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class SetupManager {
    constructor(classManager) {
        this.classManager = classManager;
        
        // Initialize UI elements
        this.initializeUI();
    }

    /**
     * Initialize UI elements for setup management
     */
    initializeUI() {
        // Class management elements
        this.createClassBtn = document.getElementById('create-class-btn');
        this.classNameInput = document.getElementById('class-name');
        this.classSelect = document.getElementById('class-select');
        this.studentCsvInput = document.getElementById('student-csv');
        this.importStudentsBtn = document.getElementById('import-students-btn');
        this.classesList = document.getElementById('classes-list');
        this.studentInitialBalanceInput = document.getElementById('student-initial-balance');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial data
        this.renderClassList();
    }

    /**
     * Set up event listeners for class management
     */
    setupEventListeners() {
        this.createClassBtn.addEventListener('click', () => this.createClass());
        this.importStudentsBtn.addEventListener('click', () => this.importStudents());
    }

    /**
     * Create a new class
     */
    createClass() {
        const className = this.classNameInput.value.trim();
        
        if (!className) {
            Toast.show({ message: 'Por favor, insira um nome para a turma.', type: 'error' });
            return;
        }
        
        if (this.classManager.createClass(className)) {
            Toast.show({ message: `Turma "${className}" criada com sucesso!`, type: 'success' });
            this.classNameInput.value = '';
            this.renderClassList();
            this.updateClassSelects();
            document.dispatchEvent(new CustomEvent('classListUpdated'));
        } else {
            Toast.show({ message: `A turma "${className}" já existe.`, type: 'warning' });
        }
    }

    /**
     * Import students from CSV input
     */
    importStudents() {
        const className = this.classSelect.value;
        const csvString = this.studentCsvInput.value.trim();
        const initialBalance = parseFloat(this.studentInitialBalanceInput.value) || 0;
        
        if (!className) {
            Toast.show({ message: 'Por favor, selecione uma turma.', type: 'error' });
            return;
        }
        
        if (!csvString) {
            Toast.show({ message: 'Por favor, insira pelo menos um nome de aluno.', type: 'error' });
            return;
        }
        
        const addedCount = this.classManager.addStudentsFromCSV(className, csvString, initialBalance);
        
        if (addedCount > 0) {
            Toast.show({ message: `${addedCount} alunos adicionados à turma "${className}" com saldo inicial de R$ ${initialBalance.toFixed(2)}.`, type: 'success' });
            this.studentCsvInput.value = '';
            this.renderClassList();
            document.dispatchEvent(new CustomEvent('studentListUpdated', { detail: { className } }));
        } else {
            Toast.show({ message: 'Nenhum aluno foi adicionado. Verifique o formato da entrada.', type: 'error' });
        }
    }

    /**
     * Update class select dropdowns
     */
    updateClassSelects() {
        const classNames = this.classManager.getClassNames();
        
        // Update class select
        // Store the current selection
        const currentSelection = this.classSelect.value;
        
        // Clear options except the placeholder
        while (this.classSelect.options.length > 1) {
            this.classSelect.options.remove(1);
        }
        
        // Add class options
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            this.classSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
            this.classSelect.value = currentSelection;
        }
        
        // Notify other components that class list has changed
        document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
    }

    /**
     * Render the list of classes and their students
     */
    renderClassList() {
        this.classesList.innerHTML = '';
        
        const classNames = this.classManager.getClassNames();
        
        if (classNames.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'student-list-empty';
            emptyMessage.textContent = 'Nenhuma turma cadastrada.';
            this.classesList.appendChild(emptyMessage);
            return;
        }
        
        classNames.forEach(className => {
            const students = this.classManager.getStudents(className);
            
            const classCard = document.createElement('div');
            classCard.className = 'card';
            
            const classHeader = document.createElement('div');
            classHeader.className = 'class-header';
            classHeader.innerHTML = `
                <h4>${className}</h4>
                <p><strong>${students.length}</strong> alunos</p>
            `;
            
            const studentsList = document.createElement('ul');
            studentsList.className = 'student-list';
            
            students.forEach(student => {
                const listItem = document.createElement('li');
                listItem.className = 'student-list-item';
                
                // Criar elemento para o nome do aluno
                const nameSpan = document.createElement('span');
                nameSpan.className = 'student-name';
                nameSpan.textContent = student.name;
                
                // Criar elemento para o saldo do aluno
                const balanceSpan = document.createElement('span');
                balanceSpan.className = 'student-balance';
                balanceSpan.textContent = `R$ ${student.currentBalance.toFixed(2)}`;
                
                // Adicionar os elementos ao item da lista
                listItem.appendChild(nameSpan);
                listItem.appendChild(balanceSpan);
                
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
                        this.classManager.deleteClass(className);
                        this.renderClassList();
                        this.updateClassSelects();
                        document.dispatchEvent(new CustomEvent('classDeleted', { detail: { className } }));
                        Toast.show({ message: `Turma "${className}" excluída com sucesso.`, type: 'success' });
                    }
                });
            });
            
            classCard.appendChild(classHeader);
            classCard.appendChild(studentsList);
            classCard.appendChild(deleteBtn);
            
            this.classesList.appendChild(classCard);
        });
    }
}