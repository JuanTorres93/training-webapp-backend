const express = require('express');

const { validateRegisterUserParams, validateUpdateUserParams } = require('../../validators/users.js');
const { validateUUIDParameter } = require('../../validators/generalPurpose.js');
const dbUsers = require('../../db/users.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================


// Get all users
router.get('/', async (req, res, next) => {
    const users = await dbUsers.selectAllUsers();

    res.status(200).send(users);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbUsers.truncateTableTest();

    res.status(200).send(truncatedTable);
});

// Get user by id
router.get('/:userId',
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;

        const user = await dbUsers.selectUserById(userId);

        if (user === undefined) {
            return res.status(404).json({
                msg: "User not found",
            });
        }

        res.status(200).json(user);
    });

// Get everything from user by id (test db only)
router.get('/:userId/allTest',
    validateUUIDParameter('userId'),
    async (req, res, next) => {
        const { userId } = req.params;

        const user = await dbUsers.testDbSelectEverythingFromUserId(userId);

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

// Register new user
// DOC: Register user
router.post('/',
    validateRegisterUserParams,
    mw.checkUserEmailAndAliasAlreadyExist,
    mw.hashPassword,
    async (req, res, next) => {
        try {
            const createdUser = await dbUsers.registerNewUser(req.body);
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
    validateUUIDParameter('userId'),
    mw.checkUserEmailAndAliasAlreadyExist,
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.hashPassword,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
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

        const updatedUser = await dbUsers.updateUser(userId, newUserInfo);

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
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;

        const deletedUser = await dbUsers.deleteUser(userId);

        res.status(200).json(deletedUser);
    }
);

module.exports = router;
