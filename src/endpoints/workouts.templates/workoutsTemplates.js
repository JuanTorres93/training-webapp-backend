const express = require('express');

const workoutsTemplatesValidators = require('../../validators/workoutsTemplates.js');
const dbWorkoutsTemplates = require('../../db/workoutsTemplates.js');
const dbUsers = require('../../db/users.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();



// ==================================
// ========== GET requests ==========
// ==================================

// Get all workouts templates
router.get('/', async (req, res, next) => {
    // TODO modify spec and endpoint to need authenticated user
    const templates = await dbWorkoutsTemplates.selectAllWorkoutsTemplates(req.appIsBeingTested);

    res.status(200).send(templates);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbWorkoutsTemplates.truncateTableTest(req.appIsBeingTested);

    res.status(200).send(truncatedTable);
});

// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout
router.post('/', workoutsTemplatesValidators.validateCreateWorkoutTemplateParams,
    async (req, res, next) => {
        // TODO implement 401 and 403 response

        // TODO check user exists
        const { userId } = req.body;

        const user = await dbUsers.selectUserById(userId, req.appIsBeingTested)

        if (user === undefined) {
            return res.status(400).json({
                msg: `Error. User with id ${userId} does not exist.`,
            });
        }

        try {
            const createdWorkoutTemplate = await dbWorkoutsTemplates.createWorkoutTemplate(
                req.body, req.appIsBeingTested
            );
            return res.status(201).json(createdWorkoutTemplate);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when creating workout"
            });
        }
});

module.exports = router;