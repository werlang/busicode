/**
 * Storage Manager
 * Handles saving and loading UI state and preferences to local storage
 * NOTE: This class is now only used for UI state (navigation, filters, etc.)
 * Business data (classes, companies, students, products) is handled via API
 */
export default class Storage {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    /**
     * Save data to local storage
     * @param {Object} data - The data to save
     */
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * Load data from local storage
     * @returns {Object} The retrieved data, or null if none exists
     */
    loadData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Clear all data from storage
     */
    clearData() {
        localStorage.removeItem(this.storageKey);
    }
}