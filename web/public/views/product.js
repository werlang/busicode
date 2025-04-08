/**
 * Product Manager
 * Manages products and product launches in the BusiCode application
 */
import Storage from '../helpers/storage.js';
import CompanyView from './company.js';
import ClassView from './class.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';
import Product from '../model/product.js';

export default class ProductView {
    constructor() {
        this.storage = new Storage('busicode_product_launches');
        this.launchedProducts = this.loadLaunchedProducts() || [];
        this.companyManager = new CompanyView();
        this.classManager = new ClassView();
    }

    /**
     * Initialize the ProductManager
     */
    initialize() {
        this.setupEventListeners();
        this.updateClassFilter();
        this.updateCompanyDropdown();
        this.renderLaunchedProducts();
    }

    /**
     * Load launched products from storage
     * @returns {Array} An array of launched products
     */
    loadLaunchedProducts() {
        const data = this.storage.loadData() || [];
        return data.map(product => new Product({
            id: product.id,
            name: product.name,
            price: product.price,
            companyId: product.companyId,
            sales: product.sales,
            total: product.total,
        }));
    }

    /**
     * Save launched products to storage
     */
    saveLaunchedProducts() {
        this.storage.saveData(this.launchedProducts);
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
                this.updateCompanyDropdown();
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
            this.launchedProducts = this.launchedProducts.filter(product => product.companyId !== companyId);
            this.saveLaunchedProducts();
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
        const classNames = [...new Set(
            this.launchedProducts
                .map(product => this.companyManager.getCompany(product.companyId)?.classroomName)
                .filter(className => className)
        )];
        
        // Add all available classes
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            filterSelect.appendChild(option);
        });
        
        // Restore selection if possible
        if (classNames.includes(currentSelection)) {
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
     * Launch a new product
     */
    launchProduct() {
        const companySelect = document.querySelector('#product-company-select');
        const productNameInput = document.querySelector('#product-name');
        const productPriceInput = document.querySelector('#product-price');
        
        const companyId = companySelect.value;
        const productName = productNameInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);
        
        // Validate inputs
        if (!companyId) {
            Toast.show({ message: 'Por favor, selecione uma empresa.', type: 'error' });
            return;
        }
        
        if (isNaN(productPrice) || productPrice <= 0) {
            Toast.show({ message: 'Por favor, insira um valor válido para o produto.', type: 'error' });
            return;
        }
        
        // Get company
        const company = this.companyManager.getCompany(companyId);
        if (!company) {
            Toast.show({ message: 'Empresa não encontrada.', type: 'error' });
            return;
        }
        
        // Add product to launched products list
        const launchedProduct = new Product({
            id: `launch_${Date.now()}`,
            name: productName,
            price: productPrice,
            companyId,
        });

        this.launchedProducts.push(launchedProduct);
        this.saveLaunchedProducts();
        this.updateCompanyDropdown();
        this.updateClassFilter();
        this.renderLaunchedProducts();
        
        // Reset form
        productNameInput.value = '';
        productPriceInput.value = '';
        
        Toast.show({ 
            message: `Produto "${productName}" lançado com sucesso para a empresa "${company.name}"!`, 
            type: 'success' 
        });
    }

    /**
     * Edit a product's price
     * @param {string} productId - ID of the product to edit
     */
    editProductPrice(productId) {
        const product = this.launchedProducts.find(p => p.id === productId);
        if (!product) return;
        
        const company = this.companyManager.getCompany(product.companyId);
        
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
                
                if (isNaN(newPrice) || newPrice <= 0) {
                    Toast.show({ message: 'Por favor, insira um valor válido para o produto.', type: 'error' });
                    return false;
                }
                
                product.updatePrice(newPrice);
                this.saveLaunchedProducts();
                this.renderLaunchedProducts();
                
                Toast.show({ 
                    message: `Preço do produto "${product.name}" atualizado para R$ ${newPrice.toFixed(2)}!`, 
                    type: 'success' 
                });
                
                return true;
            }
        });
    }

    /**
     * Render the list of launched products
     */
    renderLaunchedProducts() {
        this.launchedProducts = this.loadLaunchedProducts();
        const launchProductsBody = document.querySelector('#launch-products-body');
        if (!launchProductsBody) return;
        
        launchProductsBody.innerHTML = '';
        
        // Get selected class filter
        const selectedClass = document.querySelector('#product-filter-select').value;
        
        // Filter products by class if needed
        const filteredProducts = selectedClass 
            ? this.launchedProducts.filter(product => {
                const company = this.companyManager.getCompany(product.companyId);
                return company && company.classroomName === selectedClass;
            })
            : this.launchedProducts;
        
        if (filteredProducts.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 7;
            emptyCell.className = 'empty-table';
            emptyCell.textContent = selectedClass 
                ? `Nenhum produto lançado para a turma "${selectedClass}".`
                : 'Nenhum produto lançado.';
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
                if (newSalesValue <= 0) {
                    Toast.show({ message: 'Insira um valor válido para as vendas.', type: 'warning' });
                    return;
                }
                
                product.addSales(newSalesValue);

                document.dispatchEvent(new CustomEvent('productSalesUpdated', {
                    detail: {
                        productId: product.id,
                        productName: product.name,
                        sales: newSalesValue,
                        price: product.price,
                        companyId: product.companyId,
                    }
                }));
                
                // Update UI
                salesCell.textContent = product.sales;
                totalCell.textContent = `R$ ${product.total.toFixed(2)}`;
                newSalesInput.value = '';
                
                // Save changes
                this.saveLaunchedProducts();
                
                Toast.show({ 
                    message: `${newSalesValue} vendas adicionadas ao produto "${product.name}"!`, 
                    type: 'success' 
                });
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
            removeBtn.addEventListener('click', () => this.removeProduct(product.id));
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
     * Remove a product from the launched products list
     * @param {string} productId - ID of the product to remove
     */
    removeProduct(productId) {
        const index = this.launchedProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            const product = this.launchedProducts[index];
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
                    this.launchedProducts.splice(index, 1);
                    this.saveLaunchedProducts();
                    this.updateCompanyDropdown();
                    this.updateClassFilter();
                    this.renderLaunchedProducts();
                    Toast.show({ 
                        message: `Produto ${shownName} removido do lançamento com sucesso!`, 
                        type: 'success' 
                    });
                }
            });
        }
    }

}