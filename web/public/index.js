/**
 * BusiCode Application
 * 
 * Main application file that initializes the BusiCode educational activity management system
 */

// Import all necessary classes
import ClassView from './views/class-view.js';
import CompanyView from './views/company-view.js';
import ProductView from './views/product-view.js';
import NavigationView from './views/navigation-view.js';
import Backup from './helpers/backup.js';

// Initialize core manager components
const classView = new ClassView().initialize();
const companyView = new CompanyView().initialize();
const productView = new ProductView().initialize();

// Initialize backup manager
new Backup({
    classView,
    companyView,
    productView
});

// Initialize navigation manager
new NavigationView();
