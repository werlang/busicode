/**
 * Product Manager
 * Handles data operations for products in the BusiCode application
 */
import Request from './request.js';
import CompanyManager from './company-manager.js';
import Product from '../model/product.js';

export default class ProductManager {
    constructor() {
        this.request = new Request({
            url: 'http://localhost:3000',
        });
        this.companyManager = new CompanyManager();
    }
    
    /**
     * Get the appropriate request instance (authenticated if user is logged in)
     * @returns {Request} Request instance
     */
    getRequest() {
        // Use global auth manager if available and user is authenticated
        if (window.authManager && window.authManager.isLoggedIn()) {
            return window.authManager.getAuthenticatedRequest();
        }
        
        // Fallback to regular request for read operations
        return this.request;
    }


    /**
     * Get all launched products
     * @returns {Array} An array of launched products
     */
    async getAllLaunchedProducts() {
        try {
            const {products} = await this.getRequest().get('products');
            return products.map(product => new Product({
                id: product.id,
                name: product.name,
                price: product.price,
                companyId: product.companyId,
                sales: product.salesCount || 0,
                total: product.totalRevenue || 0,
                launchedAt: product.createdAt || product.launchedAt
            }));
        } catch (error) {
            console.error('Error getting all launched products:', error);
            return [];
        }
    }

    /**
     * Get launched products for a specific class
     * @param {string} classId - Class ID to filter products by
     * @returns {Array} Filtered array of launched products
     */
    async getLaunchedProductsByClassId(classId) {
        try {
            const {products} = await this.getRequest().get(`products`, { class_id: classId });
            return products.map(product => new Product({
                id: product.id,
                name: product.name,
                price: product.price,
                companyId: product.companyId,
                sales: product.salesCount || 0,
                total: product.totalRevenue || 0,
                launchedAt: product.createdAt || product.launchedAt
            }));
        } catch (error) {
            console.error('Error getting products by class ID:', error);
            return [];
        }
    }

    /**
     * Launch a new product
     * @param {string} companyId - ID of the company launching the product
     * @param {string} productName - Name of the product
     * @param {number} productPrice - Price of the product
     * @returns {Object} Result object with product and status information
     */
    async launchProduct(companyId, productName, productPrice) {
        try {
            const response = await this.getRequest().post('products', {
                companyId,
                name: productName,
                price: productPrice
            });
            
            return { 
                success: true, 
                message: response.message,
                product: response.product,
                company: response.company
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao lançar produto'
            };
        }
    }

    /**
     * Edit a product's price
     * @param {string} productId - ID of the product to edit
     * @param {number} newPrice - New price for the product
     * @returns {Object} Result object with product and status information
     */
    async editProductPrice(productId, newPrice) {
        try {
            const response = await this.getRequest().put(`products/${productId}`, {
                price: newPrice
            });
            
            return {
                success: true,
                message: response.message,
                product: response.product
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao atualizar preço do produto'
            };
        }
    }

    /**
     * Add sales to a product
     * @param {string} productId - ID of the product
     * @param {number} quantity - Number of sales to add
     * @returns {Object} Result object with product and sales information
     */
    async addProductSales(productId, quantity) {
        try {
            const response = await this.getRequest().post(`products/${productId}/sales`, {
                quantity: quantity
            });
            
            return {
                success: true,
                message: response.message,
                product: {
                    ...response.product,
                    sales: response.product.salesCount,
                    total: response.product.totalRevenue,
                },
                quantity,
                price: response.product.price,
                companyId: response.product.companyId
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao adicionar vendas'
            };
        }
    }

    /**
     * Remove a product from the launched products list
     * @param {string} productId - ID of the product to remove
     * @returns {Object} Result object with removed product information
     */
    async removeProduct(productId) {
        try {
            const response = await this.getRequest().delete(`products/${productId}`);
            
            return {
                success: true,
                message: response.message,
                product: response.product,
                company: response.company
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao remover produto'
            };
        }
    }

    /**
     * Filter products by release date
     * @param {Date|string} startDate - Start date for filtering
     * @param {Date|string} endDate - End date for filtering (optional)
     * @returns {Array} Filtered array of products
     */
    async getProductsByDateRange(startDate, endDate = null) {
        try {
            let opt = {};
            const start = startDate instanceof Date ? startDate.toISOString() : new Date(startDate).toISOString();
            opt.start_date = start;
            
            if (endDate) {
                const end = endDate instanceof Date ? endDate.toISOString() : new Date(endDate).toISOString();
                opt.end_date = end;
            }

            const {products} = await this.getRequest().get('products', opt);
            return products;
        } catch (error) {
            console.error('Error getting products by date range:', error);
            return [];
        }
    }

    /**
     * Get products launched on a specific date
     * @param {Date|string} date - The date to filter by
     * @returns {Array} Filtered array of products
     */
    async getProductsByDate(date) {
        const targetDate = date instanceof Date ? date : new Date(date);
        
        // Set to start of day
        const startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        
        // Set to end of day
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        
        return await this.getProductsByDateRange(startDate, endDate);
    }

    /**
     * Get a product by ID
     * @param {string} productId - ID of the product
     * @returns {Product|null} The product object or null if not found
     */
    async getProduct(productId) {
        try {
            const {product} = await this.getRequest().get(`products/${productId}`);
            return product;
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            console.error('Error getting product:', error);
            return null;
        }
    }

    /**
     * Remove all products for a given company
     * @param {string} companyId - ID of the company
     * @returns {number} Number of products removed
     */
    async removeProductsByCompany(companyId) {
        try {
            const response = await this.getRequest().delete(`products/company/${companyId}`);
            return response.deletedCount || 0;
        } catch (error) {
            console.error('Error removing products by company:', error);
            return 0;
        }
    }
}