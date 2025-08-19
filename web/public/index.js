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
import AuthView from './views/auth-view.js';

// Main initialization function
async function initializeApp() {
    // Initialize authentication first and wait for it to complete
    const authView = new AuthView();
    await authView.initialize();
    
    // Make auth manager globally available for managers
    window.authManager = authView.authManager;
    
    // Initialize core manager components after auth is ready
    // Pass the current auth state to ensure proper initial rendering
    const isAuthenticated = authView.authManager.isLoggedIn();
    
    const classView = await new ClassView(isAuthenticated).initialize();
    const companyView = await new CompanyView(isAuthenticated).initialize();
    const productView = await new ProductView(isAuthenticated).initialize();
    
    // Initialize navigation manager
    new NavigationView();
    
    // Force a read-only mode update to sync all views
    authView.updateReadOnlyMode();
}

// Start the application
initializeApp().catch(error => {
    console.error('Failed to initialize application:', error);
});
