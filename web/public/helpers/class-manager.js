/**
 * Class Manager
 * Handles data operations for classes and students in the BusiCode application
 */
import Storage from './storage.js';
import Student from '../model/student.js';

export default class ClassManager {
    constructor() {
        this.storage = new Storage('busicode_classes');
        this.classes = this.loadClasses();
    }

    /**
     * Load classes from storage
     * @returns {Object} An object containing all classes and their students
     */
    loadClasses() {
        const classData = this.storage.loadData() || {};
        // Convert plain objects to Student instances
        for (const className in classData) {
            classData[className] = classData[className].map(student => new Student(
                student.id,
                student.name,
                student.initialBalance,
                student.currentBalance
            ));
        }
        return classData;
    }

    /**
     * Save classes to storage
     */
    saveClasses() {
        this.storage.saveData(this.classes);
    }

    /**
     * Create a new class
     * @param {string} className - The name of the class to create
     * @returns {boolean} True if successful, false if class already exists
     */
    createClass(className) {
        if (className && !this.classes[className]) {
            this.classes[className] = [];
            this.saveClasses();
            return true;
        }
        return false;
    }

    /**
     * Get all class names
     * @returns {string[]} Array of class names
     */
    getClassNames() {
        this.classes = this.loadClasses();
        return Object.keys(this.classes);
    }

    /**
     * Get students from a specific class
     * @param {string} className - The name of the class
     * @returns {Student[]} Array of students in the class
     */
    getStudents(className) {
        this.classes = this.loadClasses();
        return this.classes[className] || [];
    }

    /**
     * Add students to a class from CSV string
     * @param {string} className - The name of the class
     * @param {string} csvString - Comma-separated string of student names
     * @param {number} initialBalance - Initial balance for each student
     * @returns {number} Number of students added
     */
    addStudentsFromCSV(className, csvString, initialBalance = 0) {
        if (!this.classes[className]) return 0;
        
        // Parse CSV and create new students
        const names = csvString.split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        let addedCount = 0;
        
        names.forEach(name => {
            // Generate a unique ID for the student now + rando string
            const id = `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            this.classes[className].push(new Student(id, name, initialBalance));
            addedCount++;
        });
        
        this.saveClasses();
        return addedCount;
    }

    /**
     * Add a single student to a class
     * @param {string} className - The name of the class
     * @param {string} studentName - The name of the student
     * @param {number} initialBalance - Initial balance for the student
     * @returns {Student} The created student object
     */
    addStudent(className, studentName, initialBalance = 0) {
        if (!this.classes[className]) {
            this.classes[className] = [];
        }
        
        // Generate a unique ID for the student
        const id = `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const student = new Student(id, studentName, initialBalance);
        
        this.classes[className].push(student);
        this.saveClasses();
        
        return student;
    }

    /**
     * Remove a student from a class
     * @param {string} className - The name of the class
     * @param {string} studentId - The ID of the student to remove
     * @returns {boolean} True if successful, false if student not found
     */
    removeStudent(className, studentId) {
        if (!this.classes[className]) return false;
        
        const initialLength = this.classes[className].length;
        this.classes[className] = this.classes[className].filter(student => student.id !== studentId);
        
        if (initialLength !== this.classes[className].length) {
            this.saveClasses();
            return true;
        }
        return false;
    }

    /**
     * Delete a class
     * @param {string} className - The name of the class to delete
     * @returns {boolean} True if successful, false if class not found
     */
    deleteClass(className) {
        if (this.classes[className]) {
            delete this.classes[className];
            this.saveClasses();
            return true;
        }
        return false;
    }

    /**
     * Modify a student's balance
     * @param {string} className - The name of the class
     * @param {string} studentId - The ID of the student
     * @param {number} amount - Amount to add (positive) or remove (negative)
     * @param {string} action - Either 'add' or 'remove'
     * @returns {boolean} True if successful
     */
    modifyStudentBalance(className, studentId, amount, action) {
        const student = this.getStudents(className).find(s => s.id === studentId);
        if (!student) return false;
        
        let success = false;
        if (action === 'add') {
            success = student.addBalance(amount);
        } else if (action === 'remove') {
            success = student.deductBalance(amount);
        }
        
        if (success) {
            this.saveClasses();
        }
        
        return success;
    }

    /**
     * Apply bulk action to all students in a class
     * @param {string} className - The name of the class
     * @param {string} action - Either 'add' or 'remove'
     * @param {number} amount - Amount to add or remove
     * @returns {Object} Object with counts of successful and failed operations
     */
    applyBulkAction(className, action, amount) {
        const students = this.getStudents(className);
        if (!students || students.length === 0) {
            return { successCount: 0, failCount: 0 };
        }
        
        const isAdding = action === 'add';
        let successCount = 0;
        let failCount = 0;
        
        students.forEach(student => {
            let success = false;
            
            if (isAdding) {
                success = student.addBalance(amount);
            } else {
                if (student.currentBalance >= amount) {
                    success = student.deductBalance(amount);
                }
            }
            
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        });
        
        this.saveClasses();
        
        return { 
            successCount, 
            failCount,
            studentIds: students.map(s => s.id)
        };
    }
}