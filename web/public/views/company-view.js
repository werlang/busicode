/**
 * Company View
 * Handles UI rendering for companies in the BusiCode application
 */
import CompanyManager from '../helpers/company-manager.js';
import ClassManager from '../helpers/class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';
import Storage from '../helpers/storage.js';

export default class CompanyView {
    constructor() {
        this.companyManager = new CompanyManager();
        this.classManager = new ClassManager();
        this.navigationStorage = new Storage('busicode_navigation'); // For remembering filter
    }

    /**
     * Initialize the CompanyView
     * Set up UI event handlers and render initial content
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

        // Listen for changes on the company filter select to update company cards and persist selection
        const companyFilterSelect = document.querySelector('#company-filter-select');
        if (companyFilterSelect) {
            // Restore filter selection from navigation storage
            const navData = this.navigationStorage.loadData() || {};
            if (navData.companyClassFilter) {
                companyFilterSelect.value = navData.companyClassFilter;
            }
            // Always render with restored or default value
            this.renderCompanyList(companyFilterSelect.value);
            // Save on change
            companyFilterSelect.addEventListener('change', () => {
                // Save to navigation storage
                const navData = this.navigationStorage.loadData() || {};
                navData.companyClassFilter = companyFilterSelect.value;
                this.navigationStorage.saveData(navData);
                this.renderCompanyList(companyFilterSelect.value);
            });
        }
                                                            
        // Set up global event listeners
        this.setupGlobalListeners();

        return this;
    }

    /**
     * Create a new company from UI input
     */
    createCompany() {
        const classSelect = document.querySelector('#company-class-select');
        const classId = classSelect.value;
        const companyNameInput = document.querySelector('#company-name');
        const companyName = companyNameInput.value;
        const companyStudentsSelect = document.querySelector('#company-students');
        
        // Get selected student IDs
        const selectedStudentIds = Array.from(companyStudentsSelect.selectedOptions).map(option => option.value);
        
        if (!classId) {
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
        
        // Collect individual contributions
        const memberContributions = {};
        let totalContribution = 0;
        
        selectedStudentIds.forEach(studentId => {
            const contributionInput = document.querySelector(`#contribution-${studentId}`);
            if (!contributionInput) return;
            
            const contribution = parseFloat(contributionInput.value) || 0;
            memberContributions[studentId] = contribution;
            totalContribution += contribution;
        });
        
        // Create the company using the CompanyManager
        const result = this.companyManager.createCompany(
            companyName, 
            classId, 
            selectedStudentIds, 
            memberContributions
        );
        
        if (!result.success) {
            Toast.show({ message: result.message, type: 'error' });
            return;
        }
        
        Toast.show({ message: result.message, type: 'success' });
        
        // Notify that student balances were updated
        document.dispatchEvent(new CustomEvent('studentBalanceUpdated', {
            detail: {
                studentIds: selectedStudentIds,
                classId: classId,
                className: result.className // Use the class name returned from create operation
            }
        }));
        
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
                companyId: result.company.id,
                classId: classId,
                className: result.className
            } 
        }));
    }

    /**
     * Update class select dropdown for company creation
     */
    updateClassSelect() {
        const classes = this.classManager.getAllClasses();
        
        // Store the current selection
        const companyClassSelect = document.querySelector('#company-class-select');
        const currentSelection = companyClassSelect.value;
        
        // Clear options except the placeholder
        while (companyClassSelect.options.length > 1) {
            companyClassSelect.options.remove(1);
        }
        
        // Add class options
        classes.forEach(classObj => {
            const option = document.createElement('option');
            option.value = classObj.id;
            option.textContent = classObj.name;
            companyClassSelect.appendChild(option);
        });
        
        // Restore selection if possible
        const classExists = classes.some(c => c.id === currentSelection);
        if (classExists) {
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
        const classId = companyClassSelect.value;
        const students = classId ? this.classManager.getStudents(classId) : [];
        
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
        const classes = this.companyManager.getUniqueClasses();

        // Clear options
        classSelect.innerHTML = '';
        
        // Add "All Classes" option
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Todas as Turmas';
        classSelect.appendChild(allOption);
        
        // Add company options
        classes.forEach(classObj => {
            const option = document.createElement('option');
            option.value = classObj.id;
            option.textContent = classObj.name;
            classSelect.appendChild(option);
        });

        // Restore filter selection from navigation storage
        const navData = this.navigationStorage.loadData() || {};
        if (navData.companyClassFilter && [...classSelect.options].some(opt => opt.value === navData.companyClassFilter)) {
            classSelect.value = navData.companyClassFilter;
        }
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
        const classId = companyClassSelect.value;
        const students = this.classManager.getStudents(classId);
        
        // Clear the contributions container
        const studentContributionsContainer = document.querySelector('#student-contributions');
        studentContributionsContainer.innerHTML = '';
        
        if (selectedStudentIds.length === 0) {
            const info = document.createElement('p');
            info.className = 'contribution-info';
            info.textContent = 'Selecione os alunos para definir as contribuições individuais';
            studentContributionsContainer.appendChild(info);
            return;
        }
        
        // Create container for contributions
        const contributionContainer = document.createElement('div');
        contributionContainer.className = 'contribution-container';
        
        const title = document.createElement('div');
        title.className = 'contribution-title';
        title.textContent = 'Contribuições para a Empresa:';
        contributionContainer.appendChild(title);
        
        // Add fields for each selected student
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
        // Listen for class list updates 
        document.addEventListener('classSelectsUpdated', () => {
            this.updateClassSelect();
            this.updateStudentSelect();
            this.updateCompanySelect();
        });

        document.addEventListener('classDeleted', (event) => {
            const classId = event.detail.classId;
            const className = event.detail.className;
            
            // Delete companies associated with the deleted class
            this.companyManager.deleteCompaniesByClass(classId, className);
            
            this.updateClassSelect();
            this.updateCompanySelect();
        });

        // Listen for class renaming events
        document.addEventListener('classRenamed', (event) => {
            // The companies will continue to reference the same class ID
            // Just refresh the UI to display the new name
            this.updateClassSelect();
            this.updateCompanySelect();
            this.renderCompanyList();
        });

        // Listen for company creation events
        document.addEventListener('companyCreated', () => {
            this.updateCompanySelect();
        });

        // Listen for product sales
        document.addEventListener('productSalesUpdated', (event) => {
            const { productName, sales, price, companyId } = event.detail;
            
            this.companyManager.addProductSales(companyId, productName, sales, price);
            this.renderCompanyList();
        });
    }

    /**
     * Render the list of companies
     * @param {string} classFilter - Optional filter by class ID
     */
    renderCompanyList(classFilter = null) {
        const companiesList = document.querySelector('#companies-list');
        if (!companiesList) return;
        companiesList.innerHTML = '';

        classFilter = classFilter || document.querySelector('#company-filter-select')?.value;
        const companies = classFilter ? 
            this.companyManager.getCompaniesForClass(classFilter) : 
            this.companyManager.getAllCompanies();

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
                // First try using class ID if available
                let classStudents = [];
                classStudents = this.classManager.getStudents(company.classroomId);
                const student = classStudents.find(s => s.id === id);
                return student ? student.name : 'Aluno não encontrado';
            });

            const classroomName = this.classManager.getClassById(company.classroomId).name;

            const companyContent = document.createElement('div');
            companyContent.className = 'company-header';
            companyContent.innerHTML = `
                    <h4>${company.name}</h4>
                    <p><strong>Turma:</strong> ${classroomName}</p>
                    <p class="company-students"><strong>Alunos:</strong> ${students.join(', ')}</p>
                    <div class="company-finances">
                        <div class="finance-item">
                            <div>Receitas</div>
                            <div class="finance-value budget">R$ ${company.getTotalRevenues().toFixed(2)}</div>
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

            // Add activity history
            const activityHistory = company.getActivityHistory();
            if (activityHistory.length > 0) {
                const historyContainer = document.createElement('div');
                historyContainer.className = 'activity-history-container';
                
                const historyTitle = document.createElement('h5');
                historyTitle.textContent = 'Histórico de Atividades';
                historyTitle.className = 'activity-history-title';
                historyContainer.appendChild(historyTitle);
                
                const historyList = document.createElement('ul');
                historyList.className = 'activity-history-list';
                
                // Limit to 5 most recent activities
                const recentActivities = activityHistory.slice(0, 5);
                
                recentActivities.forEach(activity => {
                    const historyItem = document.createElement('li');
                    historyItem.className = `activity-item activity-${activity.type}`;
                    
                    const dateFormatted = new Date(activity.date).toLocaleString('pt-BR');
                    
                    historyItem.innerHTML = `
                        <div class="activity-info">
                            <span class="activity-description">${activity.description}</span>
                            <span class="activity-date">${dateFormatted}</span>
                        </div>
                        <span class="activity-amount">${activity.displayAmount}</span>
                    `;
                    
                    historyList.appendChild(historyItem);
                });
                
                // Add "View All" button if there are more than 5 activities
                if (activityHistory.length > 5) {
                    const viewAllItem = document.createElement('li');
                    viewAllItem.className = 'view-all-item';
                    
                    const viewAllButton = document.createElement('button');
                    viewAllButton.textContent = 'Ver Histórico Completo';
                    viewAllButton.className = 'view-all-button';
                    viewAllButton.addEventListener('click', () => this.showFullHistoryModal(company));
                    
                    viewAllItem.appendChild(viewAllButton);
                    historyList.appendChild(viewAllItem);
                }
                
                historyContainer.appendChild(historyList);
                companyCard.appendChild(historyContainer);
            }

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
            
            // Add Edit Students button
            const editStudentsBtn = document.createElement('button');
            editStudentsBtn.textContent = 'Editar Alunos';
            editStudentsBtn.className = 'edit-students-button';
            editStudentsBtn.addEventListener('click', () => this.showEditStudentsModal(company));

            const profitDistBtn = document.createElement('button');
            profitDistBtn.textContent = 'Distribuir Lucros';
            profitDistBtn.className = 'profit-dist-button';
            profitDistBtn.title = 'Distribuir lucros para os membros da empresa';
            profitDistBtn.style.backgroundColor = '#9b59b6'; // Purple color to distinguish the button
            
            // Only enable the button if there are profits to distribute
            if (company.getProfit() <= 0) {
                profitDistBtn.disabled = true;
                profitDistBtn.title = 'Não há lucros disponíveis para distribuir';
            }
            
            profitDistBtn.addEventListener('click', () => this.showDistributeProfitsModal(company));

            buttonContainer.appendChild(addExpenseBtn);
            buttonContainer.appendChild(addRevenueBtn);
            buttonContainer.appendChild(editStudentsBtn);
            buttonContainer.appendChild(profitDistBtn);
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
                        this.companyManager.deleteCompany(company.id);
                        Toast.show({ message: `Empresa "${company.name}" excluída com sucesso.`, type: 'success' });
                        
                        // Notify other components that a company has been deleted
                        document.dispatchEvent(new CustomEvent('companyDeleted', {
                            detail: { 
                                companyId: company.id
                            }
                        }));
                        
                        this.renderCompanyList();
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
                    value: new Date(),
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
                    this.companyManager.addExpense(company, description, amount, date);
                    Toast.show({ message: 'Despesa adicionada com sucesso!', type: 'success' });
                } else {
                    this.companyManager.addRevenue(company, description, amount, date);
                    Toast.show({ message: 'Receita adicionada com sucesso!', type: 'success' });
                }
                
                this.renderCompanyList();
                return true;
            }
        });
    }

    /**
     * Show a modal dialog for distributing profits to company members
     * @param {Object} company - The company object
     */
    showDistributeProfitsModal(company) {
        // Get current company members with their details
        const students = company.memberIds.map(id => {
            const classStudents = this.classManager.getStudents(company.classroomId);
            return classStudents.find(s => s.id === id);
        }).filter(student => student); // Filter out any undefined students
        
        if (students.length === 0) {
            Toast.show({ message: 'Não há membros disponíveis para distribuir lucros.', type: 'warning' });
            return;
        }
        
        // Create modal content with student selection and amount inputs
        const fields = [
            {
                id: 'studentId',
                label: 'Selecione o membro:',
                type: 'select',
                options: students.map(student => ({
                    value: student.id,
                    text: `${student.name} (Saldo: R$ ${student.currentBalance.toFixed(2)})`
                }))
            },
            {
                id: 'amount',
                label: 'Valor a distribuir (R$):',
                type: 'number',
                placeholder: '0.00',
                required: true
            },
            {
                id: 'description',
                label: 'Descrição:',
                type: 'text',
                placeholder: 'Distribuição de lucros',
                value: 'Distribuição de lucros'
            }
        ];
        
        Modal.showInput({
            title: `Distribuir Lucros - ${company.name}`,
            message: `Lucro disponível: R$ ${company.getProfit().toFixed(2)}`,
            fields,
            confirmText: 'Distribuir',
            cancelText: 'Cancelar',
            onConfirm: (values) => {
                const { studentId, amount, description } = values;
                const parsedAmount = parseFloat(amount);
                
                if (!studentId || isNaN(parsedAmount) || parsedAmount <= 0) {
                    Toast.show({ message: 'Por favor, preencha todos os campos corretamente.', type: 'error' });
                    return false;
                }
                
                // Use company manager to distribute profits
                const result = this.companyManager.distributeProfits(
                    company.id,
                    studentId,
                    parsedAmount,
                    description
                );
                
                if (!result.success) {
                    Toast.show({ message: result.message, type: 'error' });
                    return false;
                }
                
                // Update UI
                this.renderCompanyList();
                
                // Notify that student balance was updated
                document.dispatchEvent(new CustomEvent('studentBalanceUpdated', {
                    detail: {
                        studentIds: [studentId],
                        className: company.classroomName
                    }
                }));
                
                Toast.show({ message: result.message, type: 'success' });
                return true;
            }
        });
    }

    /**
     * Show modal with full activity history
     * @param {Object} company - The company
     */
    showFullHistoryModal(company) {
        const activityHistory = company.getActivityHistory();
        
        const modalContent = document.createElement('div');
        modalContent.className = 'activity-history-modal';
        
        // Create table with all activities
        const historyTable = document.createElement('table');
        historyTable.className = 'data-table activity-history-table';
        
        // Table header
        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
            <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Tipo</th>
            </tr>
        `;
        historyTable.appendChild(tableHeader);
        
        // Table body
        const tableBody = document.createElement('tbody');
        
        activityHistory.forEach(activity => {
            const row = document.createElement('tr');
            row.className = `activity-row activity-${activity.type}`;
            
            const dateFormatted = new Date(activity.date).toLocaleDateString('pt-BR');
            
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = dateFormatted;
            row.appendChild(dateCell);
            
            // Description cell
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = activity.description;
            row.appendChild(descriptionCell);
            
            // Amount cell
            const amountCell = document.createElement('td');
            amountCell.textContent = activity.displayAmount;
            amountCell.className = `amount-cell amount-${activity.type}`;
            row.appendChild(amountCell);
            
            // Type cell
            const typeCell = document.createElement('td');
            typeCell.textContent = activity.type === 'expense' ? 'Despesa' : 'Receita';
            typeCell.className = `type-cell type-${activity.type}`;
            row.appendChild(typeCell);
            
            tableBody.appendChild(row);
        });
        
        historyTable.appendChild(tableBody);
        modalContent.appendChild(historyTable);
        
        // Show the modal
        Modal.show({
            title: `Histórico completo - ${company.name}`,
            message: modalContent.outerHTML,
            confirmText: 'Fechar',
            cancelText: null
        });
    }

    /**
     * Show a modal dialog for editing students in a company
     * @param {Object} company - The company object
     */
    showEditStudentsModal(company) {
        // Get all available students from the class
        const allClassStudents = this.classManager.getStudents(company.classroomId);
        
        // Create two arrays: one for students in the company and one for students not in the company
        const companyStudents = allClassStudents.filter(student => 
            company.memberIds.includes(student.id)
        );
        
        const availableStudents = allClassStudents.filter(student => 
            !company.memberIds.includes(student.id)
        );
        
        // Create the modal content with two select lists
        const modalContent = document.createElement('div');
        modalContent.className = 'edit-students-modal';
        
        // Create container for the two columns
        const columnsContainer = document.createElement('div');
        columnsContainer.className = 'edit-students-columns';
        
        // Left column - Available students
        const leftColumn = document.createElement('div');
        leftColumn.className = 'edit-students-column';
        
        const leftHeader = document.createElement('h4');
        leftHeader.textContent = 'Alunos Disponíveis';
        leftColumn.appendChild(leftHeader);
        
        const availableList = document.createElement('select');
        availableList.id = 'available-students';
        availableList.multiple = true;
        availableList.className = 'student-select';
        availableList.size = 10;
        
        if (availableStudents.length === 0) {
            const emptyOption = document.createElement('option');
            emptyOption.disabled = true;
            emptyOption.textContent = 'Não há alunos disponíveis';
            availableList.appendChild(emptyOption);
        } else {
            availableStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                availableList.appendChild(option);
            });
        }
        
        leftColumn.appendChild(availableList);
        
        // Center column - Controls
        const centerColumn = document.createElement('div');
        centerColumn.className = 'edit-students-controls';
        
        const addButton = document.createElement('button');
        addButton.innerHTML = '&rarr;';
        addButton.className = 'student-transfer-btn';
        addButton.title = 'Adicionar à empresa';
        addButton.disabled = availableStudents.length === 0;
        
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&larr;';
        removeButton.className = 'student-transfer-btn';
        removeButton.title = 'Remover da empresa';
        removeButton.disabled = companyStudents.length === 0;
        
        centerColumn.appendChild(addButton);
        centerColumn.appendChild(removeButton);
        
        // Right column - Company students
        const rightColumn = document.createElement('div');
        rightColumn.className = 'edit-students-column';
        
        const rightHeader = document.createElement('h4');
        rightHeader.textContent = 'Alunos na Empresa';
        rightColumn.appendChild(rightHeader);
        
        const companyList = document.createElement('select');
        companyList.id = 'company-students-list';
        companyList.multiple = true;
        companyList.className = 'student-select';
        companyList.size = 10;
        
        if (companyStudents.length === 0) {
            const emptyOption = document.createElement('option');
            emptyOption.disabled = true;
            emptyOption.textContent = 'Não há alunos na empresa';
            companyList.appendChild(emptyOption);
        } else {
            companyStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                companyList.appendChild(option);
            });
        }
        
        rightColumn.appendChild(companyList);
        
        // Assemble the columns
        columnsContainer.appendChild(leftColumn);
        columnsContainer.appendChild(centerColumn);
        columnsContainer.appendChild(rightColumn);
        modalContent.appendChild(columnsContainer);
        
        // Create the modal
        Modal.show({
            title: `Editar Alunos - ${company.name}`,
            message: modalContent.outerHTML,
            confirmText: 'Salvar',
            cancelText: 'Cancelar',
            onConfirm: () => {
                // Get current list of students in the company from the modal
                const companyStudentsList = document.querySelector('#company-students-list');
                const updatedMemberIds = Array.from(companyStudentsList.options).map(option => option.value);
                
                // Update the company with the new list of students
                const result = this.companyManager.updateCompanyStudents(company.id, updatedMemberIds);
                
                if (result.success) {
                    this.renderCompanyList();
                    Toast.show({ message: 'Lista de alunos atualizada com sucesso!', type: 'success' });
                } else {
                    Toast.show({ message: result.message || 'Erro ao atualizar a lista de alunos.', type: 'error' });
                }
            }
        });
        
        // Add event listeners after the modal is created
        // This has to be done after the modal is in the DOM
        setTimeout(() => {
            const availableStudentsSelect = document.querySelector('#available-students');
            const companyStudentsSelect = document.querySelector('#company-students-list');
            const addBtn = document.querySelector('.edit-students-controls .student-transfer-btn:first-child');
            const removeBtn = document.querySelector('.edit-students-controls .student-transfer-btn:last-child');
            
            // Add selected students to company
            addBtn.addEventListener('click', () => {
                const selectedOptions = Array.from(availableStudentsSelect.selectedOptions);
                
                if (selectedOptions.length === 0) {
                    Toast.show({ message: 'Selecione pelo menos um aluno para adicionar.', type: 'warning' });
                    return;
                }
                
                selectedOptions.forEach(option => {
                    // Create a new option for the company list
                    const newOption = document.createElement('option');
                    newOption.value = option.value;
                    newOption.textContent = option.textContent;
                    companyStudentsSelect.appendChild(newOption);
                    
                    // Remove from available list
                    availableStudentsSelect.removeChild(option);
                });
                
                // Update button states
                addBtn.disabled = availableStudentsSelect.options.length === 0;
                removeBtn.disabled = companyStudentsSelect.options.length === 0;
            });
            
            // Remove selected students from company
            removeBtn.addEventListener('click', () => {
                const selectedOptions = Array.from(companyStudentsSelect.selectedOptions);
                
                if (selectedOptions.length === 0) {
                    Toast.show({ message: 'Selecione pelo menos um aluno para remover.', type: 'warning' });
                    return;
                }
                
                selectedOptions.forEach(option => {
                    // Create a new option for the available list
                    const newOption = document.createElement('option');
                    newOption.value = option.value;
                    newOption.textContent = option.textContent;
                    availableStudentsSelect.appendChild(newOption);
                    
                    // Remove from company list
                    companyStudentsSelect.removeChild(option);
                });
                
                // Update button states
                addBtn.disabled = availableStudentsSelect.options.length === 0;
                removeBtn.disabled = companyStudentsSelect.options.length === 0;
            });
        }, 100); // Small delay to ensure DOM elements are ready
    }
}