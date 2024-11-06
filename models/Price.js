const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Price = sequelize.define('Price', {
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    priceCurrency: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

Price.associate = function (models) {
    // Define the reverse association (Price belongs to Product)
    Price.belongsTo(models.Product, {
        foreignKey: 'sku',
        targetKey: 'sku',  // Ensure 'sku' is the foreign key
    });
};

module.exports = Price;
