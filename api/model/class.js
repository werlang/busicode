import Model from './model.js';
import Student from './student.js';
import CustomError from '../helpers/error.js';
import { randomUUID } from 'crypto';

export default class Class extends Model {
    constructor({
        id,
        name,
        created_at
    }) {
        super('classes', {
            fields: {
                id,
                name,
                created_at
            },
            allowUpdate: ['name'],
            insertFields: ['name'],
        });
    }

    static async getAll(filter = {}) {
        return Model.getAll('classes', filter);
    }

    async insert() {
        // Generate UUID if not provided
        if (!this.id) {
            this.id = randomUUID();
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
     * Get all students in this class
     * @returns {Array} Array of students
     */
    async getStudents() {
        return Student.getByClass(this.id);
    }

    /**
     * Add a student to this class
     * @param {Object} studentData - Student data
     * @returns {Object} Created student
     */
    async addStudent(studentData) {
        const student = new Student({
            ...studentData,
            class_id: this.id
        });
        await student.insert();
        return student;
    }

    /**
     * Get class statistics
     * @returns {Object} Class statistics
     */
    async getStats() {
        const students = await this.getStudents();
        
        if (students.length === 0) {
            return {
                totalStudents: 0,
                totalInitialBalance: 0,
                totalCurrentBalance: 0,
                averageInitialBalance: 0,
                averageCurrentBalance: 0
            };
        }

        const totalInitialBalance = students.reduce((sum, s) => sum + (parseFloat(s.initial_balance) || 0), 0);
        const totalCurrentBalance = students.reduce((sum, s) => sum + (parseFloat(s.current_balance) || 0), 0);

        return {
            totalStudents: students.length,
            totalInitialBalance: parseFloat(totalInitialBalance) || 0,
            totalCurrentBalance: parseFloat(totalCurrentBalance) || 0,
            averageInitialBalance: parseFloat(totalInitialBalance / students.length) || 0,
            averageCurrentBalance: parseFloat(totalCurrentBalance / students.length) || 0
        };
    }

    /**
     * Reset all student balances in this class
     * @returns {Array} Updated students
     */
    async resetAllStudentBalances() {
        const students = await this.getStudents();
        const updatedStudents = [];
        
        for (const studentData of students) {
            const student = new Student(studentData);
            await student.resetBalance();
            updatedStudents.push(student);
        }
        
        return updatedStudents;
    }

    // Convert to frontend-compatible format
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            createdAt: this.created_at
        };
    }

    // Get class with students included
    async toJSONWithStudents() {
        const students = await this.getStudents();
        const formattedStudents = students.map(student => {
            const s = new Student(student);
            return s.toJSON();
        });

        return {
            ...this.toJSON(),
            students: formattedStudents
        };
    }
}
