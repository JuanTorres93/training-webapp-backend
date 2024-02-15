const express = require('express');

const query = require('../db/index').query;
const utils = require('../utils.js');

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// TODO add authentication and authorization for customer endpoints

// Get all customers
router.get('/', (req, res, next) => {
    console.log('Selecting all users');
    // const q = "SELECT * FROM customers;";

    return res.status(200).send(['Hello', 'World']);

    query(q, [], (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    })
});

module.exports = router;