const express = require('express');

const productsRouter = require('./products');
const customersRouter = require('./customers');
const ordersRouter = require('./orders');

const apiRouter = express.Router();

apiRouter.use('/products', productsRouter)
apiRouter.use('/customers', customersRouter)
apiRouter.use('/orders', ordersRouter)

module.exports = apiRouter;