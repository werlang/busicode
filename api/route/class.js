import { Router } from 'express';
import Class from '../model/class.js';
import Student from '../model/student.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Get all classes
router.get('/', async (req, res, next) => {
    try {
        const { include_students } = req.query;
        const classes = await Class.getAll();
        
        const formattedClasses = [];
        
        for (const classData of classes) {
            const classObj = new Class(classData);
            
            if (include_students === 'true') {
                const result = await classObj.toJSONWithStudents();
                formattedClasses.push(result);
            } else {
                formattedClasses.push(classObj.toJSON());
            }
        }
        
        res.send({ classes: formattedClasses });
    } catch (error) {
        next(error);
    }
});

// Get class by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { include_students } = req.query;
        const classObj = await new Class({ id: req.params.id }).get();
        
        let result;
        if (include_students === 'true') {
            result = await classObj.toJSONWithStudents();
        } else {
            result = classObj.toJSON();
        }
        
        res.send({ class: result });
    } catch (error) {
        next(error);
    }
});

// Create new class
router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Class name is required');
        }
        
        const classObj = new Class({ name });
        await classObj.insert();
        
        res.status(201).send({
            message: 'Class created successfully',
            class: classObj.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Update class
router.put('/:id', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        const { name } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Class name is required');
        }
        
        await classObj.update({ name });
        
        res.send({
            message: 'Class updated successfully',
            class: classObj.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Get class statistics
router.get('/:id/stats', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        const stats = await classObj.getStats();
        
        res.send({
            class: classObj.toJSON(),
            stats
        });
    } catch (error) {
        next(error);
    }
});

// Get students in a class
router.get('/:id/students', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        const students = await classObj.getStudents();
        
        const formattedStudents = students.map(student => {
            const s = new Student(student);
            return s.toJSON();
        });
        
        res.send({ 
            class: classObj.toJSON(),
            students: formattedStudents 
        });
    } catch (error) {
        next(error);
    }
});

// Add student to class
router.post('/:id/students', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        const { name, initialBalance } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Student name is required');
        }
        
        const student = await classObj.addStudent({
            name,
            initial_balance: parseFloat(initialBalance) || 0,
            current_balance: parseFloat(initialBalance) || 0
        });
        
        res.status(201).send({
            message: 'Student added to class successfully',
            student: student.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Reset all student balances in class
router.post('/:id/reset-balances', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        const students = await classObj.resetAllStudentBalances();
        
        const formattedStudents = students.map(student => student.toJSON());
        
        res.send({
            message: 'All student balances reset successfully',
            class: classObj.toJSON(),
            students: formattedStudents
        });
    } catch (error) {
        next(error);
    }
});

// Delete class
router.delete('/:id', async (req, res, next) => {
    try {
        const classObj = await new Class({ id: req.params.id }).get();
        
        // Check if class has students
        const students = await classObj.getStudents();
        if (students.length > 0) {
            throw new CustomError(409, 'Cannot delete class with students. Delete students first.');
        }
        
        await classObj.delete();
        
        res.send({ 
            message: 'Class deleted successfully',
            class: classObj.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
