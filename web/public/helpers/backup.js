import Request from './request.js';
import Toast from '../components/toast.js';

export default class Backup {
    
    constructor({ classView, companyView, productView }) {
        this.request = new Request({
            url: 'http://localhost:3000',
        });
        this.classView = classView;
        this.companyView = companyView;
        this.productView = productView;
        
        document.querySelector('#backup-btn').addEventListener('click', () => this.createBackup());
        document.querySelector('#restore-backup-btn').addEventListener('click', () => this.restoreBackup());
    }

    async createBackup() {
        try {
            // Fetch all data from the API
            const [classes, companies, products] = await Promise.all([
                this.request.get('classes'),
                this.request.get('companies'),
                this.request.get('products')
            ]);
            
            // For each class, also fetch its detailed information including students
            const classesWithDetails = await Promise.all(
                classes.map(async (classObj) => {
                    const fullClass = await this.request.get(`/classes/${classObj.id}?include_details=true`);
                    return fullClass;
                })
            );
            
            // For each company, fetch detailed information 
            const companiesWithDetails = await Promise.all(
                companies.map(async (company) => {
                    const fullCompany = await this.request.get(`/companies/${company.id}?include_details=true`);
                    return fullCompany;
                })
            );
            
            const backup = {
                version: "2.0", // API version
                timestamp: new Date().toISOString(),
                classes: classesWithDetails,
                companies: companiesWithDetails,
                products: products
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `busicode_backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            Toast.show({ message: 'Backup criado com sucesso!', type: 'success' });
        } catch (error) {
            console.error('Error creating backup:', error);
            Toast.show({ message: 'Erro ao criar backup: ' + (error.message || 'Erro desconhecido'), type: 'error' });
        }
    }

    async restoreBackup() {
        const data = document.querySelector('#backup-data').value;
        if (!data) {
            Toast.show({ message: 'Nenhum dado para restaurar!', type: 'error' });
            return;
        }
    
        try {
            const backup = JSON.parse(data);
            
            // Check if it's a new format backup (API-based) or old format (localStorage)
            if (backup.version && backup.version === "2.0") {
                // New API-based backup format
                await this.restoreApiBackup(backup);
            } else {
                // Legacy localStorage backup format
                await this.restoreLegacyBackup(backup);
            }
            
            Toast.show({ message: 'Backup restaurado com sucesso! Recarregando página...', type: 'success' });
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            console.error('Error restoring backup:', error);
            Toast.show({ message: 'Erro ao restaurar backup: ' + (error.message || 'Dados inválidos'), type: 'error' });
        }
    }
    
    async restoreApiBackup(backup) {
        // First, clear existing data (optional - you might want to ask for confirmation)
        // Note: This is a dangerous operation and should be handled carefully in production
        
        // Restore classes first
        if (backup.classes) {
            for (const classData of backup.classes) {
                try {
                    const createdClass = await this.request.post('classes', {
                        name: classData.name
                    });
                    
                    // Restore students for this class
                    if (classData.students) {
                        for (const student of classData.students) {
                            await this.request.post('students', {
                                name: student.name,
                                initial_balance: student.initial_balance || student.initialBalance,
                                current_balance: student.current_balance || student.currentBalance,
                                class_id: createdClass.id
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error restoring class:', classData.name, error);
                }
            }
        }
        
        // Restore companies
        if (backup.companies) {
            for (const companyData of backup.companies) {
                try {
                    await this.request.post('/companies', {
                        name: companyData.name,
                        class_id: companyData.class_id || companyData.classId,
                        student_ids: companyData.member_ids || companyData.memberIds || [],
                        member_contributions: companyData.member_contributions || companyData.memberContributions || {}
                    });
                } catch (error) {
                    console.error('Error restoring company:', companyData.name, error);
                }
            }
        }
        
        // Restore products
        if (backup.products) {
            for (const productData of backup.products) {
                try {
                    await this.request.post('/products', {
                        name: productData.name,
                        price: productData.price,
                        company_id: productData.company_id || productData.companyId
                    });
                } catch (error) {
                    console.error('Error restoring product:', productData.name, error);
                }
            }
        }
    }
    
    async restoreLegacyBackup(backup) {
        // Handle old localStorage format
        // This is more complex as we need to convert the old format to API calls
        
        // Convert old classes format
        if (backup.busicode_classes) {
            for (const [classId, classData] of Object.entries(backup.busicode_classes)) {
                try {
                    const createdClass = await this.request.post('/classes', {
                        name: classData.name
                    });
                    
                    // Restore students
                    if (classData.students) {
                        for (const student of classData.students) {
                            await this.request.post('/students', {
                                name: student.name,
                                initial_balance: student.initialBalance,
                                current_balance: student.currentBalance,
                                class_id: createdClass.id
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error restoring legacy class:', error);
                }
            }
        }
        
        // Convert old companies format
        if (backup.busicode_companies) {
            for (const [companyId, companyData] of Object.entries(backup.busicode_companies)) {
                try {
                    await this.request.post('/companies', {
                        name: companyData.name,
                        class_id: companyData.classId,
                        student_ids: companyData.memberIds || [],
                        member_contributions: companyData.memberContributions || {}
                    });
                } catch (error) {
                    console.error('Error restoring legacy company:', error);
                }
            }
        }
        
        // Convert old products format
        if (backup.busicode_product_launches) {
            for (const productData of backup.busicode_product_launches) {
                try {
                    await this.request.post('/products', {
                        name: productData.name,
                        price: productData.price,
                        company_id: productData.companyId
                    });
                } catch (error) {
                    console.error('Error restoring legacy product:', error);
                }
            }
        }
    }
}