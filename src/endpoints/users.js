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
    const q = "SELECT * FROM users;";

    query(q, [], (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    })
});

module.exports = router;