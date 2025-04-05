/**
 * Company Operations Manager
 * Manages operations for running companies (finances, expenses, revenues)
 */
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class CompanyOperationsManager {
    constructor(classManager, companyManager) {
        this.classManager = classManager;
        this.companyManager = companyManager;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Set up event listeners for global events from other managers
        this.setupGlobalListeners();
    }

    /**
     * Initialize UI elements for company operations
     */
    initializeUI() {
        // Company display elements
        this.companyFilterSelect = document.getElementById('company-filter-select');
        this.companiesList = document.getElementById('companies-list');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update company filter select with available classes
        this.updateCompanyFilterSelect();
        
        // Render initial company list
        // this.renderCompanyList();
    }

    /**
     * Set up event listeners for company operations
     */
    setupEventListeners() {
        // Update company list when class selection changes
        this.companyFilterSelect.addEventListener('change', () => this.updateCompanyList());
    }
    
    /**
     * Set up global event listeners from other managers
     */
    setupGlobalListeners() {
        // Listen for company creation events
        document.addEventListener('companyCreated', (event) => {
            if (event.detail) {
                // If the current class filter matches the new company's class, update the list
                const currentClass = this.companyFilterSelect.value;
                if (!currentClass || currentClass === event.detail.className) {
                    this.renderCompanyList(currentClass);
                }
            }
        });
        
        // Listen for class deletion events
        document.addEventListener('classDeleted', (event) => {
            if (event.detail) {
                // If the deleted class is the current filter, reset the list
                const currentClass = this.companyFilterSelect.value;
                if (currentClass === event.detail.className) {
                    this.renderCompanyList();
                }
            }
        });
        
        // Listen for class list updates
        document.addEventListener('classSelectsUpdated', () => {
            // Check if the current filter is still valid
            const currentClass = this.companyFilterSelect.value;
            const classNames = this.classManager.getClassNames();
            if (currentClass && !classNames.includes(currentClass)) {
                this.renderCompanyList();
            }
            
            // Atualizar o select de filtro de empresas
            this.updateCompanyFilterSelect();
        });
    }

    /**
     * Update company filter select with available classes
     */
    updateCompanyFilterSelect() {
        const classNames = this.classManager.getClassNames();
        
        // Store the current selection
        const currentSelection = this.companyFilterSelect.value;
        
        // Clear options except the placeholder
        while (this.companyFilterSelect.options.length > 1) {
            this.companyFilterSelect.options.remove(1);
        }
        
        // Add class options
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            this.companyFilterSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
            this.companyFilterSelect.value = currentSelection;
        }
    }

    /**
     * Update company list based on selected class
     */
    updateCompanyList() {
        const className = this.companyFilterSelect.value;
        this.renderCompanyList(className);
    }

    /**
     * Render the list of companies
     * @param {string} className - Optional filter by class name
     */
    renderCompanyList(className = null) {
        this.companiesList.innerHTML = '';
        
        let companies;
        if (className) {
            companies = this.companyManager.getCompaniesForClass(className);
        } else {
            companies = this.companyManager.getAllCompanies();
        }
        
        if (companies.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'company-list-empty';
            emptyMessage.textContent = 'Nenhuma empresa cadastrada.';
            this.companiesList.appendChild(emptyMessage);
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
                        <div>Orçamento</div>
                        <div class="finance-value budget">R$ ${company.currentBudget.toFixed(2)}</div>
                    </div>
                    <div class="finance-item">
                        <div>Despesas</div>
                        <div class="finance-value expenses">R$ ${company.getTotalExpenses().toFixed(2)}</div>
                    </div>
                    <div class="finance-item">
                        <div>Lucro</div>
                        <div class="finance-value profit">R$ ${company.getProfit().toFixed(2)}</div>
                    </div>
                </div>
            `;
            
            companyCard.appendChild(companyContent);
            
            // Add products management section
            const productsContainer = document.createElement('div');
            productsContainer.className = 'products-management';
            productsContainer.innerHTML = `
                <h5>Produtos</h5>
                <button class="add-product-btn">+ Adicionar Produto</button>
                <div class="product-list"></div>
            `;
            
            // Add event listener to add product button
            productsContainer.querySelector('.add-product-btn').addEventListener('click', () => {
                this.showProductModal(company);
            });
            
            companyCard.appendChild(productsContainer);
            
            // Render products list
            const productList = productsContainer.querySelector('.product-list');
            this.renderProductList(company, productList);
            
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
                        this.companyManager.deleteCompany(company.id);
                        this.renderCompanyList();
                        Toast.show({ message: `Empresa "${company.name}" excluída com sucesso.`, type: 'success' });
                    }
                });
            });
            
            companyCard.appendChild(deleteBtn);
            this.companiesList.appendChild(companyCard);
        });
    }

    /**
     * Render the product list for a company
     * @param {Company} company - The company
     * @param {HTMLElement} container - The container to render products in
     */
    renderProductList(company, container) {
        container.innerHTML = '';
        
        const products = company.getProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<p class="no-products">Nenhum produto cadastrado.</p>';
            return;
        }
        
        const productTable = document.createElement('table');
        productTable.className = 'product-table';
        
        // Create table header
        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
            <tr>
                <th>Nome</th>
                <th>Preço de Venda (R$)</th>
                <th>Ações</th>
            </tr>
        `;
        productTable.appendChild(tableHeader);
        
        // Create table body
        const tableBody = document.createElement('tbody');
        
        products.forEach(product => {
            const row = document.createElement('tr');
            
            // Product name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = product.name;
            
            // Selling price cell
            const priceCell = document.createElement('td');
            priceCell.textContent = product.price.toFixed(2);
            
            // Actions cell
            const actionsCell = document.createElement('td');
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'edit-product-btn';
            editBtn.addEventListener('click', () => {
                this.showProductModal(company, product);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'delete-product-btn';
            deleteBtn.addEventListener('click', () => {
                Modal.show({
                    title: 'Confirmar Exclusão',
                    message: `Tem certeza que deseja excluir o produto "${product.name}"?`,
                    confirmText: 'Excluir',
                    cancelText: 'Cancelar',
                    type: 'danger',
                    onConfirm: () => {
                        this.companyManager.deleteProduct(company.id, product.id);
                        this.renderCompanyList();
                        Toast.show({ message: `Produto "${product.name}" excluído com sucesso.`, type: 'success' });
                    }
                });
            });
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            
            // Add cells to row
            row.appendChild(nameCell);
            row.appendChild(priceCell);
            row.appendChild(actionsCell);
            
            // Add row to table body
            tableBody.appendChild(row);
        });
        
        productTable.appendChild(tableBody);
        container.appendChild(productTable);
    }

    /**
     * Show a modal to add or edit a product
     * @param {Company} company - The company
     * @param {Object} product - The product to edit (optional)
     */
    showProductModal(company, product = null) {
        const isEditing = product !== null;
        const title = isEditing ? 'Editar Produto' : 'Adicionar Produto';
        
        Modal.showInput({
            title: title,
            fields: [
                {
                    id: 'name',
                    label: 'Nome do Produto:',
                    type: 'text',
                    placeholder: 'Ex: Caneta Personalizada',
                    value: isEditing ? product.name : '',
                    required: true
                },
                {
                    id: 'description',
                    label: 'Descrição:',
                    type: 'text',
                    placeholder: 'Descreva o produto',
                    value: isEditing ? product.description : '',
                    required: false
                },
                {
                    id: 'price',
                    label: 'Preço de Venda (R$):',
                    type: 'number',
                    placeholder: '0.00',
                    value: isEditing ? product.price : '',
                    required: true
                },
            ],
            confirmText: 'Salvar',
            cancelText: 'Cancelar',
            onConfirm: (values) => {
                const { name, description, price } = values;
                
                if (!name) {
                    Toast.show({ message: 'Por favor, insira um nome para o produto.', type: 'error' });
                    return;
                }
                
                if (isNaN(price) || parseFloat(price) <= 0) {
                    Toast.show({ message: 'Por favor, insira um preço de venda válido.', type: 'error' });
                    return;
                }
                
                if (isEditing) {
                    this.companyManager.updateProduct(company.id, product.id, {
                        name,
                        description,
                        price: parseFloat(price),
                    });
                    Toast.show({ message: 'Produto atualizado com sucesso!', type: 'success' });
                } else {
                    this.companyManager.addProduct(company.id, name, description, price);
                    
                    // Trigger navigation event to ensure tab state is saved
                    document.dispatchEvent(new CustomEvent('productModified', {
                        detail: { 
                            section: 'company-operations-section',
                            companyId: company.id 
                        }
                    }));
                    
                    Toast.show({ message: 'Produto adicionado com sucesso!', type: 'success' });
                }
                
                this.renderCompanyList();
            }
        });
    }

}