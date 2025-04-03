/**
 * Company Creation Manager
 * Manages the creation of companies
 */
import Toast from '../components/toast.js';

export default class CompanyCreationManager {
    constructor(classManager, companyManager) {
        this.classManager = classManager;
        this.companyManager = companyManager;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Set up event listeners for global events from other managers
        this.setupGlobalListeners();
    }

    /**
     * Initialize UI elements for company creation
     */
    initializeUI() {
        // Company creation elements
        this.companyClassSelect = document.getElementById('company-class-select');
        this.companyNameInput = document.getElementById('company-name');
        this.companyStudentsSelect = document.getElementById('company-students');
        this.studentContributionsContainer = document.getElementById('student-contributions');
        this.createCompanyBtn = document.getElementById('create-company-btn');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial update of dropdowns
        this.updateClassSelect();
    }

    /**
     * Set up event listeners for company creation
     */
    setupEventListeners() {
        this.createCompanyBtn.addEventListener('click', () => this.createCompany());
        this.companyClassSelect.addEventListener('change', () => this.updateStudentSelect());
        this.companyStudentsSelect.addEventListener('change', () => this.updateStudentContributions());
    }
    
    /**
     * Set up global event listeners from other managers
     */
    setupGlobalListeners() {
        // Listen for class list updates from SetupManager
        document.addEventListener('classSelectsUpdated', () => {
            this.updateClassSelect();
        });
        
        // Listen for student list updates from SetupManager
        document.addEventListener('studentListUpdated', (event) => {
            if (event.detail && event.detail.className === this.companyClassSelect.value) {
                this.updateStudentSelect();
            }
        });
        
        // Listen for class deletion from SetupManager
        document.addEventListener('classDeleted', (event) => {
            if (event.detail && event.detail.className === this.companyClassSelect.value) {
                this.companyNameInput.value = '';
                this.studentContributionsContainer.innerHTML = '';
                const info = document.createElement('p');
                info.className = 'contribution-info';
                info.textContent = 'Selecione os alunos para definir as contribuições individuais';
                this.studentContributionsContainer.appendChild(info);
            }
        });
    }

    /**
     * Update class select dropdown for company creation
     */
    updateClassSelect() {
        const classNames = this.classManager.getClassNames();
        
        // Store the current selection
        const currentSelection = this.companyClassSelect.value;
        
        // Clear options except the placeholder
        while (this.companyClassSelect.options.length > 1) {
            this.companyClassSelect.options.remove(1);
        }
        
        // Add class options
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            this.companyClassSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
            this.companyClassSelect.value = currentSelection;
        }
        
        // Update student select based on the current class
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
        
        // Reset contributions area
        this.studentContributionsContainer.innerHTML = '';
        const info = document.createElement('p');
        info.className = 'contribution-info';
        info.textContent = 'Selecione os alunos para definir as contribuições individuais';
        this.studentContributionsContainer.appendChild(info);
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

    /**
     * Create a new company
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
        
        // Reset form
        this.companyNameInput.value = '';
        this.companyStudentsSelect.selectedIndex = -1;
        this.studentContributionsContainer.innerHTML = '';
        const info = document.createElement('p');
        info.className = 'contribution-info';
        info.textContent = 'Selecione os alunos para definir as contribuições individuais';
        this.studentContributionsContainer.appendChild(info);
        
        // Notify other components that a company has been created
        document.dispatchEvent(new CustomEvent('companyCreated', { 
            detail: { 
                companyId: company.id,
                className: className
            } 
        }));
    }
}