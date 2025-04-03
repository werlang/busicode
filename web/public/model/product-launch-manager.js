/**
 * Product Launch Manager
 * Manages the product launch feature including selecting products,
 * running sales rounds, and updating company funds
 */
import Storage from '../helpers/storage.js';
import CompanyManager from '../helpers/company-manager.js';
import UIManager from './ui-manager.js';
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class ProductLaunchManager {
    constructor() {
        this.storageManager = new Storage('busicode_product_launches');
        this.companyManager = new CompanyManager();
        this.uiManager = new UIManager(this.companyManager.classManager, this.companyManager);
        this.currentLaunch = {
            products: []
        };
        
        this.init();
    }
    
    /**
     * Initialize the product launch manager
     */
    init() {
        this.setupUIElements();
        this.setupEventListeners();
        this.loadCompanies();
    }
    
    /**
     * Setup UI elements references
     */
    setupUIElements() {
        // Company select
        this.companySelect = document.getElementById('launch-company-select');
        
        // Product selection
        this.productSelectionContainer = document.getElementById('product-selection-container');
        this.addSelectedProductsBtn = document.getElementById('add-selected-products-btn');
        
        // Launch products table
        this.launchProductsBody = document.getElementById('launch-products-body');
        
        // Action buttons
        this.startSellingRoundBtn = document.getElementById('start-selling-round-btn');
        this.applySalesBtn = document.getElementById('apply-sales-btn');
        this.clearLaunchBtn = document.getElementById('clear-launch-btn');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for company filter changes
        this.companySelect.addEventListener('change', () => {
            this.loadProductsForSelection();
        });
        
        // Add selected products button
        this.addSelectedProductsBtn.addEventListener('click', () => {
            this.addSelectedProductsToLaunch();
        });
        
        // Start selling round button
        this.startSellingRoundBtn.addEventListener('click', () => {
            this.startSellingRound();
        });
        
        // Apply sales button
        this.applySalesBtn.addEventListener('click', () => {
            this.applySales();
        });
        
        // Clear launch button
        this.clearLaunchBtn.addEventListener('click', () => {
            this.clearLaunch();
        });
        
        // Listen for section changes
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.sectionId === 'product-launch-section') {
                this.onSectionActivated();
            }
        });
    }
    
    /**
     * Called when the product launch section is activated
     */
    onSectionActivated() {
        this.loadCompanies();
        this.loadProductsForSelection();
        this.renderLaunchProducts();
    }
    
    /**
     * Load companies for the company select dropdown
     */
    loadCompanies() {
        const companies = this.companyManager.getAllCompanies();
        
        // Clear current options
        while (this.companySelect.options.length > 1) {
            this.companySelect.remove(1);
        }
        
        // Add company options
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = `${company.name} (${company.classroomName})`;
            this.companySelect.appendChild(option);
        });
    }
    
    /**
     * Load products for selection based on the selected company filter
     */
    loadProductsForSelection() {
        // Clear the current product selection
        this.productSelectionContainer.innerHTML = '';
        
        // Get the selected company filter
        const selectedCompanyId = this.companySelect.value;
        
        let companies// = this.companyManager.loadCompanies();

        // Get companies based on filter
        if (selectedCompanyId) {
            const company = this.companyManager.getCompany(selectedCompanyId);
            companies = company ? [company] : [];
        } else {
            companies = this.companyManager.getAllCompanies();
        }

        // No companies or no products
        if (companies.length === 0) {
            this.productSelectionContainer.innerHTML = '<p>Nenhuma empresa disponível.</p>';
            return;
        }
        
        // Create product selection UI for each company
        companies.forEach(company => {
            const products = company.getProducts();
            console.log(`Products for ${company.name}:`, products);
            
            if (products.length === 0) {
                return; // Skip companies with no products
            }
            
            // Create company product section
            const companySection = document.createElement('div');
            companySection.className = 'company-products-section';
            
            // Company header
            const companyHeader = document.createElement('h4');
            companyHeader.textContent = `${company.name} (${company.classroomName})`;
            companySection.appendChild(companyHeader);
            
            // Create product list
            const productList = document.createElement('div');
            productList.className = 'product-selection-list';
            
            // Add product checkboxes
            products.forEach(product => {
                // Check if product is already in current launch
                const isAlreadyInLaunch = this.currentLaunch.products.some(
                    p => p.product.id === product.id && p.company.id === company.id
                );
                
                // Create product selection item
                const productItem = document.createElement('div');
                productItem.className = 'product-selection-item';
                
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `product-${company.id}-${product.id}`;
                checkbox.value = product.id;
                checkbox.dataset.companyId = company.id;
                checkbox.disabled = isAlreadyInLaunch;
                
                // Create label
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = `${product.name} - R$ ${product.price.toFixed(2)}`;
                if (isAlreadyInLaunch) {
                    label.classList.add('disabled');
                    label.textContent += ' (Já adicionado)';
                }
                
                // Add to product item
                productItem.appendChild(checkbox);
                productItem.appendChild(label);
                productList.appendChild(productItem);
            });
            
            companySection.appendChild(productList);
            this.productSelectionContainer.appendChild(companySection);
        });
        
        // Check if no products were added
        if (this.productSelectionContainer.children.length === 0) {
            this.productSelectionContainer.innerHTML = '<p>Nenhum produto disponível.</p>';
        }
    }
    
    /**
     * Add selected products to the current launch
     */
    addSelectedProductsToLaunch() {
        // Get all checked product checkboxes
        const checkedProducts = this.productSelectionContainer.querySelectorAll('input[type="checkbox"]:checked');
        
        if (checkedProducts.length === 0) {
            Toast.show('Selecione pelo menos um produto para adicionar.', 'warning');
            return;
        }
        
        // Add each selected product to the launch
        checkedProducts.forEach(checkbox => {
            const companyId = checkbox.dataset.companyId;
            const productId = checkbox.value;
            
            // Get company and product
            const company = this.companyManager.getCompanyById(companyId);
            if (!company) return;
            
            const product = company.products.find(p => p.id === productId);
            if (!product) return;
            
            // Add to current launch
            this.currentLaunch.products.push({
                company,
                product,
                sales: 0,
                total: 0
            });
        });
        
        // Refresh UI
        this.renderLaunchProducts();
        this.loadProductsForSelection(); // Refresh selection to disable already added products
        Toast.show('Produtos adicionados ao lançamento.', 'success');
    }
    
    /**
     * Render the current launch products in the table
     */
    renderLaunchProducts() {
        // Clear current table rows
        this.launchProductsBody.innerHTML = '';
        
        if (this.currentLaunch.products.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="6" class="empty-table">Nenhum produto adicionado ao lançamento.</td>';
            this.launchProductsBody.appendChild(emptyRow);
            return;
        }
        
        // Add rows for each product
        this.currentLaunch.products.forEach((launchProduct, index) => {
            const row = document.createElement('tr');
            
            // Company name
            const companyCell = document.createElement('td');
            companyCell.textContent = launchProduct.company.name;
            row.appendChild(companyCell);
            
            // Product name
            const productCell = document.createElement('td');
            productCell.textContent = launchProduct.product.name;
            row.appendChild(productCell);
            
            // Price
            const priceCell = document.createElement('td');
            priceCell.textContent = `R$ ${launchProduct.product.price.toFixed(2)}`;
            row.appendChild(priceCell);
            
            // Sales input
            const salesCell = document.createElement('td');
            const salesInput = document.createElement('input');
            salesInput.type = 'number';
            salesInput.min = '0';
            salesInput.value = launchProduct.sales;
            salesInput.className = 'sales-input';
            salesInput.dataset.index = index;
            salesInput.addEventListener('change', (e) => {
                this.updateProductSales(index, parseInt(e.target.value) || 0);
            });
            salesInput.disabled = !this.isSellingRoundActive;
            salesCell.appendChild(salesInput);
            row.appendChild(salesCell);
            
            // Total
            const totalCell = document.createElement('td');
            totalCell.textContent = `R$ ${launchProduct.total.toFixed(2)}`;
            row.appendChild(totalCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remover';
            removeBtn.addEventListener('click', () => {
                this.removeProductFromLaunch(index);
            });
            actionsCell.appendChild(removeBtn);
            row.appendChild(actionsCell);
            
            // Add row to table
            this.launchProductsBody.appendChild(row);
        });
    }
    
    /**
     * Update the sales count for a product
     * @param {number} index - Index of the product in the currentLaunch.products array
     * @param {number} salesCount - New sales count
     */
    updateProductSales(index, salesCount) {
        const launchProduct = this.currentLaunch.products[index];
        if (!launchProduct) return;
        
        launchProduct.sales = salesCount;
        launchProduct.total = launchProduct.sales * launchProduct.product.price;
        
        // Update total in the table
        const totalCell = this.launchProductsBody.querySelectorAll('tr')[index].querySelectorAll('td')[4];
        totalCell.textContent = `R$ ${launchProduct.total.toFixed(2)}`;
    }
    
    /**
     * Remove a product from the current launch
     * @param {number} index - Index of the product in the currentLaunch.products array
     */
    removeProductFromLaunch(index) {
        // Remove from array
        this.currentLaunch.products.splice(index, 1);
        
        // Refresh UI
        this.renderLaunchProducts();
        this.loadProductsForSelection();
    }
    
    /**
     * Start a selling round to collect sales data
     */
    startSellingRound() {
        if (this.currentLaunch.products.length === 0) {
            Toast.show('Adicione produtos ao lançamento primeiro.', 'warning');
            return;
        }
        
        // Enable sales inputs and apply button
        this.isSellingRoundActive = true;
        this.applySalesBtn.disabled = false;
        this.startSellingRoundBtn.disabled = true;
        
        // Refresh UI to enable inputs
        this.renderLaunchProducts();
        
        Toast.show('Rodada de vendas iniciada. Insira o número de vendas para cada produto.', 'info');
    }
    
    /**
     * Apply sales to companies' budgets
     */
    applySales() {
        if (!this.isSellingRoundActive) return;
        
        // Check if there are any sales
        const totalSales = this.currentLaunch.products.reduce((sum, p) => sum + p.sales, 0);
        if (totalSales === 0) {
            Toast.show('Nenhuma venda registrada.', 'warning');
            return;
        }
        
        // Get a list of affected companies for showing results
        const affectedCompanies = new Map();
        
        // Apply sales revenue to each company
        this.currentLaunch.products.forEach(launchProduct => {
            if (launchProduct.sales <= 0) return;
            
            const company = launchProduct.company;
            const revenue = launchProduct.total;
            
            // Add revenue to company
            const description = `Venda de ${launchProduct.sales} unidades do produto "${launchProduct.product.name}"`;
            company.addRevenue(description, revenue);
            
            // Track affected companies and their revenue
            if (!affectedCompanies.has(company.id)) {
                affectedCompanies.set(company.id, { 
                    company: company, 
                    revenue: 0, 
                    sales: 0 
                });
            }
            
            const companyData = affectedCompanies.get(company.id);
            companyData.revenue += revenue;
            companyData.sales += launchProduct.sales;
        });
        
        // Update all affected companies
        affectedCompanies.forEach(data => {
            this.companyManager.updateCompany(data.company);
        });
        
        // Show results
        let resultMessage = 'Vendas aplicadas com sucesso:<br>';
        affectedCompanies.forEach(data => {
            resultMessage += `- ${data.company.name}: ${data.sales} unidades vendidas, R$ ${data.revenue.toFixed(2)} adicionados.<br>`;
        });
        
        // Show notification
        Modal.show(
            'Resultados da Rodada de Vendas',
            resultMessage,
            'OK'
        );
        
        // End the selling round
        this.isSellingRoundActive = false;
        this.applySalesBtn.disabled = true;
        this.startSellingRoundBtn.disabled = false;
        
        // Refresh UI
        this.renderLaunchProducts();
    }
    
    /**
     * Clear the current launch
     */
    clearLaunch() {
        // Confirm if there are products in the launch
        if (this.currentLaunch.products.length > 0) {
            if (!confirm('Tem certeza que deseja limpar o lançamento atual?')) {
                return;
            }
        }
        
        // Reset the current launch
        this.currentLaunch.products = [];
        this.isSellingRoundActive = false;
        this.applySalesBtn.disabled = true;
        this.startSellingRoundBtn.disabled = false;
        
        // Refresh UI
        this.renderLaunchProducts();
        this.loadProductsForSelection();
        
        Toast.show('Lançamento limpo.', 'info');
    }
}