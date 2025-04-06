/**
 * Company Class
 * Represents a company in the BusiCode application with financial tracking
 */
import Product from './product.js';

export default class Company {
    constructor(id, name, classroomName, memberContributions, memberIds) {
        this.id = id;
        this.name = name;
        this.classroomName = classroomName;
        
        // Armazena as contribuições individuais de cada membro
        this.memberContributions = memberContributions || {};
        
        // Calcula o orçamento inicial baseado nas contribuições
        this.initialBudget = Object.values(this.memberContributions)
            .reduce((total, contribution) => total + (parseFloat(contribution) || 0), 0);
        
        this.currentBudget = this.initialBudget;
        this.memberIds = memberIds || [];
        this.expenses = [];
        this.revenues = [];
    }

    /**
     * Adiciona um membro
     * @param {string} memberId - ID do membro
     * @returns {boolean} - Se a adição foi bem-sucedida
     */
    addMember(memberId) {
        if (!memberId || this.memberIds.includes(memberId)) return false;
        this.memberIds.push(memberId);
        return true;
    }

    /**
     * Adiciona múltiplos membros
     * @param {Object} memberIds - IDs dos membros
     * @returns {number} - Número de membros adicionados com sucesso
     */
    addMembers(memberIds) {
        if (!memberIds || !Array.isArray(memberIds)) return 0;
        
        let addedCount = 0;
        memberIds.forEach(id => {
            if (this.addMember(id)) addedCount++;
        });
        
        return addedCount;
    }

    /**
     * Remove um membro
     * @param {string} memberId - ID do membro
     * @returns {boolean} - Se a remoção foi bem-sucedida
     */
    removeMember(memberId) {
        if (!memberId || !this.memberIds.includes(memberId)) return false;
        
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
            date: date || new Date(),
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
            date: date || new Date(),
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

    /**
     * Get the company's activity history (expenses and revenues)
     * @returns {Array} Combined and sorted array of expenses and revenues
     */
    getActivityHistory() {
        // Combine expenses and revenues into a single array
        const expenses = this.expenses.map(item => ({
            ...item,
            type: 'expense',
            displayAmount: `-R$ ${item.amount.toFixed(2)}`
        }));
        
        const revenues = this.revenues.map(item => ({
            ...item,
            type: 'revenue',
            displayAmount: `+R$ ${item.amount.toFixed(2)}`
        }));
        
        // Combine and sort by date (newest first)
        const combined = [...expenses, ...revenues].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        return combined;
    }

    /**
     * Distribui lucros da empresa para um membro específico
     * @param {string} memberId - ID do membro
     * @param {number} amount - Valor a ser distribuído
     * @param {string} description - Descrição da distribuição
     * @returns {Object|null} - O objeto de despesa criado ou null se falhar
     */
    distributeProfits(memberId, amount, description = 'Distribuição de lucros') {
        // Verifica se o membro pertence à empresa
        if (!this.memberIds.includes(memberId)) return null;
        
        // Verifica se a empresa tem saldo suficiente
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0 || amount > this.getProfit()) return null;
        
        // Registra como uma despesa
        const descriptionWithMember = `${description} para membro: ${memberId}`;
        return this.addExpense(descriptionWithMember, amount);
    }
}