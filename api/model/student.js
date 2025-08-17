import Model from './model.js';
import CustomError from '../helpers/error.js';
import { randomUUID } from 'crypto';

export default class Student extends Model {
    constructor({
        id,
        name,
        class_id,
        initial_balance,
        current_balance,
        created_at
    }) {
        super('students', {
            fields: {
                id,
                name,
                class_id,
                initial_balance: parseFloat(initial_balance) || 0,
                current_balance: parseFloat(current_balance) || 0,
                created_at
            },
            allowUpdate: ['name', 'initial_balance', 'current_balance'],
            insertFields: ['name', 'class_id', 'initial_balance', 'current_balance'],
        });
    }

    static async getAll(filter = {}) {
        const students = await Model.getAll('students', filter);
        return students.map(student => ({
            ...student,
            initial_balance: parseFloat(student.initial_balance) || 0,
            current_balance: parseFloat(student.current_balance) || 0
        }));
    }

    static async getByClass(classId) {
        const students = await Model.getAll('students', { class_id: classId });
        return students.map(student => ({
            ...student,
            initial_balance: parseFloat(student.initial_balance) || 0,
            current_balance: parseFloat(student.current_balance) || 0
        }));
    }

    async insert() {
        // Generate UUID if not provided
        if (!this.id) {
            this.id = randomUUID();
        }
        
        // Set current balance to initial balance if not set
        if (this.current_balance === undefined || this.current_balance === null) {
            this.current_balance = this.initial_balance;
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
     * Add balance to student
     * @param {number} amount - Amount to add
     * @param {string} description - Description of the transaction
     * @returns {Object} Updated student
     */
    async addBalance(amount) {
        const newBalance = parseFloat(this.current_balance) + parseFloat(amount);
        await this.update({ current_balance: newBalance });
        
        // Update instance property to reflect the change
        this.current_balance = parseFloat(newBalance);
        
        return this;
    }

    /**
     * Deduct balance from student
     * @param {number} amount - Amount to deduct
     * @param {string} description - Description of the transaction
     * @returns {Object} Updated student
     */
    async deductBalance(amount) {
        const deductAmount = parseFloat(amount);
        if (parseFloat(this.current_balance) < deductAmount) {
            throw new CustomError(400, 'Insufficient balance');
        }
        
        const newBalance = parseFloat(this.current_balance) - deductAmount;
        await this.update({ current_balance: newBalance });
        
        // Update instance property to reflect the change
        this.current_balance = parseFloat(newBalance);
        
        return this;
    }

    /**
     * Reset balance to initial balance
     * @returns {Object} Updated student
     */
    async resetBalance() {
        const resetBalance = parseFloat(this.initial_balance);
        await this.update({ current_balance: resetBalance });
        
        // Update instance property to reflect the change
        this.current_balance = resetBalance;
        
        return this;
    }

    /**
     * Set a new initial balance and reset current balance
     * @param {number} newInitialBalance - New initial balance
     * @returns {Object} Updated student
     */
    async setInitialBalance(newInitialBalance) {
        const balance = parseFloat(newInitialBalance);
        await this.update({ 
            initial_balance: balance,
            current_balance: balance 
        });
        
        // Update instance properties to reflect the changes
        this.initial_balance = balance;
        this.current_balance = balance;
        
        return this;
    }

    // Convert to frontend-compatible format
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            classId: this.class_id, // Convert snake_case to camelCase for frontend
            initialBalance: parseFloat(this.initial_balance),
            currentBalance: parseFloat(this.current_balance),
            createdAt: this.created_at
        };
    }
}
