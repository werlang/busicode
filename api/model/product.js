import Model from './model.js';
import Company from './company.js';
import CustomError from '../helpers/error.js';
import Mysql from '../helpers/mysql.js';
import { randomUUID } from 'crypto';

export default class Product extends Model {
    constructor({
        id,
        name,
        price,
        company_id,
        sales_count,
        total_revenue,
        launched_at,
        created_at
    }) {
        super('products', {
            fields: {
                id,
                name,
                price: parseFloat(price) || 0,
                company_id,
                sales_count: parseInt(sales_count) || 0,
                total_revenue: parseFloat(total_revenue) || 0,
                launched_at,
                created_at
            },
            allowUpdate: ['name', 'price', 'sales_count', 'total_revenue'],
            insertFields: ['name', 'price', 'company_id', 'sales_count', 'total_revenue', 'launched_at'],
        });
    }

    static async getAll(filter = {}) {
        const products = await Model.getAll('products', filter);
        return products.map(product => ({
            ...product,
            price: parseFloat(product.price) || 0,
            sales_count: parseInt(product.sales_count) || 0,
            total_revenue: parseFloat(product.total_revenue) || 0
        }));
    }

    static async getByCompany(companyId) {
        const products = await Model.getAll('products', { company_id: companyId });
        return products.map(product => ({
            ...product,
            price: parseFloat(product.price) || 0,
            sales_count: parseInt(product.sales_count) || 0,
            total_revenue: parseFloat(product.total_revenue) || 0
        }));
    }

    static async getByClass(classId) {
        // Get products by joining with companies table
        const sql = `
            SELECT p.* FROM products p 
            JOIN companies c ON p.company_id = c.id 
            WHERE c.class_id = ?
        `;
        const products = await Mysql.query(sql, [classId]);
        
        return products.map(product => ({
            ...product,
            price: parseFloat(product.price) || 0,
            sales_count: parseInt(product.sales_count) || 0,
            total_revenue: parseFloat(product.total_revenue) || 0
        }));
    }

    static async getByDateRange(startDate = null, endDate = null, companyId = null, classId = null) {
        let sql = `
            SELECT p.* FROM products p 
            ${classId ? 'JOIN companies c ON p.company_id = c.id' : ''}
            WHERE 1=1
        `;
        const params = [];
        
        if (startDate) {
            sql += ' AND p.launched_at >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            sql += ' AND p.launched_at <= ?';
            params.push(endDate);
        }
        
        if (companyId) {
            sql += ' AND p.company_id = ?';
            params.push(companyId);
        }
        
        if (classId) {
            sql += ' AND c.class_id = ?';
            params.push(classId);
        }
        
        sql += ' ORDER BY p.launched_at DESC';
        
        const products = await Mysql.query(sql, params);
        
        return products.map(product => ({
            ...product,
            price: parseFloat(product.price) || 0,
            sales_count: parseInt(product.sales_count) || 0,
            total_revenue: parseFloat(product.total_revenue) || 0
        }));
    }

    async insert() {
        // Generate UUID if not provided
        if (!this.id) {
            this.id = randomUUID();
        }
        
        // Set launched_at if not provided
        if (!this.launched_at) {
            this.launched_at = new Date();
        }

        // Add id to insert fields for this operation
        const originalInsertFields = [...this.insertFields];
        this.insertFields.push('id');
        
        const result = await super.insert();
        
        // Restore original insert fields
        this.insertFields = originalInsertFields;
        
        return result;
    }

    /**
     * Get the company that owns this product
     * @returns {Object} Company object
     */
    async getCompany() {
        const company = new Company({ id: this.company_id });
        await company.get();
        return company;
    }

    /**
     * Record a sale for this product
     * @param {number} quantity - Quantity sold
     * @param {number} unitPrice - Price per unit (optional, uses product price if not provided)
     * @returns {Object} Sale record
     */
    async recordSale(quantity, unitPrice = null) {
        const saleQuantity = parseInt(quantity);
        const salePrice = unitPrice !== null ? parseFloat(unitPrice) : parseFloat(this.price);
        
        if (saleQuantity <= 0) {
            throw new CustomError(400, 'Sale quantity must be positive');
        }
        
        if (salePrice <= 0) {
            throw new CustomError(400, 'Sale price must be positive');
        }
        
        const saleAmount = saleQuantity * salePrice;
        
        // Create sale record
        const saleData = {
            id: randomUUID(),
            product_id: this.id,
            quantity: saleQuantity,
            unit_price: salePrice,
            total_amount: saleAmount,
            sale_date: new Date(),
            created_at: new Date()
        };
        
        await Mysql.insert('product_sales', saleData);
        
        // Update product totals
        const newSalesCount = parseInt(this.sales_count) + saleQuantity;
        const newTotalRevenue = parseFloat(this.total_revenue) + saleAmount;
        
        await this.update({
            sales_count: newSalesCount,
            total_revenue: newTotalRevenue
        });
        
        // Update instance properties to reflect the changes
        this.sales_count = parseInt(newSalesCount);
        this.total_revenue = parseFloat(newTotalRevenue);
        
        // Add revenue to company
        const company = await this.getCompany();
        await company.addRevenue(`Product sales: ${this.name} (${saleQuantity} units)`, saleAmount);
        
        return {
            sale: {
                ...saleData,
                quantity: parseInt(saleData.quantity),
                unit_price: parseFloat(saleData.unit_price),
                total_amount: parseFloat(saleData.total_amount)
            },
            product: this.toJSON(),
            companyRevenue: parseFloat(saleAmount)
        };
    }

    /**
     * Get all sales for this product
     * @returns {Array} Array of sales
     */
    async getSales() {
        const sales = await Mysql.find('product_sales', {
            filter: { product_id: this.id },
            opt: { order: { sale_date: -1 } }
        });
        
        return sales.map(sale => ({
            ...sale,
            quantity: parseInt(sale.quantity) || 0,
            unit_price: parseFloat(sale.unit_price) || 0,
            total_amount: parseFloat(sale.total_amount) || 0
        }));
    }

    /**
     * Get sales statistics
     * @returns {Object} Sales statistics
     */
    async getSalesStats() {
        const sales = await this.getSales();
        
        if (sales.length === 0) {
            return {
                totalSales: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                salesCount: 0,
                firstSale: null,
                lastSale: null
            };
        }
        
        const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const averageOrderValue = totalRevenue / sales.length;
        
        // Sort by date for first/last
        const sortedSales = sales.sort((a, b) => new Date(a.sale_date) - new Date(b.sale_date));
        
        return {
            totalSales: parseInt(totalSales) || 0,
            totalRevenue: parseFloat(totalRevenue) || 0,
            averageOrderValue: parseFloat(averageOrderValue) || 0,
            salesCount: sales.length,
            firstSale: sortedSales[0],
            lastSale: sortedSales[sortedSales.length - 1]
        };
    }

    /**
     * Update product price
     * @param {number} newPrice - New price
     * @returns {Object} Updated product
     */
    async updatePrice(newPrice) {
        const price = parseFloat(newPrice);
        
        if (price <= 0) {
            throw new CustomError(400, 'Product price must be positive');
        }
        
        await this.update({ price });
        
        // Update instance property to reflect the change
        this.price = parseFloat(price);
        
        return this;
    }

    // Convert to frontend-compatible format
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            price: parseFloat(this.price) || 0,
            companyId: this.company_id,
            salesCount: parseInt(this.sales_count) || 0,
            totalRevenue: parseFloat(this.total_revenue) || 0,
            launchedAt: this.launched_at,
            createdAt: this.created_at
        };
    }

    // Get product with company and sales details
    async toJSONWithDetails() {
        const company = await this.getCompany();
        const salesStats = await this.getSalesStats();
        
        return {
            ...this.toJSON(),
            company: company.toJSON(),
            salesStats
        };
    }
}
