/**
 * Setup Manager
 * Manages the creation and management of classes and students
 */
import Toast from '../components/toast.js';
import Modal from '../components/modal.js';

export default class SetupManager {
    constructor(classManager) {
        this.classManager = classManager;
        
        // Initialize UI elements
        this.initializeUI();
    }

    /**
     * Initialize UI elements for setup management
     */
    initializeUI() {
        // Class management elements
        this.createClassBtn = document.getElementById('create-class-btn');
        this.classNameInput = document.getElementById('class-name');
        this.classSelect = document.getElementById('class-select');
        this.studentCsvInput = document.getElementById('student-csv');
        this.importStudentsBtn = document.getElementById('import-students-btn');
        this.classesList = document.getElementById('classes-list');
        this.studentInitialBalanceInput = document.getElementById('student-initial-balance');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Render initial data
        this.renderClassList();
    }

    

    

    
}