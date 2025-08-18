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
            const [{classes}, {companies}, {products}] = await Promise.all([
                this.request.get('classes'),
                this.request.get('companies'),
                this.request.get('products')
            ]);
            
            // For each class, also fetch its detailed information including students
            const classesWithDetails = await Promise.all(
                classes.map(async (classObj) => {
                    const fullClass = await this.request.get(`classes/${classObj.id}`, { include_details: true });
                    return fullClass.class;
                })
            );
            
            // For each company, fetch detailed information including expenses and revenues
            const companiesWithDetails = await Promise.all(
                companies.map(async (company) => {
                    const [fullCompanyData, expensesData, revenuesData] = await Promise.all([
                        this.request.get(`companies/${company.id}`, { include_details: true }),
                        this.request.get(`companies/${company.id}/expenses`),
                        this.request.get(`companies/${company.id}/revenues`)
                    ]);
                    
                    return {
                        ...fullCompanyData.company,
                        expenses: expensesData.expenses || [],
                        revenues: revenuesData.revenues || []
                    };
                })
            );
            
            // For each product, fetch detailed information including sales history
            const productsWithDetails = await Promise.all(
                products.map(async (product) => {
                    const salesData = await this.request.get(`products/${product.id}/sales`);
                    return {
                        ...product,
                        sales: salesData.sales || []
                    };
                })
            );
            
            const backup = {
                version: "2.1", // Updated version to include expenses, revenues, and sales
                timestamp: new Date().toISOString(),
                classes: classesWithDetails,
                companies: companiesWithDetails,
                products: productsWithDetails
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
            
            // Validate backup format
            if (!backup.version || !['2.0', '2.1'].includes(backup.version)) {
                throw new Error('Formato de backup não suportado. Apenas versões 2.0 e 2.1 são aceitas.');
            }
            
            // Validate required fields
            if (!backup.classes || !backup.companies || !backup.products) {
                throw new Error('Arquivo de backup inválido: campos obrigatórios ausentes.');
            }
            
            // Show confirmation dialog
            if (!confirm('Isso irá substituir todos os dados existentes. Tem certeza que deseja continuar?')) {
                return;
            }
            
            Toast.show({ message: 'Iniciando restauração do backup...', type: 'info' });
            await this.restoreApiBackup(backup);
            
            Toast.show({ message: 'Backup restaurado com sucesso! Recarregando página...', type: 'success' });
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            console.error('Error restoring backup:', error);
            Toast.show({ message: 'Erro ao restaurar backup: ' + (error.message || 'Dados inválidos'), type: 'error' });
        }
    }
    
    async restoreApiBackup(backup) {
        console.log('Starting backup restoration...');
        
        // Store mappings for ID references
        const classIdMap = new Map(); // old ID -> new ID
        const studentIdMap = new Map(); // old ID -> new ID
        const companyIdMap = new Map(); // old ID -> new ID
        const productIdMap = new Map(); // old ID -> new ID
        
        // Restore classes first
        console.log(`Restoring ${backup.classes?.length || 0} classes...`);
        if (backup.classes && backup.classes.length > 0) {
            for (const classData of backup.classes) {
                try {
                    console.log(`Creating class: ${classData.name}`);
                    const response = await this.request.post('classes', {
                        name: classData.name
                    });
                    const createdClass = response.class || response;
                    classIdMap.set(classData.id, createdClass.id);
                    
                    // Restore students for this class
                    if (classData.students && classData.students.length > 0) {
                        console.log(`Creating ${classData.students.length} students for class ${classData.name}`);
                        for (const student of classData.students) {
                            const studentResponse = await this.request.post('students', {
                                name: student.name,
                                initialBalance: student.initialBalance || 0,
                                currentBalance: student.currentBalance || student.initialBalance || 0,
                                classId: createdClass.id
                            });
                            const createdStudent = studentResponse.student || studentResponse;
                            studentIdMap.set(student.id, createdStudent.id);
                        }
                    }
                } catch (error) {
                    console.error('Error restoring class:', classData.name, error);
                    throw new Error(`Falha ao restaurar classe '${classData.name}': ${error.message}`);
                }
            }
        }
        
        // Restore companies with their members
        console.log(`Restoring ${backup.companies?.length || 0} companies...`);
        if (backup.companies && backup.companies.length > 0) {
            for (const companyData of backup.companies) {
                try {
                    console.log(`Creating company: ${companyData.name}`);
                    
                    // Map member IDs to new IDs
                    const memberIds = (companyData.members || []).map(member => studentIdMap.get(member.id)).filter(Boolean);
                    const memberContributions = {};
                    
                    (companyData.members || []).forEach(member => {
                        const newStudentId = studentIdMap.get(member.id);
                        if (newStudentId && member.contribution !== undefined) {
                            memberContributions[newStudentId] = member.contribution;
                        }
                    });
                    
                    const newClassId = classIdMap.get(companyData.classId);
                    if (!newClassId) {
                        throw new Error(`Class ID not found for company ${companyData.name}`);
                    }
                    
                    const companyResponse = await this.request.post('companies', {
                        name: companyData.name,
                        classId: newClassId,
                        memberIds: memberIds,
                        memberContributions: memberContributions
                    });
                    const createdCompany = companyResponse.company || companyResponse;
                    companyIdMap.set(companyData.id, createdCompany.id);
                    
                    // Restore company expenses
                    if (companyData.expenses && companyData.expenses.length > 0) {
                        console.log(`Creating ${companyData.expenses.length} expenses for company ${companyData.name}`);
                        for (const expense of companyData.expenses) {
                            try {
                                await this.request.post(`companies/${createdCompany.id}/expenses`, {
                                    description: expense.description,
                                    amount: expense.amount
                                });
                            } catch (error) {
                                console.error('Error restoring expense:', expense.description, error);
                            }
                        }
                    }
                    
                    // Restore company revenues
                    if (companyData.revenues && companyData.revenues.length > 0) {
                        console.log(`Creating ${companyData.revenues.length} revenues for company ${companyData.name}`);
                        for (const revenue of companyData.revenues) {
                            try {
                                await this.request.post(`companies/${createdCompany.id}/revenues`, {
                                    description: revenue.description,
                                    amount: revenue.amount
                                });
                            } catch (error) {
                                console.error('Error restoring revenue:', revenue.description, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error restoring company:', companyData.name, error);
                    throw new Error(`Falha ao restaurar empresa '${companyData.name}': ${error.message}`);
                }
            }
        }
        
        // Restore products with their sales
        console.log(`Restoring ${backup.products?.length || 0} products...`);
        if (backup.products && backup.products.length > 0) {
            for (const productData of backup.products) {
                try {
                    console.log(`Creating product: ${productData.name}`);
                    
                    const newCompanyId = companyIdMap.get(productData.companyId);
                    if (!newCompanyId) {
                        throw new Error(`Company ID not found for product ${productData.name}`);
                    }
                    
                    const productResponse = await this.request.post('products', {
                        name: productData.name,
                        price: productData.price,
                        companyId: newCompanyId
                    });
                    const createdProduct = productResponse.product || productResponse;
                    productIdMap.set(productData.id, createdProduct.id);
                    
                    // Restore product sales
                    if (productData.sales && productData.sales.length > 0) {
                        console.log(`Creating ${productData.sales.length} sales for product ${productData.name}`);
                        for (const sale of productData.sales) {
                            try {
                                await this.request.post(`products/${createdProduct.id}/sales`, {
                                    quantity: sale.quantity,
                                    unitPrice: sale.unit_price || sale.unitPrice || productData.price
                                });
                            } catch (error) {
                                console.error('Error restoring sale for product:', productData.name, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error restoring product:', productData.name, error);
                    throw new Error(`Falha ao restaurar produto '${productData.name}': ${error.message}`);
                }
            }
        }
        
        console.log('Backup restoration completed successfully!');
    }
}