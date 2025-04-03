/**
 * BusiCode Application
 * 
 * Main application file that initializes the BusiCode educational activity management system
 */

// Import all necessary classes
import ClassManager from './model/class-manager.js';
import CompanyManager from './model/company-manager.js';
import SetupManager from './model/setup-manager.js';
import CompanyCreationManager from './model/company-creation-manager.js';
import CompanyOperationsManager from './model/company-operations-manager.js';
import NavigationManager from './model/navigation-manager.js';

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core manager components
    const classManager = new ClassManager();
    const companyManager = new CompanyManager(classManager);
    
    // Initialize navigation manager
    const navigationManager = new NavigationManager();
    
    // Initialize specialized UI managers with clear separation of concerns
    const setupManager = new SetupManager(classManager);
    const companyCreationManager = new CompanyCreationManager(classManager, companyManager);
    const companyOperationsManager = new CompanyOperationsManager(classManager, companyManager);
    
    // Adiciona listener para atualizar a interface quando há troca de seção
    document.addEventListener('sectionChanged', (event) => {
        const { sectionId } = event.detail;
        
        // Atualizar os componentes relevantes quando necessário
        if (sectionId === 'company-operations-section') {
            // Ao navegar para a seção de operações, atualizar a lista de empresas
            companyOperationsManager.renderCompanyList();
        }
    });
    
    console.log('BusiCode application initialized with modular structure and navigation');
});