/**
 * Class Manager
 * Manages classes and students in the BusiCode application
 */
import StorageManager from '../helpers/storage-manager.js';
import Student from './student.js';

export default class ClassManager {
    constructor() {
        this.storage = new StorageManager('busicode_classes');
        this.classes = this.loadClasses();
    }

    /**
     * Load classes from storage
     * @returns {Object} An object containing all classes and their students
     */
    loadClasses() {
        return this.storage.loadData() || {};
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
        return Object.keys(this.classes);
    }

    /**
     * Get students from a specific class
     * @param {string} className - The name of the class
     * @returns {Student[]} Array of students in the class
     */
    getStudents(className) {
        const studentsList = this.classes[className] || [];
        return studentsList.map(student => new Student(student.id, student.name, student.initialBalance));
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
            // Generate a unique ID for the student
            const id = `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            this.classes[className].push(new Student(id, name, initialBalance));
            addedCount++;
        });
        
        this.saveClasses();
        return addedCount;
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
}