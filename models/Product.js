const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    mostRecentPrice: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    fullSpecs: {
        type: DataTypes.TEXT,
    },
    screenSize: {
        type: DataTypes.STRING
    },
    chip: {
        type: DataTypes.STRING
    },
    memory: {
        type: DataTypes.INTEGER
    },
    storage: {
        type: DataTypes.INTEGER
    },
    color: {
        type: DataTypes.STRING
    },
    url: {
        type: DataTypes.STRING
    }
});

Product.associate = function (models) {
    // Define the one-to-many relationship (Product has many Prices)
    Product.hasMany(models.Price, {
        as: "prices",  // Alias here
        foreignKey: 'sku',  // Ensure the foreign key is 'sku'
    });
};


module.exports = Product;
