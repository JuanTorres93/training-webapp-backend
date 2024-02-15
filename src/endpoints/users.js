const express = require('express');

const mw = require('../utils/middleware.js');
const query = require('../db/index').query;
const utils = require('../utils/utils.js');

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

// ===================================
// ========== POST requests ==========
// ===================================
router.post('/', mw.checkKeysInBodyRequest(['alias', 'email', 'password']), (req, res, next) => {
    // TODO express validator and modify query to use user input
    const q = "INSERT INTO users (alias, email, last_name, PASSWORD, second_last_name) " +
              "VALUES ('name', 'name@email.com', 'test', 'unhashed_test_password', 'Smith');";

    return res.status(201).json({
        id: 3,
        alias: "John",
        email: "John.Doe@domain.com",
        last_name: "Doe",
        img: "https://i.pinimg.com/736x/7f/64/3f/7f643f0db514d7971349c416e29e42a8.jpg",
        second_last_name: "Smith",
    });

    query(q, [], (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    })
});

module.exports = router;