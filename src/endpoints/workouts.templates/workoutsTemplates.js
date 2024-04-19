const express = require('express');

const workoutsTemplatesValidators = require('../../validators/workoutsTemplates.js');
const dbWorkoutsTemplates = require('../../db/workoutsTemplates.js');
const dbUsers = require('../../db/users.js');
const dbExercises = require('../../db/exercises.js');
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


// Get workout template by id
router.get('/:templateId', 
    validateIntegerParameter('templateId'), async (req, res, next) => {
    // TODO implement 401 and 403 response cases
    const { templateId } = req.params;

    const workoutTemplate = await dbWorkoutsTemplates.selectWorkoutTemplateById(templateId, req.appIsBeingTested);

    if (workoutTemplate === undefined) {
        return res.status(404).json({
            msg: "workout not found",
        });
    }

    res.status(200).json(workoutTemplate);
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

// Add exercise to workout template
router.post('/:workoutTemplateId', 
    workoutsTemplatesValidators.validateAddExerciseToWorkoutTemplateParams,
    validateIntegerParameter('workoutTemplateId'),
    async (req, res, next) => {
        // TODO implement 401 and 403 response
        const { workoutTemplateId } = req.params;
        const { exerciseId } = req.body;

        // Check template exists
        const templateExists = await dbWorkoutsTemplates.checkWorkoutTemplateByIdExists(
            workoutTemplateId, req.appIsBeingTested
        );

        if (!templateExists) {
            return res.status(404).json({
                msg: `Template with id ${workoutTemplateId} does not exist`,
            });
        }

        // Check exercise exists
        const exerciseIdExists = await dbExercises.checkExerciseByIdExists(exerciseId, req.appIsBeingTested);

        if (!exerciseIdExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist`,
            });
        }

        const exercise = {
            ...req.body,
            workoutTemplateId,
        };

        try {
            const addedExercise = await dbWorkoutsTemplates.addExerciseToWorkoutTemplate(exercise, req.appIsBeingTested);

            return res.status(201).json(addedExercise);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when adding exercise to workout template"
            });
        }
});


// ==================================
// ========== PUT requests ==========
// ==================================

// update workout template by id
router.put('/:templateId', 
    workoutsTemplatesValidators.validateUpdateWorkoutTemplateParams,
    validateIntegerParameter('templateId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { templateId } = req.params;
        const { alias, description } = req.body;

        const updateWorkoutTemplateInfo = {
            alias,
            description,
        };

        const updatedWorkoutTemplate = await dbWorkoutsTemplates.updateWorkoutTemplate(
            templateId, updateWorkoutTemplateInfo, req.appIsBeingTested
        );

        if (updatedWorkoutTemplate === undefined) {
            return res.status(404).json({
                msg: "Workout template not found",
            });
        }

        res.status(200).json(updatedWorkoutTemplate);
    }
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// delete workout by id
router.delete('/:templateId', 
    validateIntegerParameter('templateId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { templateId } = req.params;

        const deletedWorkoutTemplate = await dbWorkoutsTemplates.deleteWorkoutTemplate(
            templateId, req.appIsBeingTested
        );

        if (deletedWorkoutTemplate === undefined) {
            return res.status(404).json({
                msg: "Workout template not found",
            });
        }

        res.status(200).json(deletedWorkoutTemplate);
    }
);

module.exports = router;