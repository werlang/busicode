/**
 * Class Manager
 * Handles data operations for classes and students in the BusiCode application
 */
import Request from './request.js';
import Student from '../model/student.js';

export default class ClassManager {
    constructor() {
        this.request = new Request({
            url: 'http://localhost:3000',
        });
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
     * Create a new class
     * @param {string} className - The name of the class to create
     * @returns {Object|boolean} Class object if successful, false if class already exists
     */
    async createClass(className) {
        try {
            const response = await this.getRequest().post('classes', { name: className });
            return response;
        } catch (error) {
            if (error.status === 400) {
                return false;
            }
            throw error;
        }
    }
    
    /**
     * Rename a class
     * @param {string} classId - The ID of the class to rename
     * @param {string} newName - The new name for the class
     * @returns {boolean} True if successful, false if class not found or name already exists
     */
    async renameClass(classId, newName) {
        try {
            await this.getRequest().put(`classes/${classId}`, { name: newName });
            
            // Dispatch event to notify other components
            document.dispatchEvent(new CustomEvent('classRenamed', { 
                detail: { 
                    classId, 
                    newName 
                } 
            }));
            
            return true;
        } catch (error) {
            if (error.status === 400 || error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get all classes
     * @returns {Array} Array of class objects with id and name
     */
    async getAllClasses(includeStudents = false) {
        try {
            const queryParams = includeStudents ? { include_students: 'true' } : {};
            const response = await this.getRequest().get('classes', queryParams);
            // Extract classes array from the response object
            return response.classes || [];
        } catch (error) {
            console.error('Error getting all classes:', error);
            return [];
        }
    }
    
    /**
     * Get all class names
     * @returns {string[]} Array of class names
     */
    async getClassNames() {
        try {
            const classes = await this.getAllClasses();
            return classes.map(classObj => classObj.name);
        } catch (error) {
            console.error('Error getting class names:', error);
            return [];
        }
    }
    
    /**
     * Get class by ID
     * @param {string} classId - The ID of the class
     * @returns {Object|null} Class object or null if not found
     */
    async getClassById(classId, includeStudents = false) {
        try {
            const { class: classObj } = await this.getRequest().get(`classes/${classId}`, {
                include_details: true,
                include_students: includeStudents
            });
            return classObj;
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            throw error;
        }
    }
    
    /**
     * Get class ID by name
     * @param {string} className - The name of the class
     * @returns {string|null} Class ID or null if not found
     */
    async getClassIdByName(className) {
        try {
            const classes = await this.getAllClasses();
            const foundClass = classes.find(classObj => classObj.name === className);
            return foundClass ? foundClass.id : null;
        } catch (error) {
            console.error('Error getting class ID by name:', error);
            return null;
        }
    }

    /**
     * Get students from a specific class
     * @param {string} classId - The ID of the class
     * @returns {Student[]} Array of students in the class
     */
    async getStudents(classId) {
        try {
            const classObj = await this.getClassById(classId, true);
            if (!classObj || !classObj.students) {
                return [];
            }
            
            // Convert API response to Student instances
            return classObj.students.map(student => new Student(
                student.id,
                student.name,
                student.initialBalance,
                student.currentBalance
            ));
        } catch (error) {
            console.error('Error getting students:', error);
            return [];
        }
    }

    /**
     * Add students to a class from CSV string
     * @param {string} classId - The ID of the class
     * @param {string} csvString - Comma-separated string of student names
     * @param {number} initialBalance - Initial balance for each student
     * @returns {number} Number of students added
     */
    async addStudentsFromCSV(classId, csvString, initialBalance = 0) {
        try {
            // Parse CSV and create new students
            const names = csvString.split(',')
                .map(name => name.trim())
                .filter(name => name.length > 0);
            
            let addedCount = 0;
            
            for (const name of names) {
                try {
                    await this.getRequest().post('students', {
                        name,
                        initialBalance,
                        classId
                    });
                    addedCount++;
                } catch (error) {
                    console.error(`Error adding student ${name}:`, error);
                }
            }
            
            return addedCount;
        } catch (error) {
            console.error('Error adding students from CSV:', error);
            return 0;
        }
    }

    /**
     * Add a single student to a class
     * @param {string} classId - The ID of the class
     * @param {string} studentName - The name of the student
     * @param {number} initialBalance - Initial balance for the student
     * @returns {Student} The created student object
     */
    async addStudent(classId, studentName, initialBalance = 0) {
        try {
            const studentData = await this.getRequest().post('students', {
                name: studentName,
                initialBalance,
                classId
            });
            
            return new Student(
                studentData.id,
                studentData.name,
                studentData.initialBalance,
                studentData.currentBalance
            );
        } catch (error) {
            console.error('Error adding student:', error);
            return null;
        }
    }

    /**
     * Remove a student from a class
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student to remove
     * @returns {boolean} True if successful, false if student not found
     */
    async removeStudent(classId, studentId) {
        try {
            await this.getRequest().delete(`students/${studentId}`);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Delete a class
     * @param {string} classId - The ID of the class to delete
     * @returns {boolean} True if successful, false if class not found
     */
    async deleteClass(classId) {
        try {
            await this.getRequest().delete(`classes/${classId}`);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Modify a student's balance
     * @param {string} classId - The ID of the class
     * @param {string} studentId - The ID of the student
     * @param {number} amount - Amount to add (positive) or remove (negative)
     * @param {string} action - Either 'add' or 'remove'
     * @returns {boolean} True if successful
     */
    async modifyStudentBalance(classId, studentId, amount, action) {
        try {
            const operation = action === 'add' ? 'add' : 'deduct';
            await this.getRequest().put(`students/${studentId}/balance`, { amount, operation });
            return true;
        } catch (error) {
            console.error('Error modifying student balance:', error);
            return false;
        }
    }

    /**
     * Apply bulk action to all students in a class
     * @param {string} classId - The ID of the class
     * @param {string} action - Either 'add' or 'remove'
     * @param {number} amount - Amount to add or remove
     * @returns {Object} Object with counts of successful and failed operations
     */
    async applyBulkAction(classId, action, amount) {
        try {
            const students = await this.getStudents(classId);
            if (!students || students.length === 0) {
                return { successCount: 0, failCount: 0, studentIds: [] };
            }
            
            let successCount = 0;
            let failCount = 0;
            const studentIds = [];
            
            for (const student of students) {
                try {
                    const success = await this.modifyStudentBalance(classId, student.id, amount, action);
                    if (success) {
                        successCount++;
                        studentIds.push(student.id);
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                }
            }
            
            return { 
                successCount, 
                failCount,
                studentIds
            };
        } catch (error) {
            console.error('Error applying bulk action:', error);
            return { successCount: 0, failCount: 0, studentIds: [] };
        }
    }
}