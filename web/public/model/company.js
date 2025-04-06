/**
 * Company Class
 * Represents a company in the BusiCode application with financial tracking
 */
import Product from './product.js';

export default class Company {
    constructor(id, name, classroomName, memberContributions) {
        this.id = id;
        this.name = name;
        this.classroomName = classroomName;
        
        // Armazena as contribuições individuais de cada membro
        this.memberContributions = memberContributions || {};
        
        // Calcula o orçamento inicial baseado nas contribuições
        this.initialBudget = Object.values(this.memberContributions)
            .reduce((total, contribution) => total + (parseFloat(contribution) || 0), 0);
        
        this.currentBudget = this.initialBudget;
        this.memberIds = Object.keys(this.memberContributions);
        this.expenses = [];
        this.revenues = [];
    }

    /**
     * Adiciona um membro com sua contribuição
     * @param {string} memberId - ID do membro
     * @param {number} contribution - Valor da contribuição
     * @returns {boolean} - Se a adição foi bem-sucedida
     */
    addMember(memberId, contribution) {
        if (!memberId || this.memberIds.includes(memberId)) return false;
        
        const amount = parseFloat(contribution) || 0;
        this.memberContributions[memberId] = amount;
        this.memberIds.push(memberId);
        this.initialBudget += amount;
        this.currentBudget += amount;
        
        return true;
    }

    /**
     * Adiciona múltiplos membros com suas contribuições
     * @param {Object} memberContributions - Objeto com IDs dos membros como chaves e contribuições como valores
     * @returns {number} - Número de membros adicionados com sucesso
     */
    addMembers(memberContributions) {
        if (!memberContributions || typeof memberContributions !== 'object') return 0;
        
        let addedCount = 0;
        for (const [memberId, contribution] of Object.entries(memberContributions)) {
            if (this.addMember(memberId, contribution)) {
                addedCount++;
            }
        }
        
        return addedCount;
    }

    /**
     * Remove um membro e sua contribuição
     * @param {string} memberId - ID do membro
     * @returns {boolean} - Se a remoção foi bem-sucedida
     */
    removeMember(memberId) {
        if (!memberId || !this.memberIds.includes(memberId)) return false;
        
        // Não permitimos remover contribuições uma vez que já foram feitas
        this.memberIds = this.memberIds.filter(id => id !== memberId);
        return true;
    }

    /**
     * Obtém a contribuição de um membro específico
     * @param {string} memberId - ID do membro
     * @returns {number} - Valor da contribuição
     */
    getMemberContribution(memberId) {
        return parseFloat(this.memberContributions[memberId]) || 0;
    }

    /**
     * Add an expense to the company
     * @param {string} description - Description of the expense
     * @param {number} amount - Amount of the expense
     * @param {string} date - Date of the expense
     */
    addExpense(description, amount, date) {
        const expense = {
            id: `exp_${Date.now()}`,
            description,
            amount: parseFloat(amount),
            date: date || new Date().toISOString().split('T')[0]
        };
        
        this.expenses.push(expense);
        this.updateBudget();
        return expense;
    }

    /**
     * Add revenue to the company
     * @param {string} description - Description of the revenue
     * @param {number} amount - Amount of the revenue
     * @param {string} date - Date of the revenue
     */
    addRevenue(description, amount, date) {
        const revenue = {
            id: `rev_${Date.now()}`,
            description,
            amount: parseFloat(amount),
            date: date || new Date().toISOString().split('T')[0]
        };
        
        this.revenues.push(revenue);
        this.updateBudget();
        return revenue;
    }

    /**
     * Update the current budget based on expenses and revenues
     */
    updateBudget() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalRevenues = this.revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
        this.currentBudget = this.initialBudget - totalExpenses + totalRevenues;
    }

    /**
     * Get the total expenses
     * @returns {number} Total expense amount
     */
    getTotalExpenses() {
        return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }

    /**
     * Get the total revenues
     * @returns {number} Total revenue amount
     */
    getTotalRevenues() {
        return this.revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
    }

    /**
     * Get the profit (or loss)
     * @returns {number} Profit or loss amount
     */
    getProfit() {
        return this.getTotalRevenues() - this.getTotalExpenses();
    }

    /**
     * Add funds directly to the company
     * @param {number} amount - Amount to add
     * @param {string} description - Description of the fund addition
     * @returns {Object} The added revenue
     */
    addFunds(amount, description = 'Fund addition') {
        return this.addRevenue(description, amount);
    }

    /**
     * Remove funds directly from the company
     * @param {number} amount - Amount to remove
     * @param {string} description - Description of the fund removal
     * @returns {Object} The added expense
     */
    removeFunds(amount, description = 'Fund removal') {
        return this.addExpense(description, amount);
    }
}