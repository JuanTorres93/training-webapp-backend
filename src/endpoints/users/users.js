const express = require('express');

const { validateRegisterUserParams, validateUpdateUserParams } = require('../../validators/users.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const dbUsers = require('../../db/users.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================

// TODO add authentication and authorization for customer endpoints

// Get all users
router.get('/', async (req, res, next) => {
    // TODO implement 403 response case

    const users = await dbUsers.selectAllUsers(req.appIsBeingTested);

    res.status(200).send(users);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbUsers.truncateTableTest(req.appIsBeingTested);

    res.status(200).send(truncatedTable);
});

// Get user by id
router.get('/:userId', validateIntegerParameter('userId'), async (req, res, next) => {
    // TODO implement 403 response case
    const { userId } = req.params;

    const user = await dbUsers.selectUserById(userId, req.appIsBeingTested);

    if (user === undefined) {
        return res.status(404).json({
            msg: "User not found",
        });
    }

    res.status(200).json(user);
});

// Get everything from user by id (test db only)
router.get('/:userId/allTest', validateIntegerParameter('userId'), async (req, res, next) => {
    const { userId } = req.params;

    const user = await dbUsers.testDbSelectEverythingFromUserId(userId, req.appIsBeingTested);

    if (user === undefined) {
        return res.status(404).json({
            msg: "User not found",
        });
    }

    res.status(200).json(user);
});


// ===================================
// ========== POST requests ==========
// ===================================
router.post('/', validateRegisterUserParams,
    mw.checkUserEmailAndAliasAlreadyExist,
    mw.hashPassword,
    async (req, res, next) => {
        try {
            const createdUser = await dbUsers.registerNewUser(req.body, req.appIsBeingTested);
            return res.status(201).json(createdUser);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when registering user in db"
            });
        }
});


// ==================================
// ========== PUT requests ==========
// ==================================

// update user by id
router.put('/:userId', 
    validateUpdateUserParams,
    validateIntegerParameter('userId'), 
    mw.checkUserEmailAndAliasAlreadyExist,
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.hashPassword,
    async (req, res, next) => {
        // TODO implement 403 response case
        const { userId } = req.params;
        const { alias, email, password, last_name, second_last_name, img } = req.body;

        const newUserInfo = {
            alias,
            email,
            password,
            last_name,
            second_last_name,
            img,
        };

        const updatedUser = await dbUsers.updateUser(userId, newUserInfo, req.appIsBeingTested);

        if (updatedUser === undefined) {
            return res.status(404).json({
                msg: "User not found",
            });
        }

        res.status(200).json(updatedUser);
    }
);


// =====================================
// ========== DELETE requests ==========
// =====================================

// update user by id
router.delete('/:userId', 
    validateIntegerParameter('userId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases

        const { userId } = req.params;

        const deletedUser = await dbUsers.deleteUser(userId, req.appIsBeingTested);

        if (deletedUser === undefined) {
            return res.status(404).json({
                msg: "User not found",
            });
        }

        res.status(200).json(deletedUser);
    }
);

module.exports = router;
