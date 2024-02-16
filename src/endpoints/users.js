const express = require('express');

const { validateRegisterUserParams } = require('../validators/users.js');
const query = require('../db/index').query;
const dbUsers = require('../db/users.js');
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
router.post('/', validateRegisterUserParams, 
    async (req, res, next) => {
        const { alias, email, password, last_name, second_last_name } = req.body;

        // TODO DRY this code
        let isEmailAlreadyInUse;
        try {
            isEmailAlreadyInUse = await dbUsers.checkEmailInUse(email);
        } catch (error) {
            isEmailAlreadyInUse = false;
        }

        if (isEmailAlreadyInUse) {
            return res.status(409).json({
                msg: 'Email already in use',
            });
        }

        let isAliasAlreadyInUse;
        try {
            isAliasAlreadyInUse = await dbUsers.checkAliasInUse(alias);
        } catch (error) {
            isAliasAlreadyInUse = false;
        }

        if (isAliasAlreadyInUse) {
            return res.status(409).json({
                msg: 'Alias already in use',
            });
        }

        // TODO MOVE THIS CODE TO ITS FILE IN DB
        // Build query
        let requiredFields = ['alias', 'email', 'password'];
        let requiredValues = [alias, email, password];

        let optionalFields = ['last_name', 'second_last_name'];
        let optionalValues = [last_name, second_last_name];

        const {fields, values, params} = utils.buildFieldsAndValuesSQLQuery(requiredFields, requiredValues, optionalFields, optionalValues);

        const q = `INSERT INTO users ${fields} ` +
                  `VALUES ${values} ` + 
                  'RETURNING id, alias, email, last_name, img, second_last_name;';
        
        // TODO DELETE
        console.log(q);
        console.log(params);

        query(q, params, (error, results) => {
            if (error) throw error;

            const createdUser = results.rows[0];
            console.log(createdUser);
            const newUser = {
                id: createdUser[0],
                alias: createdUser[1],
                email: createdUser[2],
                last_name: createdUser[3],
                img: createdUser[4],
                second_last_name: createdUser[5],
            };
            res.status(201).json(newUser)

            //return res.status(201).json({
            //    id: 3,
            //    alias: "John",
            //    email: "John.Doe@domain.com",
            //    last_name: "Doe",
            //    img: "https://i.pinimg.com/736x/7f/64/3f/7f643f0db514d7971349c416e29e42a8.jpg",
            //    second_last_name: "Smith",
            //});
        })
});

module.exports = router;