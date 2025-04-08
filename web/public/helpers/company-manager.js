/**
 * Company Manager
 * Handles data operations for companies in the BusiCode application
 */
import Storage from './storage.js';
import Company from '../model/company.js';
import ClassManager from './class-manager.js';

export default class CompanyManager {
    constructor() {
        this.storage = new Storage('busicode_companies');
        this.companies = this.loadCompanies();
        this.classManager = new ClassManager();
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
                companyData.memberContributions,
                companyData.memberIds
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
     * @param {string} companyName - Company name
     * @param {string} className - Class name
     * @param {Array} selectedStudentIds - Array of selected student IDs
     * @param {Object} memberContributions - Object mapping member IDs to their contributions
     * @returns {Object} Result object with company and status information
     */
    createCompany(companyName, className, selectedStudentIds, memberContributions) {
        if (!className || !companyName || selectedStudentIds.length === 0) {
            return { success: false, message: 'Missing required information for company creation' };
        }
        
        let totalContribution = 0;
        const students = this.classManager.getStudents(className);
        
        // Verify if each student has sufficient balance for their contribution
        let insufficientFunds = false;
        let insufficientStudent = null;
        
        selectedStudentIds.forEach(studentId => {
            const contribution = memberContributions[studentId] || 0;
            totalContribution += contribution;
            
            // Check if student has sufficient balance
            const student = students.find(s => s.id === studentId);
            if (student && contribution > student.currentBalance) {
                insufficientFunds = true;
                insufficientStudent = student;
            }
        });
        
        if (insufficientFunds) {
            return { 
                success: false, 
                message: `Aluno ${insufficientStudent.name} não tem saldo suficiente para contribuir R$ ${memberContributions[insufficientStudent.id].toFixed(2)}`
            };
        }
        
        if (totalContribution <= 0) {
            return { 
                success: false, 
                message: 'É necessário que pelo menos um aluno faça uma contribuição para a empresa.' 
            };
        }
        
        // Create the company with individual contributions
        const id = `company_${Date.now()}`;
        const company = new Company(id, companyName, className);
        company.addRevenue('Capital Inicial', totalContribution);
        company.addMembers(selectedStudentIds);
        
        // Update student balances by deducting their contributions
        const classStudents = this.classManager.getStudents(className);
        Object.entries(memberContributions).forEach(([studentId, contribution]) => {
            const student = classStudents.find(s => s.id === studentId);
            if (student) {
                student.deductBalance(contribution);
            }
        });
        this.classManager.saveClasses();
        
        this.companies[id] = company;
        this.saveCompanies();
        
        return {
            success: true,
            message: `Empresa "${companyName}" criada com sucesso com capital inicial de R$ ${totalContribution.toFixed(2)}!`,
            company,
            studentIds: selectedStudentIds,
            className,
            totalContribution
        };
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
        this.companies = this.loadCompanies();
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
     * @param {string} company - Company object
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     * @param {string} date - Expense date
     * @returns {Object} The created expense or null if company not found
     */
    addExpense(company, description, amount, date) {
        if (!company) return null;
        
        const expense = company.addExpense(description, amount, date);
        this.saveCompanies();
        
        return expense;
    }

    /**
     * Add revenue to a company
     * @param {string} company - Company object
     * @param {string} description - Revenue description
     * @param {number} amount - Revenue amount
     * @param {string} date - Revenue date
     * @returns {Object} The created revenue or null if company not found
     */
    addRevenue(company, description, amount, date) {
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
     * Distribute profits to a company member
     * @param {string} companyId - Company ID
     * @param {string} studentId - Student ID to receive profits
     * @param {number} amount - Amount to distribute
     * @param {string} description - Description for the transaction
     * @returns {Object} Result object with status information and expense details
     */
    distributeProfits(companyId, studentId, amount, description) {
        const company = this.companies[companyId];
        if (!company) {
            return { success: false, message: 'Empresa não encontrada' };
        }
        
        // Validate the amount against available profits
        if (amount > company.getProfit()) {
            return { success: false, message: 'O valor não pode ser maior que o lucro disponível' };
        }
        
        // Get the student
        const students = this.classManager.getStudents(company.classroomName);
        const student = students.find(s => s.id === studentId);
        if (!student) {
            return { success: false, message: 'Aluno não encontrado' };
        }
        
        // Add the expense to the company
        const expense = company.distributeProfits(studentId, amount, description);
        if (!expense) {
            return { success: false, message: 'Não foi possível distribuir os lucros' };
        }
        
        // Update student balance
        student.addBalance(amount);
        this.classManager.saveClasses();
        
        // Save company changes
        this.saveCompanies();
        
        return {
            success: true, 
            message: `Distribuição de R$ ${amount.toFixed(2)} realizada com sucesso para ${student.name}!`, 
            expense,
            studentId,
            className: company.classroomName
        };
    }
    
    /**
     * Get all classes with their companies
     * @returns {Object} Object mapping class names to their company count
     */
    getClassesWithCompanies() {
        const allCompanies = this.getAllCompanies();
        const classesWithCompanies = {};
        
        // Get all class names that have companies
        allCompanies.forEach(company => {
            if (!classesWithCompanies[company.classroomName]) {
                classesWithCompanies[company.classroomName] = [];
            }
            classesWithCompanies[company.classroomName].push(company);
        });
        
        return classesWithCompanies;
    }
    
    /**
     * Get unique class names that have companies
     * @returns {string[]} Array of class names
     */
    getUniqueClassNames() {
        const allCompanies = this.getAllCompanies();
        return [...new Set(allCompanies.map(company => company.classroomName))];
    }
    
    /**
     * Delete all companies associated with a class
     * @param {string} className - The name of the class
     * @returns {number} The number of companies deleted
     */
    deleteCompaniesByClassName(className) {
        let deletedCount = 0;
        
        Object.keys(this.companies).forEach(companyId => {
            const company = this.companies[companyId];
            if (company.classroomName === className) {
                delete this.companies[companyId];
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            this.saveCompanies();
        }
        
        return deletedCount;
    }
    
    /**
     * Add product sale revenue to a company
     * @param {string} companyId - Company ID
     * @param {string} productName - Name of the product
     * @param {number} sales - Number of items sold
     * @param {number} price - Price per item
     * @returns {Object} The created revenue or null if company not found
     */
    addProductSales(companyId, productName, sales, price) {
        const company = this.getCompany(companyId);
        if (!company) return null;
        
        const revenue = this.addRevenue(
            company,
            `Venda de produto ${productName}`,
            sales * price
        );
        
        return revenue;
    }
}