import CustomError from '../helpers/error.js';
import Mysql from '../helpers/mysql.js';

export default class Model {
    constructor(table, options = {}) {
        this.table = table;
        this.fields = options.fields || {};
        this.allowUpdate = options.allowUpdate || [];
        this.insertFields = options.insertFields || [];
        
        // Set field values
        Object.keys(this.fields).forEach(field => {
            this[field] = this.fields[field];
        });
    }

    static async getAll(table, filter = {}, options = {}) {
        return Mysql.find(table, { filter, opt: options });
    }

    async get() {
        const result = await Mysql.find(this.table, { 
            filter: { id: this.id },
            opt: { limit: 1 }
        });
        
        if (!result || result.length === 0) {
            throw new CustomError(404, `${this.table.slice(0, -1)} not found`);
        }
        
        // Update current instance with database values
        const data = result[0];
        Object.keys(data).forEach(key => {
            this[key] = data[key];
        });
        
        return this;
    }

    async getBy(field, additionalFilters = {}) {
        const filter = { [field]: this[field], ...additionalFilters };
        const result = await Mysql.find(this.table, { 
            filter,
            opt: { limit: 1 }
        });
        
        if (!result || result.length === 0) {
            throw new CustomError(404, `${this.table.slice(0, -1)} not found`);
        }
        
        // Update current instance with database values
        const data = result[0];
        Object.keys(data).forEach(key => {
            this[key] = data[key];
        });
        
        return this;
    }

    async insert() {
        // Prepare data for insertion
        const insertData = {};
        this.insertFields.forEach(field => {
            if (this[field] !== undefined && this[field] !== null) {
                insertData[field] = this[field];
            }
        });

        // Add created_at if it exists in fields
        if (this.fields.hasOwnProperty('created_at')) {
            insertData.created_at = new Date();
        }

        const result = await Mysql.insert(this.table, insertData);
        
        // Set the ID from the insert result
        if (result && result.insertId) {
            this.id = result.insertId;
        }
        
        return result;
    }

    async update(data = {}) {
        if (!this.id) {
            throw new CustomError(400, 'ID is required for update');
        }

        // Filter data to only include allowed update fields
        const updateData = {};
        Object.keys(data).forEach(key => {
            if (this.allowUpdate.includes(key)) {
                updateData[key] = data[key];
                this[key] = data[key]; // Update local instance
            }
        });

        if (Object.keys(updateData).length === 0) {
            throw new CustomError(400, 'No valid fields to update');
        }

        return Mysql.update(this.table, updateData, this.id);
    }

    async delete() {
        if (!this.id) {
            throw new CustomError(400, 'ID is required for delete');
        }
        
        return Mysql.delete(this.table, this.id);
    }

    // Helper method to convert to JSON representation
    toJSON() {
        const json = {};
        Object.keys(this.fields).forEach(field => {
            json[field] = this[field];
        });
        return json;
    }
}
