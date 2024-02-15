const express = require('express');
const bodyParser = require('body-parser');

const { getProductById, updateDBOnCheckout } = require('../db/index.js');
const utils = require('../utils.js');

const cartRouter = express.Router();
cartRouter.use(bodyParser.json());

cartRouter.param('id', utils.processIntegerURLParameter('product'));

// Cart is handled in req.session.cart, not sure if it is a good way to implement it.
// Cart is an object whose keys are products ids belonging to the database and their 
// values are the number contained in the cart.

const checkCartExistence = (req, res, next) => {
    const cartInSession = utils.checkKeysInObject(['cart'], req.session);

    if (!cartInSession) {
        req.session.cart = {};
    }

    next();
};

cartRouter.use(utils.authenticatedUser, checkCartExistence);

// ==================================
// ========== GET requests ==========
// ==================================

// Get all items in cart
cartRouter.get('/', (req, res, next) => {
    res.json(req.session.cart);
});

// Get single item in cart
cartRouter.get('/:id', async (req, res, next) => {
    const id = req.productId;

    try {
        // Check if product exists in db
        const product = await getProductById(id);

        if (Object.keys(req.session.cart).includes(String(id))) {
            res.json({
                product,
                quantity: req.session.cart[id],
            });
        } else {
            res.status(404).json({
                msg: `No product with id ${id} in cart.`,
                cart: req.session.cart,
            });
        }
    } catch (error) {
        console.log(`Couldn't find product with id ${id}, reason:`);
        // If error = null then it means that no record in DB was found. It is not
        // an actual error
        console.log(error);
        res.status(404).json({
            msg: `No product with id ${id}`,
            cart: req.session.cart,
        });
    }
});

// ===================================
// ========== POST requests ==========
// ===================================

cartRouter.post('/checkout', async (req, res, next) => {
    // TODO this endpoint must be update for handling REAL payments

    // ***** Validate cart *****
    // Ensure that cart is not empty
    if (Object.keys(req.session.cart).length === 0) {
        return res.status(405).send("Cart is empty");
    }

    // Get the id of every product in the cart, parse to integer for db query
    const productIds = Object.keys(req.session.cart).map(strId => parseInt(strId));

    // Get the information of every product in the cart
    const productsInfo = await Promise.all(productIds.map(id =>{
        return getProductById(id)
    }));

    // Create object whose keyes are product ids and values their unit price
    const productsUnitPrice = Object.fromEntries(
        productsInfo.map(product => {
            return [String(product.id), product.price];
        })
    );
    
    // Compute total price per product
    const totalPrices = Object.fromEntries(
        Object.keys(req.session.cart).map(id => {
            return [id, req.session.cart[id] * productsUnitPrice[id]];
        })
    );

    totalPrices["total"] = Object.values(totalPrices).reduce((cumulative, strValue) => {
        return cumulative + parseFloat(strValue);
    },
    0);
    
    // ***** Ensure payment details submitted are accurate and attempt to process payment *****
    // TODO implement when managing real payment data

    // ***** Create order to reflect the successful payment *****
    const customerId = req.session.passport.user;
    const productsInfoForDBUpdate = Object.keys(req.session.cart).map(strId => {
        return {[parseInt(strId)]: req.session.cart[strId]};
    });

    // Update database
    updateDBOnCheckout(customerId, productsInfoForDBUpdate);

    res.send("Order created");
});

// Add new item to cart and update count
cartRouter.post('/:id', async (req, res, next) => {
    const id = req.productId;

    try {
        // Check if product exists in db
        const product = await getProductById(id);

        if (Object.keys(req.session.cart).includes(String(id))) {
            req.session.cart[id]++;
        } else {
            req.session.cart[id] = 1;
        }

        res.json(req.session.cart);
    } catch (error) {
        console.log(`Couldn't find product with id ${id}, reason:`);
        // If error = null then it means that no record in DB was found. It is not
        // an actual error
        console.log(error);
        res.status(404).json({
            msg: `No product with id ${id}`,
            cart: req.session.cart,
        });
    }
});

// ==================================
// ========== PUT requests ==========
// ==================================

// Update existing item in cart (used for decreasing count)
cartRouter.put('/:id', async (req, res, next) => {
    const id = req.productId;

    try {
        // Check if product exists in db
        const product = await getProductById(id);

        if (Object.keys(req.session.cart).includes(String(id))) {
            if (req.session.cart[id] > 1) {
                req.session.cart[id]--;
            } else {
                delete req.session.cart[id];
            }
        }
        res.json(req.session.cart);
    } catch (error) {
        console.log(`Couldn't find product with id ${id}, reason:`);
        // If error = null then it means that no record in DB was found. It is not
        // an actual error
        console.log(error);
        res.status(404).json({
            msg: `No product with id ${id}`,
            cart: req.session.cart,
        });
    }
});

// =====================================
// ========== DELETE requests ==========
// =====================================

// Delete item in cart regardless of the units
cartRouter.delete('/:id', async (req, res, next) => {
    const id = req.productId;

    try {
        // Check if product exists in db
        const product = await getProductById(id);

        if (Object.keys(req.session.cart).includes(String(id))) {
            delete req.session.cart[id];
        }
        res.json(req.session.cart);
    } catch (error) {
        console.log(`Couldn't find product with id ${id}, reason:`);
        // If error = null then it means that no record in DB was found. It is not
        // an actual error
        console.log(error);
        res.status(404).json({
            msg: `No product with id ${id}`,
            cart: req.session.cart,
        });
    }
});


module.exports = cartRouter;