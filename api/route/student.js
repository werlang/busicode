import { Router } from 'express';
import Student from '../model/student.js';
import { authenticateToken } from '../middleware/auth.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Get all students
router.get('/', async (req, res, next) => {
    try {
        const { class_id } = req.query;
        let students;
        
        if (class_id) {
            students = await Student.getByClass(class_id);
        } else {
            students = await Student.getAll();
        }
        
        // Convert to frontend format
        const formattedStudents = students.map(student => {
            const s = new Student(student);
            return s.toJSON();
        });
        
        res.send({ students: formattedStudents });
    } catch (error) {
        next(error);
    }
});

// Get student by ID
router.get('/:id', async (req, res, next) => {
    try {
        const student = await new Student({ id: req.params.id }).get();
        res.send({ student: student.toJSON() });
    } catch (error) {
        next(error);
    }
});

// Create new student
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { name, classId, initialBalance } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Name is required');
        }
        
        if (!classId) {
            throw new CustomError(400, 'Class ID is required');
        }

        const student = new Student({
            name,
            class_id: classId,
            initial_balance: parseFloat(initialBalance) || 0,
            current_balance: parseFloat(initialBalance) || 0
        });

        await student.insert();
        
        res.status(201).send({
            message: 'Student created successfully',
            student: student.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Update student
router.put('/:id', authenticateToken, async (req, res, next) => {
    try {
        const student = await new Student({ id: req.params.id }).get();
        const { name, initialBalance } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (initialBalance !== undefined) {
            updateData.initial_balance = parseFloat(initialBalance);
            // Also update current balance to match new initial balance
            updateData.current_balance = parseFloat(initialBalance);
        }
        
        if (Object.keys(updateData).length === 0) {
            throw new CustomError(400, 'No valid fields to update');
        }
        
        await student.update(updateData);
        
        res.send({
            message: 'Student updated successfully',
            student: student.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Update student balance
router.put('/:id/balance', authenticateToken, async (req, res, next) => {
    try {
        const student = await new Student({ id: req.params.id }).get();
        const { amount, operation } = req.body;
        
        if (operation !== 'reset' && (!amount || isNaN(amount))) {
            throw new CustomError(400, 'Valid amount is required');
        }
        
        switch (operation) {
            case 'add':
                await student.addBalance(amount);
                break;
            case 'deduct':
                await student.deductBalance(amount);
                break;
            case 'reset':
                await student.resetBalance();
                break;
            default:
                throw new CustomError(400, 'Invalid operation. Use: add, deduct, or reset');
        }
        
        res.send({
            message: `Student balance ${operation}ed successfully`,
            student: student.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const student = await new Student({ id: req.params.id }).get();
        await student.delete();
        
        res.send({ 
            message: 'Student deleted successfully',
            student: student.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
