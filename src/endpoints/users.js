const express = require('express');

const { validateRegisterUserParams } = require('../validators/users.js');
const query = require('../db/index').query;
const dbUsers = require('../db/users.js');
const mw = require('../utils/middleware.js');

const router = express.Router();

// TODO uncomment and implement
//router.param('id', (req, res, next, id) => {
//    let intId;
//
//    try {
//        intId = parseInt(id);
//    } catch (error) {
//        console.log(error);
//        res.status(400).send("Invalid id");
//    }
//
//    req.customerId = intId;
//    next();
//});

// ==================================
// ========== GET requests ==========
// ==================================

// TODO add authentication and authorization for customer endpoints

// Get all users
router.get('/', (req, res, next) => {
    // TODO implement 403 response case
    const q = "SELECT * FROM users;";

    query(q, [], (error, results) => {
        if (error) throw error;

        res.json(results.rows)
    }, req.appIsBeingTested)
});

// Get user by id
router.get('/:id', async (req, res, next) => {
    // TODO implement 403 response case
    const { id } = req.params;

    const user = await dbUsers.selectUserById(id, req.appIsBeingTested);

    res.status(200).json(user);
});


// ===================================
// ========== POST requests ==========
// ===================================
router.post('/', validateRegisterUserParams,
    mw.checkUserEmailAndAliasAlreadyExist,
    async (req, res, next) => {
        const { alias, email, password, last_name, second_last_name } = req.body;

        try {
            const createdUser = await dbUsers.registerNewUser(alias, 
                                                              email, 
                                                              password, 
                                                              last_name, 
                                                              second_last_name,
                                                              req.appIsBeingTested);
            return res.status(201).json(createdUser);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when registering user in db"
            });
        }
});

module.exports = router;