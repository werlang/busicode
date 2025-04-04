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
        // Company management
        this.companyClassSelect = document.querySelector('#company-class-select');
        this.companyNameInput = document.querySelector('#company-name');
        this.companyStudentsSelect = document.querySelector('#company-students');
        this.studentContributionsContainer = document.querySelector('#student-contributions');
        this.createCompanyBtn = document.querySelector('#create-company-btn');
        this.companiesList = document.querySelector('#companies-list');
        
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
        // Company management
        this.createCompanyBtn.addEventListener('click', () => this.createCompany());
        this.companyClassSelect.addEventListener('change', () => this.updateStudentSelect());
        
        // Update UI on class selection change
        this.classSelect.addEventListener('change', () => this.updateCompanyList());
        
        // Student contributions update
        this.companyStudentsSelect.addEventListener('change', () => this.updateStudentContributions());
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
            const contributionInput = document.querySelector(`#contribution-${studentId}`);
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

}