const express = require('express');
const bodyParser = require('body-parser');

const { getAllOrdersForUserId, getOrderByIdForUserId } = require('../db/index.js');
const utils = require('../utils.js');

const ordersRouter = express.Router();
ordersRouter.use(bodyParser.json());

ordersRouter.use(utils.authenticatedUser);

ordersRouter.param('id', utils.processIntegerURLParameter('order'))

// ==================================
// ========== GET requests ==========
// ==================================

// Get all orders for user
ordersRouter.get('/', async (req, res, next) => {
    const customerId = req.session.passport.user;

    const allOrdersFromUser = await getAllOrdersForUserId(customerId);

    const ordersGroupedByOrderId = {};

    allOrdersFromUser.forEach(order => {
        if (!utils.checkKeysInObject([String(order.order_id)], ordersGroupedByOrderId)) {
            ordersGroupedByOrderId[order.order_id] = [];
        };

        ordersGroupedByOrderId[order.order_id].push({
            name: order['name'],
            product_quantity: order['product_quantity'],
            unit_price: order['unit_price'],
            total_items_price: order['total_item_price'],
        });
    });

    res.send(ordersGroupedByOrderId);
});

// Get single orders for user
ordersRouter.get('/:id', async (req, res, next) => {
    const customerId = req.session.passport.user;
    const orderId = req.orderId;

    let order;

    try {
        order = await getOrderByIdForUserId(customerId, orderId);
    } catch (error) {
        return res.status(401).send("Resource not accessible.");
    }

    const products = {};

    order.forEach(ord => {
        if (!utils.checkKeysInObject([String(ord.order_id)], products)) {
            products[ord.order_id] = [];
        };

        products[ord.order_id].push({
            name: ord['name'],
            product_quantity: ord['product_quantity'],
            unit_price: ord['unit_price'],
            total_items_price: ord['total_item_price'],
        });
    });
    res.send(products);

});

module.exports = ordersRouter;