const dotenv = require('dotenv').config()
const express = require("express");
const sequelize = require("./config/database");
const { Product, Price } = require('./models');

const Scraper = require('./scraper');
const {Sequelize, Op} = require("sequelize");
const path = require("node:path");
const Sc = new Scraper();

const app = express();
const port = 3000;

app.use(express.static(__dirname + '/dist'))

app.get('/', (req, res) => {
    res.sendFile(path.join( __dirname, 'dist', 'index.html' ));
})

app.get('/api/capture/:token', async (req, res) => {
    if(req.params.token !== process.env.token){
        return res.status(403).send('Forbidden: Invalid token');
    }
    const productCount = await captureProductsAndPrices();
    res.send(`Successfully captured ${productCount} products!`)
})

sequelize.sync().then(() => {
    app.listen(3000, async () => {
        console.log(`Server is listening on port ${port}.`)
    });
})

async function captureProductsAndPrices() {
    const products = await Sc.scrape();
    const prices = products.map(product => ({
        sku: product.sku,
        price: product.mostRecentPrice,
        priceCurrency: product.priceCurrency,
        date: new Date()
    }));
    try {
        await Product.update( { isAvailable: false }, { where: { isAvailable: true } } );
        for (const product of products) {
            await Product.upsert(product);
        }
        await Price.bulkCreate(prices);
        console.log('Tables populated');
    } catch (error) {
        console.error('Error populating tables:', error);
    }
    return products.length;
}

app.get('/api/filterOptions', async (req, res) => {
    const filterData = {}
    filterData.macOptions = (await Product.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type']
        ]
    })).map(result => result.type)
    filterData.chipOptions = (await Product.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('chip')), 'chip']
        ]
    })).map(result => result.chip).filter(result => result)
    filterData.memoryOptions = (await Product.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('memory')), 'memory']
        ]
    })).map(result => result.memory).filter(result => result)
    filterData.storageOptions = (await Product.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('storage')), 'storage']
        ]
    })).map(result => result.storage).filter(result => result)
    res.send(filterData)
})

app.get('/api/products', async (req, res) => {
    try {
        // Fetch all products and associated prices in one go (using include)
        let products = await Product.findAll({
            include: {
                model: Price,
                as: 'prices',
                where: {
                    date: { [Op.ne]: null }
                },
                order: [['date', 'DESC']],
            },
        });

        res.send(products);
    } catch (error) {
        console.error('Error fetching products and prices:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});



// async function clearTable() {
//     try {
//         await Product.destroy({ where: {}, truncate: true });
//         console.log('Table cleared');
//     } catch (error) {
//         console.error('Error clearing table:', error);
//     }
// }
//
// app.get('/about', (req, res) => {
//     logger.logInfo("visit", "/about")
//     res.render('about')
// })
//
// app.get('/api/logs/:token', async (req, res) => {
//     if(req.params.token !== process.env.token){
//         return res.status(403).send('Forbidden: Invalid token');
//     }
//     const logs = await logger.getLogs()
//     res.send(logs)
// })
