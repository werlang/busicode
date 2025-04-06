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
        const launchedProduct = new Product({
            id: `launch_${Date.now()}`,
            name: productName,
            price: productPrice,
            companyId,
        });

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

        this.launchedProducts.forEach(product => {
            const row = document.createElement('tr');
            
            // Company name
            const companyCell = document.createElement('td');
            companyCell.textContent = this.companyManager.getCompany(product.companyId).name;
            
            // Product name
            const nameCell = document.createElement('td');
            nameCell.textContent = product.name;
            
            // Price
            const priceCell = document.createElement('td');
            priceCell.textContent = `R$ ${product.price.toFixed(2)}`;
            
            // Total Sales (read-only)
            const salesCell = document.createElement('td');
            salesCell.textContent = product.sales || 0;
            
            // Total Revenue
            const totalCell = document.createElement('td');
            totalCell.textContent = `R$ ${product.total.toFixed(2)}`;
            
            // New Sales Input
            const newSalesCell = document.createElement('td');
            
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