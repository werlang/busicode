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
        for (const classKey in classData) {
            classData[classKey].students = classData[classKey].students.map(student => new Student(
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
     * @returns {Object|boolean} Class object if successful, false if class already exists
     */
    createClass(className) {
        // Check if className already exists in any class
        const classExists = Object.values(this.classes).some(classObj => classObj.name === className);
        
        if (className && !classExists) {
            const classId = `class_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            this.classes[classId] = {
                id: classId,
                name: className,
                students: []
            };
            this.saveClasses();
            return this.classes[classId];
        }
        return false;
    }
    
    /**
     * Rename a class
     * @param {string} classId - The ID of the class to rename
     * @param {string} newName - The new name for the class
     * @returns {boolean} True if successful, false if class not found or name already exists
     */
    renameClass(classId, newName) {
        // Check if the class exists
        if (!this.classes[classId]) return false;
        
        // Check if the new name already exists in another class
        const nameExists = Object.entries(this.classes).some(([id, classObj]) => 
            id !== classId && classObj.name === newName
        );
        
        if (nameExists) return false;
        
        // Rename the class
        this.classes[classId].name = newName;
        this.saveClasses();
        
        // Dispatch event to notify other components
        document.dispatchEvent(new CustomEvent('classRenamed', { 
            detail: { 
                classId, 
                oldName: this.classes[classId].name, 
                newName 
            } 
        }));
        
        return true;
    }

    /**
     * Get all classes
     * @returns {Array} Array of class objects with id and name
     */
    getAllClasses() {
        this.classes = this.loadClasses();
        return Object.values(this.classes);
    }
    
    /**
     * Get all class names
     * @returns {string[]} Array of class names
     */
    getClassNames() {
        this.classes = this.loadClasses();
        return Object.values(this.classes).map(classObj => classObj.name);
    }
    
    /**
     * Get class by ID
     * @param {string} classId - The ID of the class
     * @returns {Object|null} Class object or null if not found
     */
    getClassById(classId) {
        this.classes = this.loadClasses();
        return this.classes[classId] || null;
    }
    
    /**
     * Get class ID by name
     * @param {string} className - The name of the class
     * @returns {string|null} Class ID or null if not found
     */
    getClassIdByName(className) {
        const classEntry = Object.entries(this.classes).find(([_, classObj]) => 
            classObj.name === className
        );
        return classEntry ? classEntry[0] : null;
    }

    /**
     * Get students from a specific class
     * @param {string} classId - The ID of the class
     * @returns {Student[]} Array of students in the class
     */
    getStudents(classId) {
        this.classes = this.loadClasses();
        return this.classes[classId].students || [];
    }

    /**
     * Add students to a class from CSV string
     * @param {string} classId - The ID of the class
     * @param {string} csvString - Comma-separated string of student names
     * @param {number} initialBalance - Initial balance for each student
     * @returns {number} Number of students added
     */
    addStudentsFromCSV(classId, csvString, initialBalance = 0) {
        // Support both new ID-based and old name-based lookup for backward compatibility
        let targetClass = this.classes[classId];
        
        if (!targetClass) {
            // Try to find by name (for backward compatibility)
            const classIdByName = this.getClassIdByName(classId);
            targetClass = classIdByName ? this.classes[classIdByName] : null;
        }
        
        if (!targetClass) return 0;
        
        // Parse CSV and create new students
        const names = csvString.split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        let addedCount = 0;
        
        names.forEach(name => {
            // Generate a unique ID for the student
            const id = `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            targetClass.students.push(new Student(id, name, initialBalance));
            addedCount++;
        });
        
        this.saveClasses();
        return addedCount;
    }

    /**
     * Add a single student to a class
     * @param {string} classId - The ID of the class
     * @param {string} studentName - The name of the student
     * @param {number} initialBalance - Initial balance for the student
     * @returns {Student} The created student object
     */
    addStudent(classId, studentName, initialBalance = 0) {
        // Support both new ID-based and old name-based lookup
        let targetClass = this.classes[classId];
        
        if (!targetClass) {
            // Try to find by name (for backward compatibility)
            const classIdByName = this.getClassIdByName(classId);
            if (classIdByName) {
                targetClass = this.classes[classIdByName];
                classId = classIdByName;
            } else {
                // Create a new class if it doesn't exist
                const newClassObj = this.createClass(classId);
                if (newClassObj) {
                    targetClass = newClassObj;
                    classId = newClassObj.id;
                }
            }
        }
        
        if (!targetClass) return null;
        
        // Generate a unique ID for the student
        const id = `student_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const student = new Student(id, studentName, initialBalance);
        
        targetClass.students.push(student);
        this.saveClasses();
        
        return student;
    }

    /**
     * Remove a student from a class
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student to remove
     * @returns {boolean} True if successful, false if student not found
     */
    removeStudent(classId, studentId) {
        // Support both new ID-based and old name-based lookup
        let targetClass = this.classes[classId];
        
        if (!targetClass) {
            // Try to find by name (for backward compatibility)
            const classIdByName = this.getClassIdByName(classId);
            targetClass = classIdByName ? this.classes[classIdByName] : null;
        }
        
        if (!targetClass) return false;
        
        const initialLength = targetClass.students.length;
        targetClass.students = targetClass.students.filter(student => student.id !== studentId);
        
        if (initialLength !== targetClass.students.length) {
            this.saveClasses();
            return true;
        }
        
        return false;
    }

    /**
     * Delete a class
     * @param {string} classId - The ID of the class to delete
     * @returns {boolean} True if successful, false if class not found
     */
    deleteClass(classId) {
        // Support both new ID-based and old name-based lookup
        if (this.classes[classId]) {
            delete this.classes[classId];
            this.saveClasses();
            return true;
        } else {
            // Try to find by name (for backward compatibility)
            const classIdByName = this.getClassIdByName(classId);
            if (classIdByName) {
                delete this.classes[classIdByName];
                this.saveClasses();
                return true;
            }
        }
        return false;
    }

    /**
     * Modify a student's balance
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student
     * @param {number} amount - Amount to add (positive) or remove (negative)
     * @param {string} action - Either 'add' or 'remove'
     * @returns {boolean} True if successful
     */
    modifyStudentBalance(classId, studentId, amount, action) {
        const studentsArray = this.getStudents(classId);
        const student = studentsArray.find(s => s.id === studentId);
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
     * @param {string} classId - The ID of the class
     * @param {string} action - Either 'add' or 'remove'
     * @param {number} amount - Amount to add or remove
     * @returns {Object} Object with counts of successful and failed operations
     */
    applyBulkAction(classId, action, amount) {
        const students = this.getStudents(classId);
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