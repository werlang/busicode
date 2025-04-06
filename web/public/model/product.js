/**
 * Product Class
 * Represents a product in the BusiCode application
 */
export default class Product {
    /**
     * @param {string} id - Unique identifier for the product
     * @param {string} name - Name of the product
     * @param {string} description - Description of the product
     * @param {number} price - Selling price of the product
     * @param {string} companyId - Unique identifier for the company
     */
    constructor(id, name, price = 0, companyId) {
        this.id = id;
        this.name = name;
        this.companyId = companyId;
        this.price = parseFloat(price) || 0;
        this.sales = 0;
        this.total = 0;
        this.launchedAt = new Date().toISOString();
    }

    /**
     * Add a sale to the product
     * @param {number} quantity - Quantity sold
     * @returns {number} Total revenue from the sale
     */
    addSales(quantity) {
        const units = parseInt(quantity) || 0;
        if (units <= 0) return 0;

        this.sales += units;
        this.total += units * this.price;
        
        return this.total;
    }

    /**
     * Change the product price
     * @param {number} newPrice - New price for the product
     * @returns {boolean} Whether the price change was successful
     */
    updatePrice(newPrice) {
        const price = parseFloat(newPrice) || 0;
        if (price <= 0) return false;

        this.price = price;
        return true;
    }

}