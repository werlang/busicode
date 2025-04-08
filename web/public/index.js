/**
 * BusiCode Application
 * 
 * Main application file that initializes the BusiCode educational activity management system
 */

// Import all necessary classes
import ClassView from './views/class.js';
import CompanyView from './views/company.js';
import ProductView from './views/product.js';
import NavigationView from './views/navigation.js';

// Initialize core manager components
new ClassView().initialize();
new CompanyView().initialize();
new ProductView().initialize();

// Initialize navigation manager
new NavigationView();
