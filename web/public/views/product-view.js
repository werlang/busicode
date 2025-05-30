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
    constructor() {
        this.productManager = new ProductManager();
        this.companyManager = new CompanyManager();
        this.classManager = new ClassManager();
        this.navigationStorage = new Storage('busicode_navigation'); // For remembering filters
    }

    /**
     * Initialize the ProductView
     */
    initialize() {
        this.setupEventListeners();
        this.restoreProductFilters();
        this.updateClassFilter();
        this.updateCompanyDropdown();
        this.renderLaunchedProducts();
        return this;
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
            launchProductBtn.addEventListener('click', () => this.launchProduct());
        }

        // Listen for class selection changes
        document.addEventListener('classSelectsUpdated', () => {
            this.updateClassFilter();
            this.updateCompanyDropdown();
            this.renderLaunchedProducts();
        });

        // Listen for class filter changes
        const productFilterSelect = document.querySelector('#product-filter-select');
        if (productFilterSelect) {
            productFilterSelect.addEventListener('change', () => {
                // Save to navigation storage
                const navData = this.navigationStorage.loadData() || {};
                navData.productClassFilter = productFilterSelect.value;
                this.navigationStorage.saveData(navData);
                this.updateCompanyDropdown();
                this.renderLaunchedProducts();
            });
        }
        // Date filter event listeners
        const applyDateFilterBtn = document.querySelector('#apply-date-filter');
        if (applyDateFilterBtn) {
            applyDateFilterBtn.addEventListener('click', () => {
                // Save to navigation storage
                const navData = this.navigationStorage.loadData() || {};
                const startDateInput = document.querySelector('#product-start-date');
                const endDateInput = document.querySelector('#product-end-date');
                navData.productStartDate = startDateInput ? startDateInput.value : '';
                navData.productEndDate = endDateInput ? endDateInput.value : '';
                this.navigationStorage.saveData(navData);
                this.renderLaunchedProducts();
            });
        }
        const clearDateFilterBtn = document.querySelector('#clear-date-filter');
        if (clearDateFilterBtn) {
            clearDateFilterBtn.addEventListener('click', () => {
                // Clear from navigation storage
                const navData = this.navigationStorage.loadData() || {};
                navData.productStartDate = '';
                navData.productEndDate = '';
                this.navigationStorage.saveData(navData);
                document.querySelector('#product-start-date').value = '';
                document.querySelector('#product-end-date').value = '';
                this.renderLaunchedProducts();
            });
        }

        // Listen for company creation event
        document.addEventListener('companyCreated', () => {
            this.updateClassFilter();
            this.updateCompanyDropdown();
        });

        // Listen for company deletion event
        document.addEventListener('companyDeleted', (event) => {
            const companyId = event.detail.companyId;
            this.productManager.removeProductsByCompany(companyId);
            this.updateClassFilter();
            this.updateCompanyDropdown();
            this.renderLaunchedProducts();
        });

        // Listen for class deletion
        document.addEventListener('classDeleted', (event) => {
            this.updateClassFilter();
            this.updateCompanyDropdown();
            this.renderLaunchedProducts();
        });

        // Listen for section change events
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.sectionId === 'product-launch-section') {
                this.updateClassFilter();
                this.updateCompanyDropdown();
                this.renderLaunchedProducts();
            }
        });
    }

    /**
     * Update class filter dropdown
     */
    updateClassFilter() {
        const filterSelect = document.querySelector('#product-filter-select');
        if (!filterSelect) return;
        // Save current selection
        const currentSelection = filterSelect.value;
        // Clear options except the default one
        while (filterSelect.options.length > 1) {
            filterSelect.options.remove(1);
        }
        
        // Get unique class names from companies that have products
        const products = this.productManager.getAllLaunchedProducts();
        const companies = products.map(product => this.companyManager.getCompany(product.companyId));
        const classes = companies.map(company => {
            const classroom = this.classManager.getClassById(company.classroomId);
            return {
                id: classroom.id,
                name: classroom.name,
            }
        });
        const uniqueClasses = classes.filter((value, index, self) => self.map(e => e.id).indexOf(value.id) === index);


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
    }

    /**
     * Update company dropdown in the product launch section
     */
    updateCompanyDropdown() {
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
            ? this.companyManager.getCompaniesForClass(selectedClass)
            : this.companyManager.getAllCompanies();
        
        // Add filtered companies
        companies.forEach(company => {
            company.classroomName = this.classManager.getClassById(company.classroomId).name;
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = `${company.name} (${company.classroomName})`;
            companySelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (currentSelection && [...companySelect.options].some(opt => opt.value === currentSelection)) {
            companySelect.value = currentSelection;
        }
    }

    /**
     * Launch a new product using form input
     */
    launchProduct() {
        const companySelect = document.querySelector('#product-company-select');
        const productNameInput = document.querySelector('#product-name');
        const productPriceInput = document.querySelector('#product-price');
        
        const companyId = companySelect.value;
        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);
        
        // Use the product manager to launch the product
        const result = this.productManager.launchProduct(companyId, productName, productPrice);
        
        if (!result.success) {
            Toast.show({ message: result.message, type: 'error' });
            return;
        }
        
        // Reset form
        productNameInput.value = '';
        productPriceInput.value = '';
        
        // Update UI
        this.updateCompanyDropdown();
        this.updateClassFilter();
        this.renderLaunchedProducts();
        
        Toast.show({ message: result.message, type: 'success' });
    }

    /**
     * Show a modal to edit a product's price
     * @param {string} productId - ID of the product to edit
     */
    editProductPrice(productId) {
        const product = this.productManager.getProduct(productId);
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
            onConfirm: (values) => {
                const newPrice = parseFloat(values.price);
                
                const result = this.productManager.editProductPrice(productId, newPrice);
                
                if (!result.success) {
                    Toast.show({ message: result.message, type: 'error' });
                    return false;
                }
                
                this.renderLaunchedProducts();
                Toast.show({ message: result.message, type: 'success' });
                return true;
            }
        });
    }

    /**
     * Render the list of launched products
     */
    renderLaunchedProducts() {
        const launchProductsBody = document.querySelector('#launch-products-body');
        if (!launchProductsBody) return;
        
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
            ? this.productManager.getLaunchedProductsByClassId(selectedClass)
            : this.productManager.getAllLaunchedProducts();
        
        // Apply date filtering if either date is set
        if (startDate || endDate) {
            if (startDate && endDate) {
                filteredProducts = this.productManager.getProductsByDateRange(startDate, endDate);
            } else if (startDate) {
                filteredProducts = this.productManager.getProductsByDateRange(startDate);
            } else if (endDate) {
                // For end date only, we get all products up to that date
                filteredProducts = this.productManager.getProductsByDateRange(new Date(0), endDate);
            }

            // Re-apply class filter if needed
            if (selectedClass) {
                filteredProducts = filteredProducts.filter(product => {
                    const company = this.companyManager.getCompany(product.companyId);
                    return company && company.classroomId === selectedClass;
                });
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

        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            
            // Company name
            const companyCell = document.createElement('td');
            companyCell.setAttribute('data-label', 'Empresa');
            companyCell.textContent = this.companyManager.getCompany(product.companyId).name;
            
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
            
            // New Sales Input
            const newSalesCell = document.createElement('td');
            newSalesCell.setAttribute('data-label', 'Nova Venda');
            
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
            addSalesBtn.addEventListener('click', () => {
                const newSalesValue = parseInt(newSalesInput.value) || 0;
                
                // Use the product manager to add sales
                const result = this.productManager.addProductSales(product.id, newSalesValue);
                
                if (!result.success) {
                    Toast.show({ message: result.message, type: 'warning' });
                    return;
                }
                
                // Notify company manager about the sales
                document.dispatchEvent(new CustomEvent('productSalesUpdated', {
                    detail: {
                        productId: result.product.id,
                        productName: result.product.name,
                        sales: result.salesCount,
                        price: result.price,
                        companyId: result.companyId,
                    }
                }));
                
                // Update UI
                salesCell.textContent = result.product.sales;
                totalCell.textContent = `R$ ${result.product.total.toFixed(2)}`;
                newSalesInput.value = '';
                
                Toast.show({ message: result.message, type: 'success' });
            });
            
            salesInputContainer.appendChild(newSalesInput);
            salesInputContainer.appendChild(addSalesBtn);
            newSalesCell.appendChild(salesInputContainer);
            
            // Actions
            const actionsCell = document.createElement('td');
            actionsCell.className = 'action-buttons';
            
            // Edit price button
            const editPriceBtn = document.createElement('button');
            editPriceBtn.textContent = 'Editar Preço';
            editPriceBtn.className = 'edit-product-btn';
            editPriceBtn.addEventListener('click', () => this.editProductPrice(product.id));
            actionsCell.appendChild(editPriceBtn);
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remover';
            removeBtn.className = 'remove-btn';
            removeBtn.addEventListener('click', () => this.showRemoveProductModal(product.id));
            actionsCell.appendChild(removeBtn);
            
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
    showRemoveProductModal(productId) {
        const product = this.productManager.getProduct(productId);
        if (!product) return;
        
        const company = this.companyManager.getCompany(product.companyId);
        let shownName = product.name.length ? `"${product.name}"` : `da empresa "${company.name}"`;
        
        // Show confirmation modal
        Modal.show({
            title: 'Confirmar Remoção',
            message: `Tem certeza que deseja remover o produto ${shownName} do lançamento?`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            type: 'warning',
            onConfirm: () => {
                const result = this.productManager.removeProduct(productId);
                
                if (result.success) {
                    this.updateCompanyDropdown();
                    this.updateClassFilter();
                    this.renderLaunchedProducts();
                    Toast.show({ message: result.message, type: 'success' });
                } else {
                    Toast.show({ message: result.message, type: 'error' });
                }
            }
        });
    }
}