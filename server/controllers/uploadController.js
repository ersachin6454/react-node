const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../models/Product');

// Upload multiple images
const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const urls = req.files.map(file => {
            // Return the URL path for the uploaded file
            return `/uploads/images/${file.filename}`;
        });

        res.json({ urls });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
};

// Bulk upload products from CSV
const bulkUploadProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const filePath = req.file.path;
        const products = [];
        const errors = [];

        // Read and parse CSV file
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        // Validate required fields
                        if (!row.name || !row.price || !row.sell_price) {
                            errors.push({ row, error: 'Missing required fields (name, price, sell_price)' });
                            return;
                        }

                        products.push({
                            name: row.name.trim(),
                            price: parseFloat(row.price),
                            sell_price: parseFloat(row.sell_price),
                            description: row.description ? row.description.trim() : '',
                            quantity: parseInt(row.quantity) || 0,
                            specifications: row.specifications ? row.specifications.trim() : null,
                            images: row.images ? row.images.split(',').map(img => img.trim()).filter(img => img) : []
                        });
                    } catch (error) {
                        errors.push({ row, error: error.message });
                    }
                })
                .on('end', async () => {
                    try {
                        // Delete the uploaded file
                        fs.unlinkSync(filePath);

                        // Insert products into database
                        const product = new Product();
                        let successCount = 0;
                        const failedProducts = [];

                        for (const productData of products) {
                            try {
                                await product.create(productData);
                                successCount++;
                            } catch (error) {
                                console.error('Error creating product:', error);
                                failedProducts.push({ product: productData.name, error: error.message });
                            }
                        }

                        res.json({
                            success: true,
                            count: successCount,
                            total: products.length,
                            errors: errors.length > 0 ? errors : undefined,
                            failedProducts: failedProducts.length > 0 ? failedProducts : undefined
                        });
                        resolve();
                    } catch (error) {
                        console.error('Error processing products:', error);
                        res.status(500).json({ error: 'Failed to process products' });
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    fs.unlinkSync(filePath);
                    console.error('Error reading CSV:', error);
                    res.status(500).json({ error: 'Failed to read CSV file' });
                    reject(error);
                });
        });
    } catch (error) {
        console.error('Error in bulk upload:', error);
        res.status(500).json({ error: 'Failed to upload products' });
    }
};

module.exports = {
    uploadImages,
    bulkUploadProducts
};

