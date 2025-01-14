const express = require('express');

const { validateUUIDParameter } = require('../../validators/generalPurpose.js');
const { validateRegisterWeightParams } = require('../../validators/weights.js');
const dbWeights = require('../../db/weights.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================


// Get all weights for a user
router.get('/:userId',
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;
        const user = await dbWeights.selectAllWeightsForUser(userId);

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

router.post('/:userId',
    validateRegisterWeightParams,
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;

        try {
            const weightExists = await dbWeights.weightExists(userId, req.body.date);

            if (weightExists) {
                return res.status(409).json({
                    msg: "Weight already exists for that date"
                });
            }

            const newWeight = await dbWeights.addNewWeight(userId, req.body);
            return res.status(201).json(newWeight);
        } catch (error) {

            return res.status(400).json({
                msg: "Error when registering weight in db"
            });
        }
    });


// ===================================
// ========== PUT requests ==========
// ===================================

router.put('/:userId',
    validateRegisterWeightParams,
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;

        const weightExists = await dbWeights.weightExists(userId, req.body.date);

        if (!weightExists) {
            return res.status(404).json({
                msg: "Weight does not exist for that date"
            });
        }

        try {
            const updatedWeight = await dbWeights.updateWeight(userId, req.body);
            return res.status(200).json(updatedWeight);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when registering weight in db"
            });
        }
    });


module.exports = router;
