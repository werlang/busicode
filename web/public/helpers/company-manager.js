/**
 * Company Manager
 * Manages companies and their finances in the BusiCode application
 */
import Storage from './storage.js';
import CompanyOperationsManager from '../model/company-operations-manager.js';
import Company from '../model/company.js';

export default class CompanyManager {
    constructor(classManager) {
        this.storage = new Storage('busicode_companies');
        this.companies = this.loadCompanies();
        this.classManager = classManager;
        // this.companyOperationsManager = new CompanyOperationsManager(this.classManager);
    }

    /**
     * Load companies from storage
     * @returns {Object} An object containing all companies
     */
    loadCompanies() {
        const data = this.storage.loadData() || {};
        
        // Convert plain objects to Company instances
        Object.keys(data).forEach(id => {
            const companyData = data[id];
            data[id] = new Company(
                companyData.id,
                companyData.name,
                companyData.classroomName,
                companyData.memberContributions
            );
            
            // Restore expenses and revenues
            data[id].expenses = companyData.expenses || [];
            data[id].revenues = companyData.revenues || [];
            data[id].currentBudget = companyData.currentBudget;
            
            // Restore products
            data[id].products = companyData.products || [];
        });
        
        return data;
    }

    /**
     * Save companies to storage
     */
    saveCompanies() {
        this.storage.saveData(this.companies);
    }

    /**
     * Create a new company
     * @param {string} name - Company name
     * @param {string} classroomName - Class name
     * @param {Object} memberContributions - Object mapping member IDs to their contributions
     * @returns {Company} The created company
     */
    createCompany(name, classroomName, memberContributions) {
        const id = `company_${Date.now()}`;
        const company = new Company(id, name, classroomName, memberContributions);
        
        // Atualizar o saldo dos alunos deduzindo suas contribuições
        Object.entries(memberContributions).forEach(([studentId, contribution]) => {
            const classStudents = this.classManager.getStudents(classroomName);
            const student = classStudents.find(s => s.id === studentId);
            if (student) {
                student.deductBalance(contribution);
            }
        });
        
        this.companies[id] = company;
        this.saveCompanies();
        
        return company;
    }

    /**
     * Get a company by ID
     * @param {string} id - Company ID
     * @returns {Company} The company object
     */
    getCompany(id) {
        return this.companies[id];
    }

    /**
     * Get all companies
     * @returns {Company[]} Array of all companies
     */
    getAllCompanies() {
        return Object.values(this.companies);
    }

    /**
     * Get companies for a specific class
     * @param {string} classroomName - Class name
     * @returns {Company[]} Array of companies in the class
     */
    getCompaniesForClass(classroomName) {
        return Object.values(this.companies)
            .filter(company => company.classroomName === classroomName);
    }

    /**
     * Update a company's details
     * @param {string} id - Company ID
     * @param {Object} updates - Object with properties to update
     * @returns {boolean} True if successful, false if company not found
     */
    updateCompany(id, updates) {
        const company = this.companies[id];
        if (!company) return false;
        
        Object.keys(updates).forEach(key => {
            company[key] = updates[key];
        });
        
        this.saveCompanies();
        return true;
    }

    /**
     * Delete a company
     * @param {string} id - Company ID
     * @returns {boolean} True if successful, false if company not found
     */
    deleteCompany(id) {
        if (this.companies[id]) {
            delete this.companies[id];
            this.saveCompanies();
            return true;
        }
        return false;
    }

    /**
     * Add an expense to a company
     * @param {string} companyId - Company ID
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     * @param {string} date - Expense date
     * @returns {Object} The created expense or null if company not found
     */
    addExpense(companyId, description, amount, date) {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const expense = company.addExpense(description, amount, date);
        this.saveCompanies();
        
        return expense;
    }

    /**
     * Add revenue to a company
     * @param {string} companyId - Company ID
     * @param {string} description - Revenue description
     * @param {number} amount - Revenue amount
     * @param {string} date - Revenue date
     * @returns {Object} The created revenue or null if company not found
     */
    addRevenue(companyId, description, amount, date) {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const revenue = company.addRevenue(description, amount, date);
        this.saveCompanies();
        
        return revenue;
    }

    /**
     * Add funds directly to a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to add
     * @param {string} description - Description of the fund addition
     * @returns {Object} The created revenue or null if company not found
     */
    addFunds(companyId, amount, description = 'Fund addition') {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const revenue = company.addFunds(amount, description);
        this.saveCompanies();
        
        return revenue;
    }

    /**
     * Remove funds directly from a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to remove
     * @param {string} description - Description of the fund removal
     * @returns {Object} The created expense or null if company not found
     */
    removeFunds(companyId, amount, description = 'Fund removal') {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const expense = company.removeFunds(amount, description);
        this.saveCompanies();
        
        return expense;
    }
    
    /**
     * Add a product to a company
     * @param {string} companyId - Company ID
     * @param {string} name - Product name
     * @param {string} description - Product description
     * @param {number} price - Selling price
     * @param {number} costPerUnit - Cost per unit (optional)
     * @returns {Object} The created product or null if company not found
     */
    addProduct(companyId, name, description, price) {
        const company = this.companies[companyId];
        if (!company) return null;
        
        const product = company.addProduct(name, description, price);
        this.saveCompanies();
        
        return product;
    }
    
    /**
     * Update a product
     * @param {string} companyId - Company ID
     * @param {string} productId - Product ID
     * @param {Object} updates - Updates to apply to the product
     * @returns {boolean} Whether the update was successful
     */
    updateProduct(companyId, productId, updates) {
        const company = this.companies[companyId];
        if (!company) return false;
        
        const result = company.updateProduct(productId, updates);
        if (result) {
            this.saveCompanies();
        }
        
        return result;
    }
    
    /**
     * Delete a product
     * @param {string} companyId - Company ID
     * @param {string} productId - Product ID
     * @returns {boolean} Whether the deletion was successful
     */
    deleteProduct(companyId, productId) {
        const company = this.companies[companyId];
        if (!company) return false;
        
        const result = company.deleteProduct(productId);
        if (result) {
            this.saveCompanies();
        }
        
        return result;
    }
    
    /**
     * Get all products for a company
     * @param {string} companyId - Company ID
     * @returns {Array} List of all products or null if company not found
     */
    getProducts(companyId) {
        const company = this.companies[companyId];
        if (!company) return null;
        
        return company.getProducts();
    }
}