/**
 * Company View
 * Handles UI rendering for companies in the BusiCode application
 */
import CompanyManager from '../helpers/company-manager.js';
import ClassManager from '../helpers/class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class CompanyView {
    constructor() {
        this.companyManager = new CompanyManager();
        this.classManager = new ClassManager();
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

        // Listen for changes on the company filter select to update company cards
        const companyFilterSelect = document.querySelector('#company-filter-select');
        if (companyFilterSelect) {
            companyFilterSelect.addEventListener('change', () => this.renderCompanyList(companyFilterSelect.value));
        }
                                                            
        // Set up global event listeners
        this.setupGlobalListeners();
    }

    /**
     * Create a new company from UI input
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
            className, 
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
                className: className
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
                className: className
            } 
        }));
    }

    /**
     * Update class select dropdown for company creation
     */
    updateClassSelect() {
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
        const classNames = this.companyManager.getUniqueClassNames();

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
            const className = event.detail.className;
            
            // Delete companies associated with the deleted class
            this.companyManager.deleteCompaniesByClassName(className);
            
            this.updateClassSelect();
            this.updateCompanySelect();
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
     * @param {string} className - Optional filter by class name
     */
    renderCompanyList(className = null) {
        const companiesList = document.querySelector('#companies-list');
        if (!companiesList) return;
        companiesList.innerHTML = '';

        className = className || document.querySelector('#company-filter-select').value;
        const companies = this.companyManager.getCompaniesForClass(className);

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

            // Add distribute profits button
            const distributeProfitsBtn = document.createElement('button');
            distributeProfitsBtn.textContent = 'Distribuir Lucros';
            distributeProfitsBtn.className = 'profits-button';
            distributeProfitsBtn.title = 'Distribuir lucros para os membros da empresa';
            distributeProfitsBtn.style.backgroundColor = '#9b59b6'; // Purple color to distinguish the button
            
            // Only enable the button if there are profits to distribute
            if (company.getProfit() <= 0) {
                distributeProfitsBtn.disabled = true;
                distributeProfitsBtn.title = 'Não há lucros disponíveis para distribuir';
            }
            
            distributeProfitsBtn.addEventListener('click', () => this.showDistributeProfitsModal(company));

            buttonContainer.appendChild(addExpenseBtn);
            buttonContainer.appendChild(addRevenueBtn);
            buttonContainer.appendChild(distributeProfitsBtn);
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
            const classStudents = this.classManager.getStudents(company.classroomName);
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
}