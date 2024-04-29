const express = require('express');

const workoutsTemplatesValidators = require('../../validators/workoutsTemplates.js');
const dbWorkoutsTemplates = require('../../db/workoutsTemplates.js');
const dbExercises = require('../../db/exercises.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================

// Get all workouts templates
router.get('/', 
    mw.authenticatedUser,
    async (req, res, next) => {
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
    validateIntegerParameter('templateId'), 
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    async (req, res, next) => {
    // TODO implement 403 response cases
    const { templateId } = req.params;

    const workoutTemplate = await dbWorkoutsTemplates.selectWorkoutTemplateById(templateId, req.appIsBeingTested);

    res.status(200).json(workoutTemplate);
});


// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout
router.post('/', 
    workoutsTemplatesValidators.validateCreateWorkoutTemplateParams,
    mw.checkUserExistsById,
    mw.authenticatedUser,
    async (req, res, next) => {
        // TODO implement 403 response

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
router.post('/:templateId', 
    workoutsTemplatesValidators.validateAddExerciseToWorkoutTemplateParams,
    validateIntegerParameter('templateId'),
    mw.checkWorkoutTemplateExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    async (req, res, next) => {
        // TODO implement 403 response
        const { templateId } = req.params;

        const exercise = {
            ...req.body,
            workoutTemplateId: templateId,
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
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    async (req, res, next) => {
        // TODO implement 403 response cases
        const { templateId } = req.params;
        const { alias, description } = req.body;

        const updateWorkoutTemplateInfo = {
            alias,
            description,
        };

        const updatedWorkoutTemplate = await dbWorkoutsTemplates.updateWorkoutTemplate(
            templateId, updateWorkoutTemplateInfo, req.appIsBeingTested
        );

        res.status(200).json(updatedWorkoutTemplate);
    }
);

// update exercise in workout template
router.put('/:templateId/exercises/:exerciseId', 
    workoutsTemplatesValidators.validateUpdateExerciseInWorkoutTemplateParams,
    validateIntegerParameter('templateId'), 
    validateIntegerParameter('exerciseId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { templateId, exerciseId } = req.params;
        const { exerciseOrder, exerciseSets } = req.body;

        const exerciseInWorkoutTemplateExists = await dbWorkoutsTemplates.checkExerciseInWorkoutExists(
            templateId, exerciseId, req.appIsBeingTested
        );

        if (!exerciseInWorkoutTemplateExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist in workout template with id ${templateId}`,
            });
        }

        const updateExerciseInfo = {
            exerciseId,
            exerciseOrder,
            exerciseSets,
        };

        const updatedExercise = await dbWorkoutsTemplates.updateExerciseFromWorkoutTemplate(
            templateId, updateExerciseInfo, req.appIsBeingTested
        );

        if (updatedExercise === undefined) {
            return res.status(404).json({
                msg: "Workout template or exercise not found",
            });
        }

        res.status(200).json(updatedExercise);
    }
);


// =====================================
// ========== DELETE requests ==========
// =====================================

// delete workout by id
router.delete('/:templateId', 
    validateIntegerParameter('templateId'), 
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    async (req, res, next) => {
        // TODO implement 403 response cases
        const { templateId } = req.params;

        const deletedWorkoutTemplate = await dbWorkoutsTemplates.deleteWorkoutTemplate(
            templateId, req.appIsBeingTested
        );

        res.status(200).json(deletedWorkoutTemplate);
    }
);

// delete exercise from workout template
router.delete('/:templateId/exercises/:exerciseId/:exerciseOrder', 
    validateIntegerParameter('templateId'), 
    validateIntegerParameter('exerciseId'), 
    validateIntegerParameter('exerciseOrder'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { templateId, exerciseId, exerciseOrder } = req.params;

        const workoutTemplateIdExists = await dbWorkoutsTemplates.checkWorkoutTemplateByIdExists(
            templateId, req.appIsBeingTested
        );

        if (!workoutTemplateIdExists) {
            return res.status(404).json({
                msg: `Workout template with id ${templateId} does not exist`,
            });
        }

        const exerciseIdExists = await dbExercises.checkExerciseByIdExists(exerciseId, req.appIsBeingTested);

        if (!exerciseIdExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist`,
            });
        }

        const deletedExercise = await dbWorkoutsTemplates.deleteExerciseFromWorkoutTemplate(
            templateId, exerciseId, exerciseOrder, req.appIsBeingTested
        );

        if (deletedExercise === undefined) {
            return res.status(404).json({
                msg: "Workout not found",
            });
        }

        res.status(200).json(deletedExercise[0]);
    }
);

module.exports = router;
