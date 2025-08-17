import { Router } from 'express';
import Product from '../model/product.js';
import Company from '../model/company.js';
import CustomError from '../helpers/error.js';

const router = Router();

// Get all products
router.get('/', async (req, res, next) => {
    try {
        const { company_id, class_id, include_details } = req.query;
        let products;
        
        if (company_id) {
            products = await Product.getByCompany(company_id);
        } else if (class_id) {
            products = await Product.getByClass(class_id);
        } else {
            products = await Product.getAll();
        }
        
        const formattedProducts = [];
        
        for (const productData of products) {
            const product = new Product(productData);
            
            if (include_details === 'true') {
                const details = await product.toJSONWithDetails();
                formattedProducts.push(details);
            } else {
                formattedProducts.push(product.toJSON());
            }
        }
        
        res.send({ products: formattedProducts });
    } catch (error) {
        next(error);
    }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { include_details } = req.query;
        const product = await new Product({ id: req.params.id }).get();
        
        let result;
        if (include_details === 'true') {
            result = await product.toJSONWithDetails();
        } else {
            result = product.toJSON();
        }
        
        res.send({ product: result });
    } catch (error) {
        next(error);
    }
});

// Launch new product
router.post('/', async (req, res, next) => {
    try {
        const { name, price, companyId } = req.body;
        
        if (!name) {
            throw new CustomError(400, 'Product name is required');
        }
        
        if (!price || isNaN(price) || parseFloat(price) <= 0) {
            throw new CustomError(400, 'Valid product price is required');
        }
        
        if (!companyId) {
            throw new CustomError(400, 'Company ID is required');
        }
        
        // Verify company exists
        await new Company({ id: companyId }).get();
        
        const product = new Product({
            name,
            price: parseFloat(price),
            company_id: companyId,
            sales_count: 0,
            total_revenue: 0
        });

        await product.insert();
        
        const result = await product.toJSONWithDetails();
        
        res.status(201).send({
            message: 'Product launched successfully',
            product: result
        });
    } catch (error) {
        next(error);
    }
});

// Update product
router.put('/:id', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        const { name, price } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) {
            if (isNaN(price) || parseFloat(price) <= 0) {
                throw new CustomError(400, 'Product price must be positive');
            }
            updateData.price = parseFloat(price);
        }
        
        if (Object.keys(updateData).length === 0) {
            throw new CustomError(400, 'No valid fields to update');
        }
        
        await product.update(updateData);
        
        res.send({
            message: 'Product updated successfully',
            product: product.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Record product sale
router.post('/:id/sales', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        const { quantity, unitPrice } = req.body;
        
        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
            throw new CustomError(400, 'Valid quantity is required');
        }
        
        let salePrice = unitPrice;
        if (unitPrice !== undefined) {
            if (isNaN(unitPrice) || parseFloat(unitPrice) <= 0) {
                throw new CustomError(400, 'Unit price must be positive if provided');
            }
            salePrice = parseFloat(unitPrice);
        }
        
        const saleResult = await product.recordSale(parseInt(quantity), salePrice);
        
        res.status(201).send({
            message: 'Sale recorded successfully',
            ...saleResult
        });
    } catch (error) {
        next(error);
    }
});

// Get product sales
router.get('/:id/sales', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        const sales = await product.getSales();
        
        res.send({ 
            product: product.toJSON(),
            sales 
        });
    } catch (error) {
        next(error);
    }
});

// Get product sales statistics
router.get('/:id/sales/stats', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        const stats = await product.getSalesStats();
        
        res.send({ 
            product: product.toJSON(),
            salesStats: stats 
        });
    } catch (error) {
        next(error);
    }
});

// Update product price
router.put('/:id/price', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        const { price } = req.body;
        
        if (!price || isNaN(price)) {
            throw new CustomError(400, 'Valid price is required');
        }
        
        await product.updatePrice(price);
        
        res.send({
            message: 'Product price updated successfully',
            product: product.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
    try {
        const product = await new Product({ id: req.params.id }).get();
        
        // Check if product has sales
        const sales = await product.getSales();
        if (sales.length > 0) {
            throw new CustomError(409, 'Cannot delete product with sales records');
        }
        
        await product.delete();
        
        res.send({ 
            message: 'Product deleted successfully',
            product: product.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
