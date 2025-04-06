/**
 * Product Manager
 * Manages products and product launches in the BusiCode application
 */
import Storage from './storage.js';
import CompanyManager from './company-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';
import Product from '../model/product.js';

export default class ProductManager {
    constructor() {
        this.storage = new Storage('busicode_product_launches');
        this.launchedProducts = this.loadLaunchedProducts() || [];
        this.companyManager = new CompanyManager();
    }

    /**
     * Initialize the ProductManager
     */
    initialize() {
        this.setupEventListeners();
        this.updateCompanyDropdown();
        this.renderLaunchedProducts();
    }

    /**
     * Load launched products from storage
     * @returns {Array} An array of launched products
     */
    loadLaunchedProducts() {
        const data = this.storage.loadData() || [];
        return data.map(product => new Product(product.id, product.name, product.price, product.companyId));
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

        // Initialize apply sales button
        const applySalesBtn = document.querySelector('#apply-sales-btn');
        if (applySalesBtn) {
            applySalesBtn.addEventListener('click', () => this.applySales());
        }

        // Listen for company creation event
        document.addEventListener('companyCreated', () => {
            this.updateCompanyDropdown();
        });

        // Listen for company deletion event
        document.addEventListener('companyDeleted', (event) => {
            const companyId = event.detail.companyId;
            this.launchedProducts = this.launchedProducts.filter(product => product.companyId !== companyId);
            this.saveLaunchedProducts();
            this.renderLaunchedProducts();
        });

        // Listen for section change events
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.sectionId === 'product-launch-section') {
                this.updateCompanyDropdown();
                this.renderLaunchedProducts();
            }
        });
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
        
        // Add all companies
        const companies = this.companyManager.getAllCompanies();
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
        const launchedProduct = new Product(
            `launch_${Date.now()}`,
            productName,
            productPrice,
            companyId
        );

        this.launchedProducts.push(launchedProduct);
        this.saveLaunchedProducts();
        
        // Reset form
        productNameInput.value = '';
        productPriceInput.value = '';
        
        // Refresh the UI
        this.renderLaunchedProducts();
        
        Toast.show({ 
            message: `Produto "${productName}" lançado com sucesso para a empresa "${company.name}"!`, 
            type: 'success' 
        });
    }

    /**
     * Render the list of launched products
     */
    renderLaunchedProducts() {
        this.launchedProducts = this.loadLaunchedProducts();

        const applySalesBtn = document.querySelector('#apply-sales-btn');
        if (applySalesBtn) {
            applySalesBtn.disabled = this.launchedProducts.length === 0;
        }

        const launchProductsBody = document.querySelector('#launch-products-body');
        if (!launchProductsBody) return;
        
        launchProductsBody.innerHTML = '';
        
        if (this.launchedProducts.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 6;
            emptyCell.className = 'empty-table';
            emptyCell.textContent = 'Nenhum produto lançado.';
            emptyRow.appendChild(emptyCell);
            launchProductsBody.appendChild(emptyRow);
            return;
        }

        // Check if we're in selling mode
        const sellingMode = document.querySelector('#apply-sales-btn') && 
                           !document.querySelector('#apply-sales-btn').disabled;
        
        this.launchedProducts.forEach(product => {
            const row = document.createElement('tr');
            
            // Company name
            const companyCell = document.createElement('td');
            companyCell.textContent = this.companyManager.getCompany(product.companyId).name;
            
            // Price
            const priceCell = document.createElement('td');
            priceCell.textContent = `R$ ${product.price.toFixed(2)}`;
            
            // Sales
            const salesCell = document.createElement('td');
            salesCell.textContent = product.sales;
            
            // Total
            const totalCell = document.createElement('td');
            totalCell.textContent = `R$ ${product.total.toFixed(2)}`;
            
            // Actions
            const actionsCell = document.createElement('td');
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remover';
            removeBtn.className = 'remove-btn';
            removeBtn.addEventListener('click', () => this.removeProduct(product.id));
            
            actionsCell.appendChild(removeBtn);
            
            // Add cells to row
            row.appendChild(companyCell);
            row.appendChild(priceCell);
            row.appendChild(salesCell);
            row.appendChild(totalCell);
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
            let shownName = product.productName.length ? `"${product.productName}"` : `da empresa "${product.companyName}"`;
            
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
                    this.renderLaunchedProducts();
                    Toast.show({ 
                        message: `Produto ${shownName} removido do lançamento com sucesso!`, 
                        type: 'success' 
                    });
                }
            });
        }
    }

    /**
     * Apply sales to companies
     */
    applySales() {
        if (this.launchedProducts.length === 0) {
            Toast.show({ message: 'Não há produtos para aplicar vendas.', type: 'error' });
            return;
        }

        // check if any sales
        const salesInputs = document.querySelectorAll('.sales-input');
        const hasSales = Array.from(salesInputs).some(input => parseInt(input.value) > 0);
        if (!hasSales) {
            Toast.show({ message: 'Nenhuma venda foi registrada.', type: 'error' });
            return;
        }

        // apply sales to companies
        const companies = this.companyManager.getAllCompanies();
        this.launchedProducts.forEach(product => {
            const company = companies.find(c => c.id === product.companyId);
            if (company) {
                const productInCompany = company.getProduct(product.productId);
                if (productInCompany) {
                    // Use Product class methods to add sales
                    productInCompany.addSales(product.sales);
                }
            }
        });
        this.companyManager.saveCompanies();
        
        // Reset sales in the UI
        this.launchedProducts.forEach(product => {
            const salesInput = document.querySelector(`input[data-product-id="${product.id}"]`);
            if (salesInput) {
                salesInput.value = 0;
            }
        });
        this.saveLaunchedProducts();
        this.renderLaunchedProducts();
        
        Toast.show({ 
            message: 'Vendas aplicadas com sucesso!', 
            type: 'success' 
        });
    }
}