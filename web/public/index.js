/**
 * BusiCode Application
 * 
 * Main application file that initializes the BusiCode educational activity management system
 */

// Import all necessary classes
import ClassManager from './helpers/class-manager.js';
import CompanyManager from './helpers/company-manager.js';
import ProductManager from './helpers/product-manager.js';
import NavigationManager from './components/navigation-manager.js';

// Initialize core manager components
new ClassManager().initialize();
new CompanyManager().initialize();
new ProductManager().initialize();

// Initialize navigation manager
new NavigationManager();
