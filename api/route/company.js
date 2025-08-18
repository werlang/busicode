import { Router } from 'express';
import Company from '../model/company.js';
import Student from '../model/student.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Get all companies
router.get('/', async (req, res, next) => {
    try {
        const { class_id, include_details } = req.query;
        let companies;
        
        if (class_id) {
            companies = await Company.getByClass(class_id);
        } else {
            companies = await Company.getAll();
        }
        
        const formattedCompanies = [];
        
        for (const companyData of companies) {
            const company = new Company(companyData);
            
            if (include_details === 'true') {
                const details = await company.toJSONWithDetails();
                formattedCompanies.push(details);
            } else {
                formattedCompanies.push(company.toJSON());
            }
        }
        
        res.send({ companies: formattedCompanies });
    } catch (error) {
        next(error);
    }
});

// Get company by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { include_details } = req.query;
        const company = await new Company({ id: req.params.id }).get();
        
        let result;
        if (include_details === 'true') {
            result = await company.toJSONWithDetails();
        } else {
            result = company.toJSON();
        }
        
        res.send({ company: result });
    } catch (error) {
        next(error);
    }
});

// Create new company
router.post('/', async (req, res, next) => {
    try {
        const { name, classId, memberIds, memberContributions } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Company name is required');
        }
        
        if (!classId) {
            throw new CustomError(400, 'Class ID is required');
        }
        
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            throw new CustomError(400, 'At least one member is required');
        }
        
        // Check for duplicate member IDs in the request
        const uniqueMemberIds = [...new Set(memberIds)];
        if (uniqueMemberIds.length !== memberIds.length) {
            throw new CustomError(400, 'Duplicate member IDs are not allowed');
        }
        
        // Calculate initial budget from contributions
        const contributions = memberContributions || {};
        const initialBudget = uniqueMemberIds.reduce((sum, memberId) => {
            return sum + (parseFloat(contributions[memberId]) || 0);
        }, 0);
        
        const company = new Company({
            name,
            class_id: classId,
            initial_budget: initialBudget,
            current_budget: initialBudget
        });

        await company.insert();
        
        // Add members to company
        for (const memberId of uniqueMemberIds) {
            const contribution = parseFloat(contributions[memberId]) || 0;
            await company.addMember(memberId, contribution);
        }
        
        const result = await company.toJSONWithDetails();
        
        res.status(201).send({
            message: 'Company created successfully',
            company: result
        });
    } catch (error) {
        next(error);
    }
});

// Update company
router.put('/:id', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const { name } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Company name is required');
        }
        
        await company.update({ name });
        
        res.send({
            message: 'Company updated successfully',
            company: company.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Get company members
router.get('/:id/members', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const members = await company.getMembers();
        
        res.send({ 
            company: company.toJSON(),
            members 
        });
    } catch (error) {
        next(error);
    }
});

// Add member to company
router.post('/:id/members', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const { studentId, contribution } = req.body;
        
        if (!studentId) {
            throw new CustomError(400, 'Student ID is required');
        }
        
        // Verify student exists
        await new Student({ id: studentId }).get();
        
        const membershipRecord = await company.addMember(studentId, contribution || 0);
        
        res.status(201).send({
            message: 'Member added to company successfully',
            membership: membershipRecord
        });
    } catch (error) {
        next(error);
    }
});

// Remove member from company
router.delete('/:id/members/:studentId', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const success = await company.removeMember(req.params.studentId);
        
        if (!success) {
            throw new CustomError(404, 'Member not found in company');
        }
        
        res.send({
            message: 'Member removed from company successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Get company expenses
router.get('/:id/expenses', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const expenses = await company.getExpenses();
        
        res.send({ 
            company: company.toJSON(),
            expenses: expenses.map(expense => ({
                description: expense.description,
                date: expense.created_at,
                amount: expense.amount,
            }))
        });
    } catch (error) {
        next(error);
    }
});

// Add expense
router.post('/:id/expenses', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const { description, amount } = req.body;
        
        if (!description) {
            throw new CustomError(400, 'Expense description is required');
        }
        
        if (!amount || isNaN(amount)) {
            throw new CustomError(400, 'Valid expense amount is required');
        }
        
        const expense = await company.addExpense(description, amount);
        
        res.status(201).send({
            message: 'Expense added successfully',
            expense,
            company: company.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Get company revenues
router.get('/:id/revenues', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const revenues = await company.getRevenues();
        
        res.send({ 
            company: company.toJSON(),
            revenues: revenues.map(revenue => ({ 
                description: revenue.description,
                date: revenue.created_at,
                amount: revenue.amount,
            }))
        });
    } catch (error) {
        next(error);
    }
});

// Add revenue
router.post('/:id/revenues', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const { description, amount } = req.body;
        
        if (!description) {
            throw new CustomError(400, 'Revenue description is required');
        }
        
        if (!amount || isNaN(amount)) {
            throw new CustomError(400, 'Valid revenue amount is required');
        }
        
        const revenue = await company.addRevenue(description, amount);
        
        res.status(201).send({
            message: 'Revenue added successfully',
            revenue,
            company: company.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Get financial summary
router.get('/:id/financial-summary', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const summary = await company.getFinancialSummary();
        
        res.send({ 
            company: company.toJSON(),
            financialSummary: summary 
        });
    } catch (error) {
        next(error);
    }
});

// Distribute profits
router.post('/:id/distribute-profits', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        const { studentId, amount, description } = req.body;
        
        if (!studentId) {
            throw new CustomError(400, 'Student ID is required');
        }
        
        if (!amount || isNaN(amount)) {
            throw new CustomError(400, 'Valid amount is required');
        }
        
        const distribution = await company.distributeProfits(studentId, amount, description);
        
        res.status(201).send({
            message: 'Profits distributed successfully',
            distribution
        });
    } catch (error) {
        next(error);
    }
});

// Delete company
router.delete('/:id', async (req, res, next) => {
    try {
        const company = await new Company({ id: req.params.id }).get();
        
        // TODO: Add validation to prevent deletion if company has products, etc.
        
        await company.delete();
        
        res.send({ 
            message: 'Company deleted successfully',
            company: company.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
