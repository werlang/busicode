/**
 * Storage Manager
 * Handles saving and loading data from local storage
 */
export default class StorageManager {
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