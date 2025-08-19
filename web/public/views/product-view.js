/**
 * Product View
 * Handles UI rendering for products in the BusiCode application
 */
import ProductManager from '../helpers/product-manager.js';
import CompanyManager from '../helpers/company-manager.js';
import ClassManager from '../helpers/class-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';
import Storage from '../helpers/storage.js';

export default class ProductView {
    constructor(isAuthenticated = false) {
        this.productManager = new ProductManager();
        this.companyManager = new CompanyManager();
        this.classManager = new ClassManager();
        this.navigationStorage = new Storage('busicode_navigation'); // For remembering filter
        this.isReadOnlyMode = !isAuthenticated; // Set based on initial auth state
    }

    /**
     * Initialize the ProductView
     */
    async initialize() {
        this.setupEventListeners();
        this.restoreProductFilters();
        
        // Listen for read-only mode changes
        document.addEventListener('readOnlyModeChanged', async (event) => {
            this.isReadOnlyMode = event.detail.isReadOnly;
            await this.handleReadOnlyMode();
        });
        
        return this;
    }

    /**
     * Handle read-only mode changes for dynamically generated elements
     */
    async handleReadOnlyMode() {
        // Update table headers based on read-only state
        this.updateTableHeaders();
        // Re-render the product list to apply read-only state to dynamic buttons
        await this.renderLaunchedProducts();
    }

    /**
     * Update table headers based on authentication state
     */
    updateTableHeaders() {
        const table = document.querySelector('#launch-products-table');
        if (!table) return;

        const headerRow = table.querySelector('thead tr');
        if (!headerRow) return;

        const headers = headerRow.querySelectorAll('th');
        
        // Hide/show "Nova Venda" and "Ações" columns based on read-only mode
        if (headers.length >= 7) {
            const newSaleHeader = headers[5]; // "Nova Venda"
            const actionsHeader = headers[6]; // "Ações"
            
            if (this.isReadOnlyMode) {
                newSaleHeader.style.display = 'none';
                actionsHeader.style.display = 'none';
            } else {
                newSaleHeader.style.display = '';
                actionsHeader.style.display = '';
            }
        }
    }

    restoreProductFilters() {
        // Restore class and date filters from navigation storage
        const navData = this.navigationStorage.loadData() || {};
        const productFilterSelect = document.querySelector('#product-filter-select');
        const startDateInput = document.querySelector('#product-start-date');
        const endDateInput = document.querySelector('#product-end-date');
        if (productFilterSelect && navData.productClassFilter) {
            productFilterSelect.value = navData.productClassFilter;
        }
        if (startDateInput && navData.productStartDate) {
            startDateInput.value = navData.productStartDate;
        }
        if (endDateInput && navData.productEndDate) {
            endDateInput.value = navData.productEndDate;
        }
    }

    /**
     * Setup event listeners for product launch functionality
     */
    setupEventListeners() {
        // Initialize launch button
        const launchProductBtn = document.querySelector('#launch-product-btn');
        if (launchProductBtn) {
            launchProductBtn.addEventListener('click', async () => await this.launchProduct());
        }

        // Listen for class selection changes
        document.addEventListener('companyUpdate', async () => {
            await this.updateClassFilter();
            await this.updateCompanyDropdown();
            await this.renderLaunchedProducts();
        });

        // Listen for class filter changes
        const productFilterSelect = document.querySelector('#product-filter-select');
        if (productFilterSelect) {
            productFilterSelect.addEventListener('change', async () => {
                // Save to navigation storage
                const navData = this.navigationStorage.loadData() || {};
                navData.productClassFilter = productFilterSelect.value;
                this.navigationStorage.saveData(navData);
                document.dispatchEvent(new CustomEvent('companyUpdate'));
            });
        }
        // Date filter event listeners
        const applyDateFilterBtn = document.querySelector('#apply-date-filter');
        if (applyDateFilterBtn) {
            applyDateFilterBtn.addEventListener('click', async () => {
                // Save to navigation storage
                const navData = this.navigationStorage.loadData() || {};
                const startDateInput = document.querySelector('#product-start-date');
                const endDateInput = document.querySelector('#product-end-date');
                navData.productStartDate = startDateInput ? startDateInput.value : '';
                navData.productEndDate = endDateInput ? endDateInput.value : '';
                this.navigationStorage.saveData(navData);
                await this.renderLaunchedProducts();
            });
        }
        const clearDateFilterBtn = document.querySelector('#clear-date-filter');
        if (clearDateFilterBtn) {
            clearDateFilterBtn.addEventListener('click', async () => {
                // Clear from navigation storage
                const navData = this.navigationStorage.loadData() || {};
                navData.productStartDate = '';
                navData.productEndDate = '';
                this.navigationStorage.saveData(navData);
                document.querySelector('#product-start-date').value = '';
                document.querySelector('#product-end-date').value = '';
                await this.renderLaunchedProducts();
            });
        }

        // Listen for company creation event
        document.addEventListener('companyCreated', () => {
            document.dispatchEvent(new CustomEvent('companyUpdate'));
        });

        // Listen for company deletion event
        document.addEventListener('companyDeleted', async (event) => {
            const companyId = event.detail.companyId;
            await this.productManager.removeProductsByCompany(companyId);
            document.dispatchEvent(new CustomEvent('companyUpdate'));
        });

        // Listen for class deletion
        document.addEventListener('classDeleted', async (event) => {
            document.dispatchEvent(new CustomEvent('companyUpdate'));
        });

        // Listen for section change events
        document.addEventListener('sectionChanged', async (event) => {
            if (event.detail.sectionId === 'product-launch-section') {
                document.dispatchEvent(new CustomEvent('companyUpdate'));
            }
        });
    }

    /**
     * Update class filter dropdown
     */
    async updateClassFilter() {
        const filterSelect = document.querySelector('#product-filter-select');
        if (!filterSelect) return;
        // Save current selection
        const currentSelection = filterSelect.value;
        // Clear options except the default one
        while (filterSelect.options.length > 1) {
            filterSelect.options.remove(1);
        }
        
        // Get unique class names from companies that have products
        try {
            const products = await this.productManager.getAllLaunchedProducts();
            const productsArray = Array.isArray(products) ? products : [];
            
            const companies = await Promise.all(productsArray.map(product => this.companyManager.getCompany(product.companyId)));
            const companiesArray = companies.filter(company => company && company.classId);
            
            const classes = await Promise.all(companiesArray.map(async company => {
                try {
                    const classroom = await this.classManager.getClassById(company.classId);
                    return classroom ? {
                        id: classroom.id,
                        name: classroom.name,
                    } : null;
                } catch (error) {
                    console.warn('Error getting classroom:', error);
                    return null;
                }
            }));
            
            const validClasses = classes.filter(cls => cls !== null);
            const uniqueClasses = validClasses.filter((value, index, self) => self.map(e => e.id).indexOf(value.id) === index);

            // Sort classes alphabetically by name
            uniqueClasses.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));

            // Add all available classes
            uniqueClasses.forEach(classroom => {
                const option = document.createElement('option');
                option.value = classroom.id;
                option.textContent = classroom.name;
                filterSelect.appendChild(option);
            });
            
            // Restore selection if possible (prefer navigation storage)
            const navData = this.navigationStorage.loadData() || {};
            if (navData.productClassFilter && [...filterSelect.options].some(opt => opt.value === navData.productClassFilter)) {
                filterSelect.value = navData.productClassFilter;
            } else if (currentSelection && [...filterSelect.options].some(opt => opt.value === currentSelection)) {
                filterSelect.value = currentSelection;
            }
        } catch (error) {
            console.error('Error updating class filter:', error);
        }
    }

    /**
     * Update company dropdown in the product launch section
     */
    async updateCompanyDropdown() {
        const companySelect = document.querySelector('#product-company-select');
        if (!companySelect) return;

        // Save current selection
        const currentSelection = companySelect.value;
        
        // Clear options except the default one
        while (companySelect.options.length > 1) {
            companySelect.options.remove(1);
        }
        
        // Get selected class filter
        const selectedClass = document.querySelector('#product-filter-select').value;
        
        // Get companies filtered by class if needed
        const companies = selectedClass 
            ? await this.companyManager.getCompaniesForClass(selectedClass)
            : await this.companyManager.getAllCompanies();

        // Add company names and sort alphabetically
        for (const company of companies) {
            const classroom = await this.classManager.getClassById(company.classId);
            company.classroomName = classroom?.name || 'Unknown Class';
        }
        companies.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));

        // Add filtered companies
        for (const company of companies) {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = `${company.name} (${company.classroomName})`;
            companySelect.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentSelection && [...companySelect.options].some(opt => opt.value === currentSelection)) {
            companySelect.value = currentSelection;
        }
    }

    /**
     * Launch a new product using form input
     */
    async launchProduct() {
        const companySelect = document.querySelector('#product-company-select');
        const productNameInput = document.querySelector('#product-name');
        const productPriceInput = document.querySelector('#product-price');
        
        const companyId = companySelect.value;
        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);

        if (!companyId || !productName || isNaN(productPrice)) {
            Toast.show({ message: 'Por favor, preencha todos os campos corretamente.', type: 'error' });
            return;
        }

        // Use the product manager to launch the product
        const result = await this.productManager.launchProduct(companyId, productName, productPrice);
        
        if (!result.success) {
            Toast.show({ message: 'Erro ao lançar produto: ' + result.message, type: 'error' });
            return;
        }
        
        // Reset form
        productNameInput.value = '';
        productPriceInput.value = '';
        
        // Update UI
        document.dispatchEvent(new CustomEvent('companyUpdate'));
        Toast.show({ message: 'Produto lançado com sucesso!', type: 'success' });
    }

    /**
     * Show a modal to edit a product's price
     * @param {string} productId - ID of the product to edit
     */
    async editProductPrice(productId) {
        const product = await this.productManager.getProduct(productId);
        if (!product) return;
        
        Modal.showInput({
            title: 'Editar Preço do Produto',
            fields: [
                {
                    id: 'price',
                    label: 'Novo Preço (R$):',
                    type: 'number',
                    placeholder: '0.00',
                    value: product.price.toFixed(2),
                    required: true
                }
            ],
            confirmText: 'Salvar',
            cancelText: 'Cancelar',
            onConfirm: async (values) => {
                const newPrice = parseFloat(values.price);
                
                const result = await this.productManager.editProductPrice(productId, newPrice);
                
                if (!result.success) {
                    Toast.show({ message: result.message, type: 'error' });
                    return false;
                }
                
                document.dispatchEvent(new CustomEvent('companyUpdate'));
                Toast.show({ message: result.message, type: 'success' });
                return true;
            }
        });
    }

    /**
     * Render the list of launched products
     */
    async renderLaunchedProducts() {
        const launchProductsBody = document.querySelector('#launch-products-body');
        if (!launchProductsBody) return;
        
        // Update table headers based on read-only mode
        this.updateTableHeaders();
        
        launchProductsBody.innerHTML = '';
        
        // Get selected class filter
        const selectedClass = document.querySelector('#product-filter-select').value;
        const selectedClassName = document.querySelector('#product-filter-select').selectedOptions[0].textContent;
        
        // Get date filters if they exist
        const startDateInput = document.querySelector('#product-start-date');
        const endDateInput = document.querySelector('#product-end-date');
        const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
        const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
        
        // Get products filtered by class if needed
        let filteredProducts = selectedClass 
            ? await this.productManager.getLaunchedProductsByClassId(selectedClass)
            : await this.productManager.getAllLaunchedProducts();

        // Apply date filtering if either date is set
        if (startDate || endDate) {
            if (startDate && endDate) {
                filteredProducts = await this.productManager.getProductsByDateRange(new Date(startDate), new Date(endDate));
            } else if (startDate) {
                filteredProducts = await this.productManager.getProductsByDateRange(new Date(startDate));
            } else if (endDate) {
                // For end date only, we get all products up to that date
                filteredProducts = await this.productManager.getProductsByDateRange(new Date(0), new Date(endDate));
            }
            // Re-apply class filter if needed
            if (selectedClass) {
                const filteredByClass = [];
                for (const product of filteredProducts) {
                    const company = await this.companyManager.getCompany(product.companyId);
                    if (company && company.classId === selectedClass) {
                        filteredByClass.push(product);
                    }
                }
                filteredProducts = filteredByClass;
            }
        }
        
        if (filteredProducts.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 7;
            emptyCell.className = 'empty-table';
            
            let emptyMessage = 'Nenhum produto lançado.';
            if (selectedClass) {
                emptyMessage = `Nenhum produto lançado para a turma "${selectedClassName}".`;
            }
            if (startDate || endDate) {
                emptyMessage += ' (Filtro de data aplicado)';
            }
            
            emptyCell.textContent = emptyMessage;
            emptyRow.appendChild(emptyCell);
            launchProductsBody.appendChild(emptyRow);
            return;
        }

        // Sort products alphabetically by name
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));

        filteredProducts.forEach(async product => {
            const row = document.createElement('tr');
            
            // Company name
            const companyCell = document.createElement('td');
            companyCell.setAttribute('data-label', 'Empresa');
            companyCell.textContent = (await this.companyManager.getCompany(product.companyId)).name;
            
            // Product name
            const nameCell = document.createElement('td');
            nameCell.setAttribute('data-label', 'Produto');
            nameCell.textContent = product.name;
            
            // Price
            const priceCell = document.createElement('td');
            priceCell.setAttribute('data-label', 'Preço');
            priceCell.textContent = `R$ ${product.price.toFixed(2)}`;
            
            // Total Sales (read-only)
            const salesCell = document.createElement('td');
            salesCell.setAttribute('data-label', 'Vendas Totais');
            salesCell.textContent = product.sales || 0;
            
            // Total Revenue
            const totalCell = document.createElement('td');
            totalCell.setAttribute('data-label', 'Receita Total');
            totalCell.textContent = `R$ ${product.total.toFixed(2)}`;
            
            // New Sales Input - only render if not in read-only mode
            const newSalesCell = document.createElement('td');
            newSalesCell.setAttribute('data-label', 'Nova Venda');
            
            if (!this.isReadOnlyMode) {
                const salesInputContainer = document.createElement('div');
                salesInputContainer.className = 'sales-input-container';
                
                // Create input for new sales
                const newSalesInput = document.createElement('input');
                newSalesInput.type = 'number';
                newSalesInput.min = '0';
                newSalesInput.className = 'new-sales-input';
                newSalesInput.placeholder = '0';
                newSalesInput.value = '';
                
                // Create add button
                const addSalesBtn = document.createElement('button');
                addSalesBtn.textContent = '+';
                addSalesBtn.className = 'add-sales-btn';
                addSalesBtn.title = 'Adicionar vendas';
                addSalesBtn.addEventListener('click', async () => {
                    const newSalesValue = parseInt(newSalesInput.value) || 0;

                    if (!newSalesValue) {
                        Toast.show({ message: 'Por favor, insira um valor válido para as vendas.', type: 'error' });
                        return;
                    }

                    // Use the product manager to add sales
                    const result = await this.productManager.addProductSales(product.id, newSalesValue);
                    
                    if (!result.success) {
                        Toast.show({ message: 'Erro ao adicionar vendas: ' + result.message, type: 'error' });
                        return;
                    }
                    
                    // Notify company manager about the sales
                    document.dispatchEvent(new CustomEvent('companyUpdate'));
                    document.dispatchEvent(new CustomEvent('productSalesUpdated'));
                    
                    // Update UI
                    salesCell.textContent = result.product.sales;
                    totalCell.textContent = `R$ ${result.product.total.toFixed(2)}`;
                    newSalesInput.value = '';
                    
                    Toast.show({ message: result.message, type: 'success' });
                });
                
                salesInputContainer.appendChild(newSalesInput);
                salesInputContainer.appendChild(addSalesBtn);
                newSalesCell.appendChild(salesInputContainer);
            } else {
                newSalesCell.style.display = 'none'; // Hide entire column in read-only
            }
            
            // Actions - only render if not in read-only mode
            const actionsCell = document.createElement('td');
            actionsCell.setAttribute('data-label', 'Ações');
            
            if (!this.isReadOnlyMode) {
                actionsCell.className = 'action-buttons';
                
                // Edit price button
                const editPriceBtn = document.createElement('button');
                editPriceBtn.textContent = 'Editar Preço';
                editPriceBtn.className = 'edit-product-btn';
                editPriceBtn.addEventListener('click', async () => await this.editProductPrice(product.id));
                actionsCell.appendChild(editPriceBtn);
                
                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remover';
                removeBtn.className = 'remove-btn';
                removeBtn.addEventListener('click', async () => await this.showRemoveProductModal(product.id));
                actionsCell.appendChild(removeBtn);
            } else {
                actionsCell.style.display = 'none'; // Hide entire column in read-only
            }
            
            // Add cells to row
            row.appendChild(companyCell);
            row.appendChild(nameCell);
            row.appendChild(priceCell);
            row.appendChild(salesCell);
            row.appendChild(totalCell);
            row.appendChild(newSalesCell);
            row.appendChild(actionsCell);
            
            launchProductsBody.appendChild(row);
        });
    }

    /**
     * Show confirmation modal for removing a product
     * @param {string} productId - ID of the product to remove
     */
    async showRemoveProductModal(productId) {
        const product = await this.productManager.getProduct(productId);
        if (!product) return;
        
        const company = await this.companyManager.getCompany(product.companyId);
        let shownName = product.name.length ? `"${product.name}"` : `da empresa "${company.name}"`;
        
        // Show confirmation modal
        Modal.show({
            title: 'Confirmar Remoção',
            message: `Tem certeza que deseja remover o produto ${shownName} do lançamento?`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            type: 'warning',
            onConfirm: async () => {
                const result = await this.productManager.removeProduct(productId);
                
                if (result.success) {
                    document.dispatchEvent(new CustomEvent('companyUpdate'));
                    Toast.show({ message: 'Produto removido com sucesso!', type: 'success' });
                } else {
                    Toast.show({ message: 'Erro ao remover produto: ' + result.message, type: 'error' });
                }
            }
        });
    }
}