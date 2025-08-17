import Model from './model.js';
import Student from './student.js';
import CustomError from '../helpers/error.js';
import Mysql from '../helpers/mysql.js';
import { randomUUID } from 'crypto';

export default class Company extends Model {
    constructor({
        id,
        name,
        class_id,
        initial_budget,
        current_budget,
        created_at
    }) {
        super('companies', {
            fields: {
                id,
                name,
                class_id,
                initial_budget: parseFloat(initial_budget) || 0,
                current_budget: parseFloat(current_budget) || 0,
                created_at
            },
            allowUpdate: ['name', 'current_budget'],
            insertFields: ['name', 'class_id', 'initial_budget', 'current_budget'],
        });
    }

    static async getAll(filter = {}) {
        const companies = await Model.getAll('companies', filter);
        return companies.map(company => ({
            ...company,
            initial_budget: parseFloat(company.initial_budget) || 0,
            current_budget: parseFloat(company.current_budget) || 0
        }));
    }

    static async getByClass(classId) {
        const companies = await Model.getAll('companies', { class_id: classId });
        return companies.map(company => ({
            ...company,
            initial_budget: parseFloat(company.initial_budget) || 0,
            current_budget: parseFloat(company.current_budget) || 0
        }));
    }

    async insert() {
        // Generate UUID if not provided
        if (!this.id) {
            this.id = randomUUID();
        }
        
        // Set current budget to initial budget if not set
        if (this.current_budget === undefined || this.current_budget === null) {
            this.current_budget = parseFloat(this.initial_budget);
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
     * Get company members (students)
     * @returns {Array} Array of members
     */
    async getMembers() {
        const result = await Mysql.find('company_members', {
            filter: { company_id: this.id }
        });
        
        const members = [];
        for (const memberData of result) {
            const student = await new Student({ id: memberData.student_id }).get();
            members.push({
                ...student.toJSON(),
                contribution: parseFloat(memberData.contribution) || 0,
                joinedAt: memberData.created_at
            });
        }
        
        return members;
    }

    /**
     * Add member to company
     * @param {string} studentId - Student ID
     * @param {number} contribution - Member's contribution
     * @returns {Object} Membership record
     */
    async addMember(studentId, contribution = 0) {
        // Check if student is already a member
        const existingMember = await Mysql.find('company_members', {
            filter: { 
                company_id: this.id,
                student_id: studentId
            }
        });
        
        if (existingMember.length > 0) {
            throw new CustomError(400, 'Student is already a member of this company');
        }

        const membershipData = {
            company_id: this.id,
            student_id: studentId,
            contribution: parseFloat(contribution),
            created_at: new Date()
        };

        await Mysql.insert('company_members', membershipData);
        
        // Deduct contribution from student balance
        if (contribution > 0) {
            const student = new Student({ id: studentId });
            await student.get();
            await student.deductBalance(contribution);
        }
        
        return {
            ...membershipData,
            contribution: parseFloat(membershipData.contribution)
        };
    }

    /**
     * Remove member from company
     * @param {string} studentId - Student ID
     * @returns {boolean} Success
     */
    async removeMember(studentId) {
        const result = await Mysql.delete('company_members', {
            company_id: this.id,
            student_id: studentId
        });
        
        return result.affectedRows > 0;
    }

    /**
     * Get company expenses
     * @returns {Array} Array of expenses
     */
    async getExpenses() {
        const expenses = await Mysql.find('company_expenses', {
            filter: { company_id: this.id },
            opt: { order: { created_at: -1 } }
        });
        
        return expenses.map(expense => ({
            ...expense,
            amount: parseFloat(expense.amount) || 0
        }));
    }

    /**
     * Get company revenues
     * @returns {Array} Array of revenues
     */
    async getRevenues() {
        const revenues = await Mysql.find('company_revenues', {
            filter: { company_id: this.id },
            opt: { order: { created_at: -1 } }
        });
        
        return revenues.map(revenue => ({
            ...revenue,
            amount: parseFloat(revenue.amount) || 0
        }));
    }

    /**
     * Add expense
     * @param {string} description - Expense description
     * @param {number} amount - Expense amount
     * @returns {Object} Created expense
     */
    async addExpense(description, amount) {
        const expenseAmount = parseFloat(amount);
        
        if (expenseAmount <= 0) {
            throw new CustomError(400, 'Expense amount must be positive');
        }
        
        if (this.current_budget < expenseAmount) {
            throw new CustomError(400, 'Insufficient budget for this expense');
        }

        const expenseData = {
            id: randomUUID(),
            company_id: this.id,
            description,
            amount: expenseAmount,
            created_at: new Date()
        };

        await Mysql.insert('company_expenses', expenseData);
        
        // Update company budget
        const newBudget = parseFloat(this.current_budget) - expenseAmount;
        await this.update({ current_budget: newBudget });
        
        // Update the instance property to reflect the change
        this.current_budget = parseFloat(newBudget);
        
        return {
            ...expenseData,
            amount: parseFloat(expenseData.amount)
        };
    }

    /**
     * Add revenue
     * @param {string} description - Revenue description
     * @param {number} amount - Revenue amount
     * @returns {Object} Created revenue
     */
    async addRevenue(description, amount) {
        const revenueAmount = parseFloat(amount);
        
        if (revenueAmount <= 0) {
            throw new CustomError(400, 'Revenue amount must be positive');
        }

        const revenueData = {
            id: randomUUID(),
            company_id: this.id,
            description,
            amount: revenueAmount,
            created_at: new Date()
        };

        await Mysql.insert('company_revenues', revenueData);
        
        // Update company budget
        const newBudget = parseFloat(this.current_budget) + revenueAmount;
        await this.update({ current_budget: newBudget });
        
        // Update the instance property to reflect the change and ensure it's a number
        this.current_budget = parseFloat(newBudget);
                
        return {
            ...revenueData,
            amount: parseFloat(revenueData.amount)
        };
    }

    /**
     * Get financial summary
     * @returns {Object} Financial summary
     */
    async getFinancialSummary() {
        const expenses = await this.getExpenses();
        const revenues = await this.getRevenues();
        
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalRevenues = revenues.reduce((sum, rev) => sum + rev.amount, 0);
        const profit = totalRevenues - totalExpenses;
        
        return {
            initialBudget: parseFloat(this.initial_budget),
            currentBudget: parseFloat(this.current_budget),
            totalExpenses: parseFloat(totalExpenses),
            totalRevenues: parseFloat(totalRevenues),
            profit: parseFloat(profit),
            expenseCount: expenses.length,
            revenueCount: revenues.length
        };
    }

    /**
     * Distribute profits to member
     * @param {string} studentId - Student ID
     * @param {number} amount - Amount to distribute
     * @param {string} description - Description
     * @returns {Object} Distribution record
     */
    async distributeProfits(studentId, amount, description = 'Profit distribution') {
        const distributionAmount = parseFloat(amount);
        
        // Refresh company data from database to ensure we have the latest budget
        await this.get();
                
        // Check if student is a member
        const members = await this.getMembers();
        const member = members.find(m => m.id === studentId);
        if (!member) {
            throw new CustomError(400, 'Student is not a member of this company');
        }
        
        // Check if company has enough current budget for distribution
        if (this.current_budget < distributionAmount) {
            throw new CustomError(400, 'Insufficient budget for distribution');
        }
        
        // Create expense for the distribution
        const fullDescription = `${description} to ${member.name}`;
        const expense = await this.addExpense(fullDescription, distributionAmount);
        
        // Add money to student balance
        const student = new Student({ id: studentId });
        await student.get();
        await student.addBalance(distributionAmount);
        
        return {
            expense,
            student: student.toJSON(),
            distributedAmount: distributionAmount
        };
    }

    // Convert to frontend-compatible format
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            classId: this.class_id,
            initialBudget: parseFloat(this.initial_budget),
            currentBudget: parseFloat(this.current_budget),
            createdAt: this.created_at
        };
    }

    // Get company with all details
    async toJSONWithDetails() {
        const members = await this.getMembers();
        const summary = await this.getFinancialSummary();
        
        return {
            ...this.toJSON(),
            members,
            financialSummary: summary
        };
    }
}
