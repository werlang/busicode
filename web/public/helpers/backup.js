export default class Backup {
    
    constructor({ classView, companyView, productView }) {
        this.classView = classView;
        this.companyView = companyView;
        this.productView = productView;
        
        document.querySelector('#backup-btn').addEventListener('click', () => this.createBackup());
        document.querySelector('#restore-backup-btn').addEventListener('click', () => this.restoreBackup());
    }

    createBackup() {
        const backup = {
            busicode_classes: this.classView.classManager.storage.loadData(),
            busicode_companies: this.companyView.companyManager.storage.loadData(),
            busicode_product_launches: this.productView.productManager.storage.loadData(),
        };
        
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'busicode_backup.json';
        a.click();
        
        URL.revokeObjectURL(url);
        Toast.show({ message: 'Backup criado com sucesso!', type: 'success' });
    }

    restoreBackup() {
        const data = document.querySelector('#backup-data').value;
        if (!data) {
            Toast.show({ message: 'Nenhum dado para restaurar!', type: 'error' });
            return;
        }
    
        const backup = JSON.parse(data);
        this.classView.classManager.storage.saveData(backup.busicode_classes);
        this.companyView.companyManager.storage.saveData(backup.busicode_companies);
        this.productView.productManager.storage.saveData(backup.busicode_product_launches);
     
        location.reload();
    }
}