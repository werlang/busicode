/**
 * Product Manager
 * Handles data operations for products in the BusiCode application
 */
import Storage from './storage.js';
import CompanyManager from './company-manager.js';
import Product from '../model/product.js';

export default class ProductManager {
    constructor() {
        this.storage = new Storage('busicode_product_launches');
        this.launchedProducts = this.loadLaunchedProducts() || [];
        this.companyManager = new CompanyManager();
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
            launchedAt: product.launchedAt
        }));
    }

    /**
     * Save launched products to storage
     */
    saveLaunchedProducts() {
        this.storage.saveData(this.launchedProducts);
    }

    /**
     * Get all launched products
     * @returns {Array} An array of launched products
     */
    getAllLaunchedProducts() {
        this.launchedProducts = this.loadLaunchedProducts();
        return this.launchedProducts;
    }

    /**
     * Get launched products for a specific class
     * @param {string} classId - Class ID to filter products by
     * @returns {Array} Filtered array of launched products
     */
    getLaunchedProductsByClassId(classId) {
        return this.getAllLaunchedProducts().filter(product => {
            const company = this.companyManager.getCompany(product.companyId);
            const classroom = this.companyManager.classManager.getClassById(company.classroomId);
            return classroom && classroom.id === classId;
        });
    }

    /**
     * Launch a new product
     * @param {string} companyId - ID of the company launching the product
     * @param {string} productName - Name of the product
     * @param {number} productPrice - Price of the product
     * @returns {Object} Result object with product and status information
     */
    launchProduct(companyId, productName, productPrice) {
        // Validate inputs
        if (!companyId) {
            return { success: false, message: 'Por favor, selecione uma empresa.' };
        }

        if (!productName || productName.trim() === '') {
            return { success: false, message: 'Por favor, insira um nome para o produto.' };
        }
        
        if (isNaN(productPrice) || productPrice <= 0) {
            return { success: false, message: 'Por favor, insira um valor válido para o produto.' };
        }
        
        // Get company
        const company = this.companyManager.getCompany(companyId);
        if (!company) {
            return { success: false, message: 'Empresa não encontrada.' };
        }
        
        // Add product to launched products list
        const launchedProduct = new Product({
            id: `launch_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: productName,
            price: productPrice,
            companyId,
        });

        this.launchedProducts.push(launchedProduct);
        this.saveLaunchedProducts();
        
        return { 
            success: true, 
            message: `Produto "${productName}" lançado com sucesso para a empresa "${company.name}"!`,
            product: launchedProduct,
            company
        };
    }

    /**
     * Edit a product's price
     * @param {string} productId - ID of the product to edit
     * @param {number} newPrice - New price for the product
     * @returns {Object} Result object with product and status information
     */
    editProductPrice(productId, newPrice) {
        const product = this.launchedProducts.find(p => p.id === productId);
        if (!product) {
            return { success: false, message: 'Produto não encontrado.' };
        }
        
        if (isNaN(newPrice) || newPrice <= 0) {
            return { success: false, message: 'Por favor, insira um valor válido para o produto.' };
        }
        
        product.updatePrice(newPrice);
        this.saveLaunchedProducts();
        
        return {
            success: true,
            message: `Preço do produto "${product.name}" atualizado para R$ ${newPrice.toFixed(2)}!`,
            product
        };
    }

    /**
     * Add sales to a product
     * @param {string} productId - ID of the product
     * @param {number} salesCount - Number of sales to add
     * @returns {Object} Result object with product and sales information
     */
    addProductSales(productId, salesCount) {
        const product = this.launchedProducts.find(p => p.id === productId);
        if (!product) {
            return { success: false, message: 'Produto não encontrado.' };
        }
        
        if (isNaN(salesCount) || salesCount <= 0) {
            return { success: false, message: 'Insira um valor válido para as vendas.' };
        }
        
        product.addSales(salesCount);
        this.saveLaunchedProducts();
        
        // Return the result and product information
        return {
            success: true,
            message: `${salesCount} vendas adicionadas ao produto "${product.name}"!`,
            product,
            salesCount,
            price: product.price,
            companyId: product.companyId
        };
    }

    /**
     * Remove a product from the launched products list
     * @param {string} productId - ID of the product to remove
     * @returns {Object} Result object with removed product information
     */
    removeProduct(productId) {
        const index = this.launchedProducts.findIndex(p => p.id === productId);
        if (index === -1) {
            return { success: false, message: 'Produto não encontrado.' };
        }
        
        const product = this.launchedProducts[index];
        const company = this.companyManager.getCompany(product.companyId);
        
        this.launchedProducts.splice(index, 1);
        this.saveLaunchedProducts();
        
        let shownName = product.name.length ? `"${product.name}"` : `da empresa "${company.name}"`;
        
        return {
            success: true,
            message: `Produto ${shownName} removido do lançamento com sucesso!`,
            product,
            company
        };
    }

    /**
     * Filter products by release date
     * @param {Date|string} startDate - Start date for filtering
     * @param {Date|string} endDate - End date for filtering (optional)
     * @returns {Array} Filtered array of products
     */
    getProductsByDateRange(startDate, endDate = null) {
        const products = this.getAllLaunchedProducts();
        
        // Convert string dates to Date objects if needed
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : new Date();
        
        // Set end date to end of day if provided
        if (endDate) {
            end.setHours(23, 59, 59, 999);
        }

        return products.filter(product => {
            const launchDate = new Date(product.launchedAt);
            return launchDate >= start && launchDate <= end;
        });
    }

    /**
     * Get products launched on a specific date
     * @param {Date|string} date - The date to filter by
     * @returns {Array} Filtered array of products
     */
    getProductsByDate(date) {
        const targetDate = date instanceof Date ? date : new Date(date);
        
        // Set to start of day
        const startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        
        // Set to end of day
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        
        return this.getProductsByDateRange(startDate, endDate);
    }

    /**
     * Get a product by ID
     * @param {string} productId - ID of the product
     * @returns {Product|null} The product object or null if not found
     */
    getProduct(productId) {
        return this.launchedProducts.find(p => p.id === productId) || null;
    }

    /**
     * Remove all products for a given company
     * @param {string} companyId - ID of the company
     * @returns {number} Number of products removed
     */
    removeProductsByCompany(companyId) {
        const initialCount = this.launchedProducts.length;
        this.launchedProducts = this.launchedProducts.filter(product => product.companyId !== companyId);
        
        if (this.launchedProducts.length !== initialCount) {
            this.saveLaunchedProducts();
        }
        
        return initialCount - this.launchedProducts.length;
    }
}