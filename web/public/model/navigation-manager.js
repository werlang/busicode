/**
 * Navigation Manager
 * Manages the navigation between sections in the application
 */
import StorageManager from '../helpers/storage-manager.js';

export default class NavigationManager {
    constructor() {
        this.storageManager = new StorageManager('busicode_navigation');
        this.setupNavigation();
        this.restoreLastTab();
    }

    /**
     * Setup the navigation event listeners
     */
    setupNavigation() {
        // Get all navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Add click event listeners to each navigation link
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                // Get the target section ID
                const targetSectionId = link.getAttribute('data-section');
                if (!targetSectionId) return;
                
                // Switch to the selected section
                this.switchToSection(targetSectionId);
                
                // Update active class on navigation
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');
                
                // Save the current tab to local storage
                this.saveCurrentTab(targetSectionId);
            });
        });
    }

    /**
     * Switch to a specific section by ID
     * @param {string} sectionId - The ID of the section to display
     */
    switchToSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.app-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Dispatch event to notify other components
            document.dispatchEvent(new CustomEvent('sectionChanged', {
                detail: { sectionId }
            }));
        }
    }
    
    /**
     * Save the current tab to local storage
     * @param {string} sectionId - The ID of the current section
     */
    saveCurrentTab(sectionId) {
        this.storageManager.saveData({ lastTab: sectionId });
    }
    
    /**
     * Restore the last active tab from local storage
     */
    restoreLastTab() {
        const navData = this.storageManager.loadData();
        if (navData && navData.lastTab) {
            // Find the nav link for the saved section
            const targetLink = document.querySelector(`.nav-link[data-section="${navData.lastTab}"]`);
            if (targetLink) {
                // Get all navigation links
                const navLinks = document.querySelectorAll('.nav-link');
                
                // Update active class on navigation
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                targetLink.classList.add('active');
                
                // Switch to the saved section
                this.switchToSection(navData.lastTab);
            }
        }
    }
}