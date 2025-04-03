/**
 * BusiCode Application
 * 
 * Main application file that initializes the BusiCode educational activity management system
 */

// Import all necessary classes
import ClassManager from './helpers/class-manager.js';
import CompanyManager from './helpers/company-manager.js';
import SetupManager from './model/setup-manager.js';
import CompanyCreationManager from './model/company-creation-manager.js';
import CompanyOperationsManager from './model/company-operations-manager.js';
import NavigationManager from './components/navigation-manager.js';
import ProductLaunchManager from './model/product-launch-manager.js';

// Initialize core manager components
const classManager = new ClassManager();
const companyManager = new CompanyManager(classManager);

// Initialize navigation manager
const navigationManager = new NavigationManager();

// Initialize specialized UI managers with clear separation of concerns
// const setupManager = new SetupManager(classManager);
// const companyCreationManager = new CompanyCreationManager(classManager, companyManager);
// const companyOperationsManager = new CompanyOperationsManager(classManager, companyManager);
// const productLaunchManager = new ProductLaunchManager();

classManager.renderClassList();

document.querySelector('#create-class-btn').addEventListener('click', () => classManager.createClass());
document.querySelector('#import-students-btn').addEventListener('click', () => classManager.importStudents());