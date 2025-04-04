/**
 * Class Manager
 * Manages classes and students in the BusiCode application
 */
import Storage from './storage.js';
import Student from '../model/student.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

// TODO; create a button to remove students individually from the class list card

export default class ClassManager {
    constructor() {
        this.storage = new Storage('busicode_classes');
        this.loadClasses();
    }
    
    /**
     * Initialize the UI components
     */
    initialize() {
        this.renderClassList();
        document.querySelector('#create-class-btn').addEventListener('click', () => this.createClass());
        document.querySelector('#import-students-btn').addEventListener('click', () => this.importStudents());
    }

    /**
     * Load classes from storage
     * @returns {Object} An object containing all classes and their students
     */
    loadClasses() {
        const classData = this.storage.loadData() || {};
        // Convert plain objects to Student instances
        for (const className in classData) {
            classData[className] = classData[className].map(student => new Student(student.id, student.name, student.initialBalance));
        }
        this.classes = classData;
        return classData;
    }

    /**
     * Save classes to storage
     */
    saveClasses() {
        this.storage.saveData(this.classes);
    }

    /**
     * Create a new class
     * @returns {boolean} True if successful, false if class already exists
     */
    createClass() {
        const classNameInput = document.querySelector('#class-name');
        const className = classNameInput.value.trim();

        if (!className) {
            Toast.show({ message: 'Por favor, insira um nome para a turma.', type: 'error' });
            return;
        }

        if (className && !this.classes[className]) {
            this.classes[className] = [];
            this.saveClasses();
            
            Toast.show({ message: `Turma "${className}" criada com sucesso!`, type: 'success' });
            classNameInput.value = '';
            document.dispatchEvent(new CustomEvent('classListUpdated'));
            console.log(this.classes);
            this.renderClassList();
            return true;
        }
        
        Toast.show({ message: `A turma "${className}" já existe.`, type: 'warning' });
        return false;
    }

    /**
     * Render the list of classes and their students
     */
    renderClassList() {
        const classesList = document.querySelector('#classes-list');
        classesList.innerHTML = '';
        
        const classNames = this.getClassNames();
        
        if (classNames.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'student-list-empty';
            emptyMessage.textContent = 'Nenhuma turma cadastrada.';
            classesList.appendChild(emptyMessage);
            return;
        }
        
        classNames.forEach(className => {
            const students = this.getStudents(className);
            
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
                        this.deleteClass(className);
                        this.renderClassList();
                        document.dispatchEvent(new CustomEvent('classDeleted', { detail: { className } }));
                        Toast.show({ message: `Turma "${className}" excluída com sucesso.`, type: 'success' });
                    }
                });
            });
            
            classCard.appendChild(classHeader);
            classCard.appendChild(studentsList);
            classCard.appendChild(deleteBtn);
            
            classesList.appendChild(classCard);
        });

        this.updateClassSelects();
    }

    /**
     * Update class select dropdowns
     */
    updateClassSelects() {
        const classNames = this.getClassNames();
        
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
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
            classSelect.value = currentSelection;
        }
        
        // Notify other components that class list has changed
        document.dispatchEvent(new CustomEvent('classSelectsUpdated'));
    }

    /**
     * Get all class names
     * @returns {string[]} Array of class names
     */
    getClassNames() {
        return Object.keys(this.classes);
    }

    /**
     * Get students from a specific class
     * @param {string} className - The name of the class
     * @returns {Student[]} Array of students in the class
     */
    getStudents(className) {
        return this.classes[className] || [];
    }

    /**
     * Add students to a class from CSV string
     * @param {string} className - The name of the class
     * @param {string} csvString - Comma-separated string of student names
     * @param {number} initialBalance - Initial balance for each student
     * @returns {number} Number of students added
     */
    addStudentsFromCSV(className, csvString, initialBalance = 0) {
        if (!this.classes[className]) return 0;
        
        // Parse CSV and create new students
        const names = csvString.split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        let addedCount = 0;
        
        names.forEach(name => {
            // Generate a unique ID for the student
            const id = `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            this.classes[className].push(new Student(id, name, initialBalance));
            addedCount++;
        });
        
        this.saveClasses();
        return addedCount;
    }

    /**
     * Remove a student from a class
     * @param {string} className - The name of the class
     * @param {string} studentId - The ID of the student to remove
     * @returns {boolean} True if successful, false if student not found
     */
    removeStudent(className, studentId) {
        if (!this.classes[className]) return false;
        
        const initialLength = this.classes[className].length;
        this.classes[className] = this.classes[className].filter(student => student.id !== studentId);
        
        if (initialLength !== this.classes[className].length) {
            this.saveClasses();
            return true;
        }
        return false;
    }

    /**
     * Delete a class
     * @param {string} className - The name of the class to delete
     * @returns {boolean} True if successful, false if class not found
     */
    deleteClass(className) {
        if (this.classes[className]) {
            delete this.classes[className];
            this.saveClasses();
            return true;
        }
        return false;
    }

    /**
     * Import students from CSV input
     */
    importStudents() {
        const classSelect = document.querySelector('#class-select');
        const studentCsvInput = document.querySelector('#student-csv');
        const studentInitialBalanceInput = document.querySelector('#student-initial-balance');

        const className = classSelect.value;
        const csvString = studentCsvInput.value.trim();
        const initialBalance = parseFloat(studentInitialBalanceInput.value) || 0;
        
        if (!className) {
            Toast.show({ message: 'Por favor, selecione uma turma.', type: 'error' });
            return;
        }
        
        if (!csvString) {
            Toast.show({ message: 'Por favor, insira pelo menos um nome de aluno.', type: 'error' });
            return;
        }
        
        const addedCount = this.addStudentsFromCSV(className, csvString, initialBalance);
        
        if (addedCount > 0) {
            Toast.show({ message: `${addedCount} alunos adicionados à turma "${className}" com saldo inicial de R$ ${initialBalance.toFixed(2)}.`, type: 'success' });
            studentCsvInput.value = '';
            studentInitialBalanceInput.value = 0;
            this.renderClassList();
            document.dispatchEvent(new CustomEvent('studentListUpdated', { detail: { className } }));
        } else {
            Toast.show({ message: 'Nenhum aluno foi adicionado. Verifique o formato da entrada.', type: 'error' });
        }
    }
}