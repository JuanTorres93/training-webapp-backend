const express = require('express');
const bodyParser = require('body-parser');

const { query, getProductById } = require('../db/index');
const utils = require('../utils.js');

const productsRouter = express.Router();
productsRouter.use(bodyParser.json());

productsRouter.param('id', utils.processIntegerURLParameter('product'));

const validateProductData = (req, res, next) => {
    const neededKeys = ['name', 'price', 'description'];
    const allKeysArePresent = utils.checkKeysInObject(neededKeys, req.body)

    let name, price, description;

    if (allKeysArePresent) {
        name = req.body.name;
        price = req.body.price;
        description = req.body.description;
    } else {
        return res.status(400).send("name, price or description parameter is missing.");
    }

    if (typeof name !== 'string' || typeof description !== "string") {
        return res.status(400).send("name and description must be strings.");
    }


    if (isNaN(price) || typeof price !== 'number') return res.status(400).send("price must be a number");
    
    // Use this values when validating
    req.productPrice = price.toFixed(2);
    req.productName = name;
    req.productDescription = description;

    next();
}

// ==================================
// ========== GET requests ==========
// ==================================

// Get all products
productsRouter.get('/', (req, res, next) => {
    // TODO process to avoid possible failures
    let { category } = "";
    const params = [];

    if (Object.keys(req.query).includes("category")) {
        category = req.query.category.trim();
        params.push(category);
    }

    const categoryFilter = (category) ? "WHERE category = $1" : "";

    const q = "SELECT * FROM products " + categoryFilter + ";";

    query(q, params, (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    })
});

// Get single product
productsRouter.get('/:id', async (req, res, next) => {
    const id = req.productId;
    
    try {
        const product = await getProductById(id);
        res.json(product);
    } catch (error) {
        console.log(`Couldn't find product with id ${id}, reason:`);
        // If error = null then it means that no record in DB was found. It is not
        // an actual error
        console.log(error);
        res.status(404).send(`No product with id ${id}`);
    }
});

// ===================================
// ========== POST requests ==========
// ===================================

// Add new product
productsRouter.post('/', validateProductData, (req, res, next) => {
    const { productName, productPrice, productDescription } = req;

    const q = "INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *";
    const params = [productName, productPrice, productDescription];

    query(q, params, (error, results) => {
        if (error) throw error

        res.status(201).json(results.rows[0]);
    });
});

// ==================================
// ========== PUT requests ==========
// ==================================

// Update existing product
productsRouter.put('/:id', validateProductData, (req, res, next) => {
    const { productId, productName, productPrice, productDescription } = req;

    const q = "UPDATE products SET name = $2, price = $3, description = $4 WHERE id = $1 RETURNING *;";
    const params = [productId, productName, productPrice, productDescription];

    query(q, params, (error, results) => {
        if (error) throw error;

        res.json(results.rows[0]);
    })
});

// =====================================
// ========== DELETE requests ==========
// =====================================

productsRouter.delete('/:id', (req, res, next) => {
    const id = req.productId;

    const q = "DELETE FROM products WHERE id = $1 RETURNING *;";
    const params = [id];

    query(q, params, (error, results) => {
        if (error) throw error;

        res.json({
            msg: `Deleted product with id ${results.rows[0].id}`,
            obj: results.rows[0]
        });
    });
});


module.exports = productsRouter;