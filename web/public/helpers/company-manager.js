/**
 * Company Manager
 * Handles data operations for companies in the BusiCode application
 */
import Request from './request.js';
import ClassManager from './class-manager.js';
import Company from '../model/company.js';

export default class CompanyManager {
    constructor() {
        this.request = new Request({
            url: 'http://localhost:3000',
        });
        this.classManager = new ClassManager();
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
     * Create a new company
     * @param {string} companyName - Company name
     * @param {string} classId - Class ID
     * @param {Array} selectedStudentIds - Array of selected student IDs
     * @param {Object} memberContributions - Object mapping member IDs to their contributions
     * @returns {Object} Result object with company and status information
     */
    async createCompany(companyName, classId, selectedStudentIds, memberContributions) {
        try {
            const response = await this.getRequest().post('companies', {
                name: companyName,
                classId,
                memberIds: selectedStudentIds,
                memberContributions: memberContributions
            });
            
            return {
                success: true,
                message: response.message,
                company: response.company,
                studentIds: selectedStudentIds,
                classId,
                className: response.className,
                totalContribution: response.totalContribution
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao criar empresa'
            };
        }
    }

    /**
     * Get a company by ID
     * @param {string} id - Company ID
     * @returns {Company} The company object
     */
    async getCompany(id) {
        try {
            const {company} = await this.getRequest().get(`companies/${id}?include_details=true`);
            return company;
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get all companies
     * @returns {Company[]} Array of all companies
     */
    async getAllCompanies() {
        try {
            const {companies} = await this.getRequest().get('companies');
            return companies;
        } catch (error) {
            console.error('Error getting all companies:', error);
            return [];
        }
    }

    /**
     * Get companies for a specific class
     * @param {string} classId - Class ID
     * @returns {Company[]} Array of companies in the class
     */
    async getCompaniesForClass(classId) {
        try {
            const {companies} = await this.getRequest().get(`companies`, { class_id: classId });
            return companies;
        } catch (error) {
            console.error('Error getting companies for class:', error);
            return [];
        }
    }

    /**
     * Get members of a company
     * @param {string} companyId - Company ID
     * @returns {Array} Array of member objects
     */
    async getCompanyMembers(companyId) {
        try {
            const {members} = await this.getRequest().get(`companies/${companyId}/members`);
            return members;
        } catch (error) {
            console.error('Error getting company members:', error);
            return [];
        }
    }

    /**
     * Update a company's details
     * @param {string} id - Company ID
     * @param {Object} updates - Object with properties to update
     * @returns {boolean} True if successful, false if company not found
     */
    async updateCompany(id, updates) {
        try {
            await this.getRequest().put(`companies/${id}`, updates);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Delete a company
     * @param {string} id - Company ID
     * @returns {boolean} True if successful, false if company not found
     */
    async deleteCompany(id) {
        try {
            await this.getRequest().delete(`companies/${id}`);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Add an expense to a company
     * @param {Company} company - Company object
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     * @param {string} date - Expense date
     * @returns {Object} The created expense or null if company not found
     */
    async addExpense(company, description, amount, date) {
        if (!company) return null;
        
        try {
            const expense = await this.getRequest().post(`companies/${company.id}/expenses`, {
                description,
                amount,
            });
            return expense;
        } catch (error) {
            console.error('Error adding expense:', error);
            return null;
        }
    }

    /**
     * Add revenue to a company
     * @param {Company} company - Company object
     * @param {string} description - Revenue description
     * @param {number} amount - Revenue amount
     * @param {string} date - Revenue date
     * @returns {Object} The created revenue or null if company not found
     */
    async addRevenue(company, description, amount, date) {
        if (!company) return null;
        
        try {
            const revenue = await this.getRequest().post(`companies/${company.id}/revenues`, {
                description,
                amount,
            });
            return revenue;
        } catch (error) {
            console.error('Error adding revenue:', error);
            return null;
        }
    }

    /**
     * Add funds directly to a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to add
     * @param {string} description - Description of the fund addition
     * @returns {Object} The created revenue or null if company not found
     */
    async addFunds(companyId, amount, description = 'Fund addition') {
        const company = await this.getCompany(companyId);
        if (!company) return null;
        
        return await this.addRevenue(company, description, amount);
    }

    /**
     * Remove funds directly from a company
     * @param {string} companyId - Company ID
     * @param {number} amount - Amount to remove
     * @param {string} description - Description of the fund removal
     * @returns {Object} The created expense or null if company not found
     */
    async removeFunds(companyId, amount, description = 'Fund removal') {
        const company = await this.getCompany(companyId);
        if (!company) return null;
        
        return await this.addExpense(company, description, amount);
    }
    
    /**
     * Distribute profits to a company member
     * @param {string} companyId - Company ID
     * @param {string} studentId - Student ID to receive profits
     * @param {number} amount - Amount to distribute
     * @param {string} description - Description for the transaction
     * @returns {Object} Result object with status information and expense details
     */
    async distributeProfits(companyId, studentId, amount, description) {
        try {
            const response = await this.getRequest().post(`companies/${companyId}/distribute-profits`, {
                studentId,
                amount,
                description
            });
            
            return {
                success: true, 
                message: response.message,
                expense: response.expense,
                studentId,
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao distribuir lucros'
            };
        }
    }
    
    /**
     * Get all classes with their companies
     * @returns {Object} Object mapping class IDs and names to their company lists
     */
    async getClassesWithCompanies() {
        try {
            const allCompanies = await this.getAllCompanies();
            const classesWithCompanies = {};
            
            // Get all classes that have companies
            allCompanies.forEach(company => {
                const key = company.classId;
                if (!classesWithCompanies[key]) {
                    classesWithCompanies[key] = {
                        id: company.classId,
                        companies: []
                    };
                }
                classesWithCompanies[key].companies.push(company);
            });
            
            return classesWithCompanies;
        } catch (error) {
            console.error('Error getting classes with companies:', error);
            return {};
        }
    }
    
    /**
     * Get unique class IDs that have companies
     * @returns {Array} Array of objects with class ID and name
     */
    async getUniqueClasses() {
        try {
            const companies = await this.getAllCompanies();
            const uniqueClasses = new Map();
            
            for (const company of companies) {
                const key = company.classId;
                if (!uniqueClasses.has(key)) {
                    const classObj = await this.classManager.getClassById(company.classId);
                    uniqueClasses.set(key, {
                        id: company.classId,
                        name: classObj?.name || 'Unknown'
                    });
                }
            }
            
            return Array.from(uniqueClasses.values());
        } catch (error) {
            console.error('Error getting unique classes:', error);
            return [];
        }
    }
    
    /**
     * Delete all companies associated with a class
     * @param {string} classId - The ID of the class
     * @returns {number} The number of companies deleted
     */
    async deleteCompaniesByClass(classId) {
        try {
            const companies = await this.getCompaniesForClass(classId);
            let deletedCount = 0;
            
            for (const company of companies) {
                const success = await this.deleteCompany(company.id);
                if (success) {
                    deletedCount++;
                }
            }
            
            return deletedCount;
        } catch (error) {
            console.error('Error deleting companies by class:', error);
            return 0;
        }
    }
    
    /**
     * Add product sale revenue to a company
     * @param {string} companyId - Company ID
     * @param {string} productName - Name of the product
     * @param {number} sales - Number of items sold
     * @param {number} price - Price per item
     * @returns {Object} The created revenue or null if company not found
     */
    async addProductSales(companyId, productName, sales, price) {
        const company = await this.getCompany(companyId);
        if (!company) return null;
        
        const revenue = await this.addRevenue(
            company,
            `Venda de produto ${productName}`,
            sales * price
        );
        
        return revenue;
    }

    /**
     * Update the list of students in a company
     * @param {string} companyId - ID of the company
     * @param {Array} studentIds - Array of student IDs to set as company members
     * @returns {Object} Result object with status and message
     */
    async updateCompanyMembers(companyId, memberIds) {
        try {
            const response = await this.getRequest().put(`companies/${companyId}/members`, {
                memberIds,
            });
            
            return { 
                success: true, 
                message: 'Lista de alunos atualizada com sucesso.',
                company: response.company,
            };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao atualizar lista de alunos.'
            };
        }
    }

    /**
     * Add a student to a company
     * @param {string} studentId - ID of the student to add
     * @param {string} companyId - ID of the company
     * @param {number} contribution - Optional contribution amount (defaults to 0)
     * @returns {Object} Result object with status and message
     */
    async addStudentToCompany(studentId, companyId, contribution = 0) {
        try {
            const response = await this.getRequest().post(`companies/${companyId}/members`, {
                studentId,
                contribution
            });
            
            return {
                success: true,
                message: response.message,
                membership: response.membership
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erro ao adicionar aluno à empresa.'
            };
        }
    }

    /**
     * Remove a student from a company
     * @param {string} studentId - ID of the student to remove
     * @param {string} companyId - ID of the company
     * @returns {Object} Result object with status and message
     */
    async removeStudentFromCompany(studentId, companyId) {
        try {
            const response = await this.getRequest().delete(`companies/${companyId}/members/${studentId}`);
            
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erro ao remover aluno da empresa.'
            };
        }
    }

    /**
     * Get expenses for a company
     * @param {string} companyId - Company ID
     * @returns {Array} Array of expense objects
     */
    async getExpenses(companyId) {
        try {
            const response = await this.getRequest().get(`companies/${companyId}/expenses`);
            return response.expenses || [];
        } catch (error) {
            console.error('Error getting company expenses:', error);
            return [];
        }
    }

    /**
     * Get revenues for a company
     * @param {string} companyId - Company ID
     * @returns {Array} Array of revenue objects
     */
    async getRevenues(companyId) {
        try {
            const response = await this.getRequest().get(`companies/${companyId}/revenues`);
            return response.revenues || [];
        } catch (error) {
            console.error('Error getting company revenues:', error);
            return [];
        }
    }

    /**
     * Get the profit for a company
     * @param {string} companyId - Company ID
     * @returns {number} Profit amount
     */
    async getCompanyProfit(companyId) {
        try {
            const expenses = await this.getExpenses(companyId);
            const revenues = await this.getRevenues(companyId);
            
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
            
            return totalRevenues - totalExpenses;
        } catch (error) {
            console.error('Error calculating company profit:', error);
            return 0;
        }
    }

    
}