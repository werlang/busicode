/**
 * UI Manager
 * Manages the user interface for the BusiCode application
 */
import Company from './company.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class UIManager {
    constructor(classManager, companyManager) {
        this.classManager = classManager;
        this.companyManager = companyManager;
        // Initialize UI elements
        this.initializeUI();
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Class management
        this.createClassBtn = document.getElementById('create-class-btn');
        this.classNameInput = document.getElementById('class-name');
        this.classSelect = document.getElementById('class-select');
        this.studentCsvInput = document.getElementById('student-csv');
        this.importStudentsBtn = document.getElementById('import-students-btn');
        this.classesList = document.getElementById('classes-list');
        this.studentInitialBalanceInput = document.getElementById('student-initial-balance');
        
        // Company management
        this.companyClassSelect = document.getElementById('company-class-select');
        this.companyNameInput = document.getElementById('company-name');
        this.companyStudentsSelect = document.getElementById('company-students');
        this.studentContributionsContainer = document.getElementById('student-contributions');
        this.createCompanyBtn = document.getElementById('create-company-btn');
        this.companiesList = document.getElementById('companies-list');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial data
        this.renderClassList();
        this.updateClassSelects();
        this.renderCompanyList();
    }

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Class management
        this.createClassBtn.addEventListener('click', () => this.createClass());
        this.importStudentsBtn.addEventListener('click', () => this.importStudents());
        
        // Company management
        this.createCompanyBtn.addEventListener('click', () => this.createCompany());
        this.companyClassSelect.addEventListener('change', () => this.updateStudentSelect());
        
        // Update UI on class selection change
        this.classSelect.addEventListener('change', () => this.updateCompanyList());
        
        // Student contributions update
        this.companyStudentsSelect.addEventListener('change', () => this.updateStudentContributions());
    }

    /**
     * Create a new class from form inputs
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
            this.updateStudentSelect();
        } else {
            Toast.show({ message: 'Nenhum aluno foi adicionado. Verifique o formato da entrada.', type: 'error' });
        }
    }

    /**
     * Create a new company from form inputs
     */
    createCompany() {
        const className = this.companyClassSelect.value;
        const companyName = this.companyNameInput.value.trim();
        
        // Get selected student IDs
        const selectedStudentIds = Array.from(this.companyStudentsSelect.selectedOptions).map(option => option.value);
        
        if (!className) {
            Toast.show({ message: 'Por favor, selecione uma turma.', type: 'error' });
            return;
        }
        
        if (!companyName) {
            Toast.show({ message: 'Por favor, insira um nome para a empresa.', type: 'error' });
            return;
        }
        
        if (selectedStudentIds.length === 0) {
            Toast.show({ message: 'Por favor, selecione pelo menos um aluno para a empresa.', type: 'error' });
            return;
        }
        
        // Coletar as contribuições individuais
        const memberContributions = {};
        let totalContribution = 0;
        const students = this.classManager.getStudents(className);
        
        // Verificar se cada aluno tem saldo suficiente para sua contribuição
        let insufficientFunds = false;
        
        selectedStudentIds.forEach(studentId => {
            const contributionInput = document.getElementById(`contribution-${studentId}`);
            if (!contributionInput) return;
            
            const contribution = parseFloat(contributionInput.value) || 0;
            memberContributions[studentId] = contribution;
            totalContribution += contribution;
            
            // Verificar se o aluno tem saldo suficiente
            const student = students.find(s => s.id === studentId);
            if (student && contribution > student.currentBalance) {
                insufficientFunds = true;
                Toast.show({ message: `Aluno ${student.name} não tem saldo suficiente para contribuir R$ ${contribution.toFixed(2)}`, type: 'error' });
            }
        });
        
        if (insufficientFunds) {
            return;
        }
        
        if (totalContribution <= 0) {
            Toast.show({ message: 'É necessário que pelo menos um aluno faça uma contribuição para a empresa.', type: 'error' });
            return;
        }
        
        // Criar a empresa com as contribuições individuais
        const company = this.companyManager.createCompany(companyName, className, memberContributions);
        
        Toast.show({ message: `Empresa "${companyName}" criada com sucesso com capital inicial de R$ ${totalContribution.toFixed(2)}!`, type: 'success' });
        this.companyNameInput.value = '';
        this.companyStudentsSelect.selectedIndex = -1;
        this.studentContributionsContainer.innerHTML = '';
        const info = document.createElement('p');
        info.className = 'contribution-info';
        info.textContent = 'Selecione os alunos para definir as contribuições individuais';
        this.studentContributionsContainer.appendChild(info);
        
        // Atualizar listas
        this.renderClassList(); // Para atualizar o saldo dos alunos
        this.renderCompanyList();
    }

    updateClassSelects() {
        const classNames = this.classManager.getClassNames();
        
        // Update class selects
        [this.classSelect, this.companyClassSelect].forEach(select => {
            // Store the current selection
            const currentSelection = select.value;
            
            // Clear options except the placeholder
            while (select.options.length > 1) {
                select.options.remove(1);
            }
            
            // Add class options
            classNames.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                select.appendChild(option);
            });
            
            // Restore selection if possible
            if (classNames.includes(currentSelection)) {
                select.value = currentSelection;
            }
        });
        
        // Update student select if needed
        this.updateStudentSelect();
    }

    /**
     * Update student select dropdown based on selected class
     */
    updateStudentSelect() {
        const className = this.companyClassSelect.value;
        const students = className ? this.classManager.getStudents(className) : [];
        
        // Clear options
        this.companyStudentsSelect.innerHTML = '';
        
        // Add student options
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            this.companyStudentsSelect.appendChild(option);
        });
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
                        this.renderCompanyList();
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

    /**
     * Update company list based on selected class
     */
    updateCompanyList() {
        const className = this.classSelect.value;
        this.renderCompanyList(className);
    }

    /**
     * Render the list of companies
     * @param {string} className - Optional filter by class name
     */
    renderCompanyList(className = null) {
        this.companyManager.companyOperationManager.renderCompanyList();
    }

    /**
     * Show a modal to add expense or revenue
     * @param {Company} company - The company
     * @param {string} type - 'expense' or 'revenue'
     */
    showFinanceModal(company, type) {
        const isExpense = type === 'expense';
        const title = isExpense ? 'Adicionar Despesa' : 'Adicionar Receita';
        
        Modal.show({
            title: title,
            fields: [
                {
                    id: 'description',
                    label: 'Descrição:',
                    type: 'text',
                    placeholder: `Descreva a ${isExpense ? 'despesa' : 'receita'}`,
                    required: true
                },
                {
                    id: 'amount',
                    label: 'Valor (R$):',
                    type: 'number',
                    placeholder: '0.00',
                    required: true
                },
                {
                    id: 'date',
                    label: 'Data:',
                    type: 'date',
                    value: new Date().toISOString().split('T')[0],
                    required: true
                }
            ],
            confirmText: 'Salvar',
            cancelText: 'Cancelar',
            onConfirm: (values) => {
                const { description, amount, date } = values;
                
                if (!description) {
                    Toast.show({ message: 'Por favor, insira uma descrição.', type: 'error' });
                    return;
                }
                
                if (isNaN(amount) || parseFloat(amount) <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor válido.', type: 'error' });
                    return;
                }
                
                if (isExpense) {
                    this.companyManager.addExpense(company.id, description, amount, date);
                    Toast.show({ message: 'Despesa adicionada com sucesso!', type: 'success' });
                } else {
                    this.companyManager.addRevenue(company.id, description, amount, date);
                    Toast.show({ message: 'Receita adicionada com sucesso!', type: 'success' });
                }
                
                this.renderCompanyList();
            }
        });
    }

    /**
     * Update student contributions fields when students are selected
     */
    updateStudentContributions() {
        const selectedStudentIds = Array.from(this.companyStudentsSelect.selectedOptions).map(option => option.value);
        const className = this.companyClassSelect.value;
        const students = this.classManager.getStudents(className);
        
        // Limpar o container de contribuições
        this.studentContributionsContainer.innerHTML = '';
        
        if (selectedStudentIds.length === 0) {
            const info = document.createElement('p');
            info.className = 'contribution-info';
            info.textContent = 'Selecione os alunos para definir as contribuições individuais';
            this.studentContributionsContainer.appendChild(info);
            return;
        }
        
        // Criar container para as contribuições
        const contributionContainer = document.createElement('div');
        contributionContainer.className = 'contribution-container';
        
        const title = document.createElement('div');
        title.className = 'contribution-title';
        title.textContent = 'Contribuições para a Empresa:';
        contributionContainer.appendChild(title);
        
        // Adicionar campos para cada estudante selecionado
        selectedStudentIds.forEach(studentId => {
            const student = students.find(s => s.id === studentId);
            if (!student) return;
            
            const contributionItem = document.createElement('div');
            contributionItem.className = 'contribution-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'contribution-name';
            nameSpan.textContent = student.name;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.step = '0.01';
            input.max = student.currentBalance;
            input.placeholder = '0.00';
            input.className = 'contribution-input';
            input.id = `contribution-${studentId}`;
            input.value = '0';
            
            const balanceSpan = document.createElement('span');
            balanceSpan.className = 'student-balance';
            balanceSpan.textContent = `Saldo: R$ ${student.currentBalance.toFixed(2)}`;
            
            contributionItem.appendChild(nameSpan);
            contributionItem.appendChild(input);
            contributionItem.appendChild(balanceSpan);
            contributionContainer.appendChild(contributionItem);
        });
        
        this.studentContributionsContainer.appendChild(contributionContainer);
    }
}