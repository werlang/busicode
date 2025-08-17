/**
 * Custom Error class for handling API errors
 */
export default class CustomError extends Error {
    constructor(status, message, data = null) {
        super(message);
        this.name = 'CustomError';
        this.status = status;
        this.data = data;
    }
}
