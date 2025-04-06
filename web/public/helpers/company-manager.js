/**
 * Company Manager
 * Manages companies and their finances in the BusiCode application
 */
import Storage from './storage.js';
import Company from '../model/company.js';
import ClassManager from './class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class CompanyManager {
    constructor() {
        this.storage = new Storage('busicode_companies');
        this.companies = this.loadCompanies();
        this.classManager = new ClassManager();
    }

    /**
     * Initialize the CompanyManager
     * This method can be used to set up any necessary data or state
     * @returns {void}
     */
    initialize() {
        const createCompanyBtn = document.querySelector('#create-company-btn');
        createCompanyBtn.addEventListener('click', () => this.createCompany());
        
        const companyClassSelect = document.querySelector('#company-class-select');
        companyClassSelect.addEventListener('change', () => this.updateStudentSelect());
        
        const companyStudentsSelect = document.querySelector('#company-students');
        companyStudentsSelect.addEventListener('change', () => this.updateStudentContributions());

        this.updateClassSelect();
        this.updateCompanySelect();

        // Listen for changes on the company filter select to update company cards
        const companyFilterSelect = document.querySelector('#company-filter-select');
        if (companyFilterSelect) {
            companyFilterSelect.addEventListener('change', () => this.renderCompanyList(companyFilterSelect.value));
        }
                                                            
        // Set up global event listeners
        this.setupGlobalListeners();
    }

    /**
     * Load companies from storage
     * @returns {Object} An object containing all companies
     */
    loadCompanies() {
        const data = this.storage.loadData() || {};
        
        // Convert plain objects to Company instances
        Object.keys(data).forEach(id => {
            const companyData = data[id];
            data[id] = new Company(
                companyData.id,
                companyData.name,
                companyData.classroomName,
                companyData.memberContributions
            );
            
            // Restore expenses and revenues
            data[id].expenses = companyData.expenses || [];
            data[id].revenues = companyData.revenues || [];
            data[id].currentBudget = companyData.currentBudget;
            
            // Restore products
            data[id].products = companyData.products || [];
        });
        
        return data;
    }

    /**
     * Save companies to storage
     */
    saveCompanies() {
        this.storage.saveData(this.companies);
    }

    /**
     * Create a new company
     * @param {string} name - Company name
     * @param {string} classroomName - Class name
     * @param {Object} memberContributions - Object mapping member IDs to their contributions
     * @returns {Company} The created company
     */
    createCompany() {

        const classNameInput = document.querySelector('#company-class-select');
        const className = classNameInput.value;
        const companyNameInput = document.querySelector('#company-name');
        const companyName = companyNameInput.value;
        const companyStudentsSelect = document.querySelector('#company-students');
        
        // Get selected student IDs
        const selectedStudentIds = Array.from(companyStudentsSelect.selectedOptions).map(option => option.value);
        
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
        
        if (insufficientFunds) return;
        
        if (totalContribution <= 0) {
            Toast.show({ message: 'É necessário que pelo menos um aluno faça uma contribuição para a empresa.', type: 'error' });
            return;
        }
        
        // Criar a empresa com as contribuições individuais
        const id = `company_${Date.now()}`;
        const company = new Company(id, companyName, className);
        company.addRevenue('Capital Inicial', totalContribution);
        
        // Atualizar o saldo dos alunos deduzindo suas contribuições
        Object.entries(memberContributions).forEach(([studentId, contribution]) => {
            const classStudents = this.classManager.getStudents(className);
            const student = classStudents.find(s => s.id === studentId);
            if (student) {
                student.deductBalance(contribution);
            }
        });
        this.classManager.saveClasses();

        document.dispatchEvent(new CustomEvent('studentBalanceUpdated', {
            detail: {
                studentIds: selectedStudentIds,
                className: className
            }
        }));
        
        this.companies[id] = company;
        this.saveCompanies();
        
        Toast.show({ message: `Empresa "${companyName}" criada com sucesso com capital inicial de R$ ${totalContribution.toFixed(2)}!`, type: 'success' });
        
        // Reset form
        companyNameInput.value = '';
        companyStudentsSelect.selectedIndex = -1;

        const studentContributionsContainer = document.querySelector('#student-contributions');
        studentContributionsContainer.innerHTML = '';
        
        const info = document.createElement('p');
        info.className = 'contribution-info';
        info.textContent = 'Selecione os alunos para definir as contribuições individuais';
        studentContributionsContainer.appendChild(info);
        
        // Notify other components that a company has been created
        document.dispatchEvent(new CustomEvent('companyCreated', { 
            detail: { 
                companyId: company.id,
                className: className
            } 
        }));
        
        return company;
    }

    /**
     * Get a company by ID
     * @param {string} id - Company ID
     * @returns {Company} The company object
     */
    getCompany(id) {
        return this.companies[id];
    }

    /**
     * Get all companies
     * @returns {Company[]} Array of all companies
     */
    getAllCompanies() {
        this.companies = this.loadCompanies();
        return Object.values(this.companies);
    }

    /**
     * Get companies for a specific class
     * @param {string} classroomName - Class name
     * @returns {Company[]} Array of companies in the class
     */
    getCompaniesForClass(classroomName) {
        return Object.values(this.companies)
            .filter(company => company.classroomName === classroomName);
    }

    /**
     * Update a company's details
     * @param {string} id - Company ID
     * @param {Object} updates - Object with properties to update
     * @returns {boolean} True if successful, false if company not found
     */
    updateCompany(id, updates) {
        const company = this.companies[id];
        if (!company) return false;
        
        Object.keys(updates).forEach(key => {
            company[key] = updates[key];
        });
        
        this.saveCompanies();
        return true;
    }

    /**
     * Delete a company
     * @param {string} id - Company ID
     * @returns {boolean} True if successful, false if company not found
     */
    deleteCompany(id) {
        if (this.companies[id]) {
            delete this.companies[id];
            this.saveCompanies();

            // Notify other components that a company has been deleted
            document.dispatchEvent(new CustomEvent('companyDeleted', {
                detail: { 
                    companyId: id
                }
            }));

            this.renderCompanyList();
            return true;
        }
        return false;
    }

    /**
     * Add an expense to a company
     * @param {string} company - Company object
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     * @param {string} date - Expense date
     * @returns {Object} The created expense or null if company not found
     */
    addExpense(company, description, amount, date) {
        if (!company) return null;
        
        const expense = company.addExpense(description, amount, date);
        this.saveCompanies();
        
        return expense;
    }

    /**
     * Add revenue to a company
     * @param {string} company - Company object
     * @param {string} description - Revenue description
     * @param {number} amount - Revenue amount
     * @param {string} date - Revenue date
     * @returns {Object} The created revenue or null if company not found
     */
    addRevenue(company, description, amount, date) {
        if (!company) return null;
        
        const revenue = company.addRevenue(description, amount, date);
        this.saveCompanies();
        
        return revenue;
    }

    /**
     * Add funds directly to a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to add
     * @param {string} description - Description of the fund addition
     * @returns {Object} The created revenue or null if company not found
     */
    addFunds(companyId, amount, description = 'Fund addition') {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const revenue = company.addFunds(amount, description);
        this.saveCompanies();
        
        return revenue;
    }

    /**
     * Remove funds directly from a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to remove
     * @param {string} description - Description of the fund removal
     * @returns {Object} The created expense or null if company not found
     */
    removeFunds(companyId, amount, description = 'Fund removal') {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const expense = company.removeFunds(amount, description);
        this.saveCompanies();
        
        return expense;
    }    

    /**
     * Update class select dropdown for company creation
     */
    updateClassSelect() {
        this.classManager.loadClasses();
        const classNames = this.classManager.getClassNames();
        
        // Store the current selection
        const companyClassSelect = document.querySelector('#company-class-select');
        const currentSelection = companyClassSelect.value;
        
        // Clear options except the placeholder
        while (companyClassSelect.options.length > 1) {
            companyClassSelect.options.remove(1);
        }
        
        // Add class options
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            companyClassSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
            companyClassSelect.value = currentSelection;
        }
        
        // Update student select based on the current class
        this.updateStudentSelect();
    }

    /**
     * Update student select dropdown based on selected class
     */
    updateStudentSelect() {
        const companyClassSelect = document.querySelector('#company-class-select');
        const className = companyClassSelect.value;
        const students = className ? this.classManager.getStudents(className) : [];
        
        // Clear options
        const companyStudentsSelect = document.querySelector('#company-students');
        companyStudentsSelect.innerHTML = '';
        
        // Add student options
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            companyStudentsSelect.appendChild(option);
        });
        
        // Reset contributions area
        const studentContributionsContainer = document.querySelector('#student-contributions');
        studentContributionsContainer.innerHTML = '';
        const info = document.createElement('p');
        info.className = 'contribution-info';
        info.textContent = 'Selecione os alunos para definir as contribuições individuais';
        studentContributionsContainer.appendChild(info);
    }

    /**
     * Update company select dropdown for company selection
     */
    updateCompanySelect() {
        const classSelect = document.querySelector('#company-filter-select');
        const classNames = Object.values(this.companies).map(company => company.classroomName).filter((value, index, self) => self.indexOf(value) === index);

        // Clear options
        classSelect.innerHTML = '';
        
        // Add company options
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });

        // Render list of companies
        this.renderCompanyList(classSelect.value);
    }

    /**
     * Update student contributions fields when students are selected
     */
    updateStudentContributions() {
        const companyClassSelect = document.querySelector('#company-class-select');
        const companyStudentsSelect = document.querySelector('#company-students');
        const selectedStudentIds = Array.from(companyStudentsSelect.selectedOptions).map(option => option.value);
        const className = companyClassSelect.value;
        const students = this.classManager.getStudents(className);
        
        // Limpar o container de contribuições
        const studentContributionsContainer = document.querySelector('#student-contributions');
        studentContributionsContainer.innerHTML = '';
        
        if (selectedStudentIds.length === 0) {
            const info = document.createElement('p');
            info.className = 'contribution-info';
            info.textContent = 'Selecione os alunos para definir as contribuições individuais';
            studentContributionsContainer.appendChild(info);
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
        
        studentContributionsContainer.appendChild(contributionContainer);
    }

    /**
     * Set up global event listeners from other managers
     */
    setupGlobalListeners() {
        // Listen for class list updates from SetupManager
        document.addEventListener('classSelectsUpdated', () => {
            this.updateClassSelect();
        });

        document.addEventListener('classDeleted', (event) => {
            const className = event.detail.className;
            // Remove companies associated with the deleted class
            Object.keys(this.companies).forEach(companyId => {
                const company = this.companies[companyId];
                if (company.classroomName === className) {
                    // remove products from the company
                    document.dispatchEvent(new CustomEvent('companyDeleted', {
                        detail: {
                            companyId: companyId,
                            className: className
                        }
                    }));

                    delete this.companies[companyId];
                }
            });
            this.saveCompanies();
            this.updateClassSelect();
            this.updateCompanySelect();
        });

        // Listen for company creation events
        document.addEventListener('companyCreated', (event) => {
            this.updateCompanySelect();
        });

        // Listen for product sales
        document.addEventListener('productSalesUpdated', (event) => {
            const { productName, sales, price, companyId } = event.detail;
            const company = this.getCompany(companyId);
            this.addRevenue(
                company,
                `Venda de produto ${productName}`,
                sales * price,
                new Date().toISOString().split('T')[0]
            );
            this.saveCompanies();
            this.renderCompanyList();
        });
        
    }

    /**
     * Render the list of companies
     * @param {string} className - Optional filter by class name
     */
    renderCompanyList(className = null) {
        const companiesList = document.querySelector('#companies-list');
        if (!companiesList) return;
        companiesList.innerHTML = '';

        className = className || document.querySelector('#company-filter-select').value;
        const companies = this.getCompaniesForClass(className);

        if (companies.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'company-list-empty';
            emptyMessage.textContent = 'Nenhuma empresa cadastrada.';
            companiesList.appendChild(emptyMessage);
            return;
        }

        companies.forEach(company => {
            const companyCard = document.createElement('div');
            companyCard.className = 'card company-card';

            // Get student names for this company
            const students = company.memberIds.map(id => {
                const classStudents = this.classManager.getStudents(company.classroomName);
                const student = classStudents.find(s => s.id === id);
                return student ? student.name : 'Aluno não encontrado';
            });

            const companyContent = document.createElement('div');
            companyContent.className = 'company-header';
            companyContent.innerHTML = `
                    <h4>${company.name}</h4>
                    <p><strong>Turma:</strong> ${company.classroomName}</p>
                    <p class="company-students"><strong>Alunos:</strong> ${students.join(', ')}</p>
                    <div class="company-finances">
                        <div class="finance-item">
                            <div>Receitas</div>
                            <div class="finance-value budget">R$ ${company.currentBudget.toFixed(2)}</div>
                        </div>
                        <div class="finance-item">
                            <div>Despesas</div>
                            <div class="finance-value expenses">R$ ${company.getTotalExpenses().toFixed(2)}</div>
                        </div>
                        <div class="finance-item">
                            <div>Caixa</div>
                            <div class="finance-value profit">R$ ${company.getProfit().toFixed(2)}</div>
                        </div>
                    </div>
                `;

            companyCard.appendChild(companyContent);

            // Add expense and revenue buttons (these will double as fund management)
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'company-actions';

            const addExpenseBtn = document.createElement('button');
            addExpenseBtn.textContent = 'Adicionar Despesa';
            addExpenseBtn.className = 'expense-button';
            addExpenseBtn.addEventListener('click', () => this.showFinanceModal(company, 'expense'));

            const addRevenueBtn = document.createElement('button');
            addRevenueBtn.textContent = 'Adicionar Receita';
            addRevenueBtn.className = 'revenue-button';
            addRevenueBtn.addEventListener('click', () => this.showFinanceModal(company, 'revenue'));

            buttonContainer.appendChild(addExpenseBtn);
            buttonContainer.appendChild(addRevenueBtn);
            companyCard.appendChild(buttonContainer);

            // Delete company button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir Empresa';
            deleteBtn.className = 'delete-button';
            deleteBtn.addEventListener('click', () => {
                Modal.show({
                    title: 'Confirmar Exclusão',
                    message: `Tem certeza que deseja excluir a empresa "${company.name}"?`,
                    confirmText: 'Excluir',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    onConfirm: () => {
                        this.deleteCompany(company.id);
                        Toast.show({ message: `Empresa "${company.name}" excluída com sucesso.`, type: 'success' });
                    }
                });
            });

            companyCard.appendChild(deleteBtn);
            companiesList.appendChild(companyCard);
        });
    }

    /**
     * Show a modal to add expense or revenue
     * @param {Object} company - The company
     * @param {string} type - 'expense' or 'revenue'
     */
    showFinanceModal(company, type) {
        const isExpense = type === 'expense';
        const title = isExpense ? 'Adicionar Despesa' : 'Adicionar Receita';
        
        Modal.showInput({
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
                
                if (isNaN(amount) || parseFloat(amount) <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor válido.', type: 'error' });
                    return false;
                }
                
                if (isExpense) {
                    this.addExpense(company, description, amount, date);
                    Toast.show({ message: 'Despesa adicionada com sucesso!', type: 'success' });
                } else {
                    this.addRevenue(company, description, amount, date);
                    Toast.show({ message: 'Receita adicionada com sucesso!', type: 'success' });
                }
                
                this.renderCompanyList();
                return true;
            }
        });
    }
}