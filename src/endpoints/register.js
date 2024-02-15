const express = require('express');
const bodyParser = require('body-parser');

const query = require('../db/index').query;
const mw = require('../utils/middleware');
const hashing = require('../hashing');

const registerRouter = express.Router();
registerRouter.use(bodyParser.json());

registerRouter.post('/', mw.validateCustomerData, mw.checkEmailInUse,
    async (req, res, next) => {
        const { first_name, last_name, second_last_name, email } = req;
        const password = await hashing.plainTextHash(req.password);

        const q = "INSERT INTO customers (first_name, last_name, second_last_name, email, password)" +
                  "VALUES ($1, $2, $3, $4, $5) RETURNING *";
        const params = [first_name, last_name, second_last_name, email, password];

        query(q, params, (error, results) => {
            if (error) throw error;

            res.status(201).send(results.rows[0]);
        });
});

module.exports = registerRouter;
