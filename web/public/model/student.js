/**
 * Student Class
 * Represents a student in the BusiCode application
 */
export default class Student {
    constructor(id, name, initialBalance = 0) {
        this.id = id;
        this.name = name;
        this.initialBalance = parseFloat(initialBalance) || 0;
        this.currentBalance = this.initialBalance;
    }

    /**
     * Deduz um valor do saldo do aluno
     * @param {number} amount - Valor a ser deduzido
     * @returns {boolean} - Se a operação foi bem-sucedida
     */
    deductBalance(amount) {
        const deduction = parseFloat(amount) || 0;
        if (deduction <= 0) return false;
        if (deduction > this.currentBalance) return false;
        
        this.currentBalance -= deduction;
        return true;
    }

    /**
     * Adiciona um valor ao saldo do aluno
     * @param {number} amount - Valor a ser adicionado
     * @returns {boolean} - Se a operação foi bem-sucedida
     */
    addBalance(amount) {
        const addition = parseFloat(amount) || 0;
        if (addition <= 0) return false;
        
        this.currentBalance += addition;
        return true;
    }
}