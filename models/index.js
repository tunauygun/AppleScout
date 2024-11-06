const Product = require('./Product');
const Price = require('./Price');

const models = { Product, Price };

// Set up associations
Product.associate(models);
Price.associate(models);

module.exports = models;
