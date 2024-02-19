const express = require('express');

const { validateRegisterUserParams } = require('../validators/users.js');
const query = require('../db/index').query;
const dbUsers = require('../db/users.js');
const mw = require('../utils/middleware.js');

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
router.post('/', validateRegisterUserParams,
    mw.checkUserEmailAndAliasAlreadyExist,
    async (req, res, next) => {
        const { alias, email, password, last_name, second_last_name } = req.body;

        try {
            const createdUser = await dbUsers.registerNewUser(alias, email, password, last_name, second_last_name);
            return res.status(201).json(createdUser);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when registering user in db"
            });
        }
});

module.exports = router;