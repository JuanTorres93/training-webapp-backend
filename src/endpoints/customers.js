const express = require('express');
const bodyParser = require('body-parser');

const query = require('../db/index').query;
const utils = require('../utils.js');

const customersRouter = express.Router();
customersRouter.use(bodyParser.json());

customersRouter.param('id', (req, res, next, id) => {
    let intId;

    try {
        intId = parseInt(id);
    } catch (error) {
        console.log(error);
        res.status(400).send("Invalid id");
    }

    req.customerId = intId;
    next();
});

// ==================================
// ========== GET requests ==========
// ==================================

// TODO add authentication and authorization for customer endpoints

// Get all customers
customersRouter.get('/', (req, res, next) => {
    const q = "SELECT * FROM customers;";

    query(q, [], (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    }, req.appIsBeingTested)
});

// Get single customer
customersRouter.get('/:id', (req, res, next) => {
    const id = req.customerId;
    const q = "SELECT * FROM customers WHERE id = $1";
    const params = [id];

    query(q, params, (error, results) => {
        if (error) throw error;
        
        if (results.rows.length > 0) {
            res.json(results.rows[0]);
        } else {
            res.status(404).send(`No customer with id ${id}`);
        }
    }, req.appIsBeingTested);
});

// ===================================
// ========== POST requests ==========
// ===================================

// Add new customer functionality is set up in the register endpoint

// ==================================
// ========== PUT requests ==========
// ==================================

// Update existing customer
customersRouter.put('/:id', utils.validateCustomerData, (req, res, next) => {
    const { customerId, first_name, last_name, second_last_name, email, password } = req;

    const q = "UPDATE customers SET first_name = $2, last_name = $3, second_last_name = $4, " +
              "email = $5, password = $6 WHERE id = $1 RETURNING *;";
    const params = [customerId, first_name, last_name, second_last_name, email, password];

    query(q, params, (error, results) => {
        if (error) throw error;

        res.json(
            {
                first_name: results.rows[0].first_name,
                last_name: results.rows[0].last_name,
                second_last_name: results.rows[0].second_last_name,
                email: results.rows[0].email,
            }
        );
    }, req.appIsBeingTested)
});

// =====================================
// ========== DELETE requests ==========
// =====================================

customersRouter.delete('/:id', (req, res, next) => {
    const id = req.customerId;

    const q = "DELETE FROM customers WHERE id = $1 RETURNING *;";
    const params = [id];

    query(q, params, (error, results) => {
        if (error) throw error;

        res.json({
            msg: `Deleted customer with id ${results.rows[0].id}`,
        });
    }, req.appIsBeingTested);
});


module.exports = customersRouter;
