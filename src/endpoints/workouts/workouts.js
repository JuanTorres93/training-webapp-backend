const express = require('express');

const workoutsValidators = require('../../validators/workouts.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const dbWorkouts = require('../../db/workouts.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all workouts
router.get('/', async (req, res, next) => {
    // TODO modify spec and endpoint to need authenticated user
    const workouts = await dbWorkouts.selectAllWorkouts(req.appIsBeingTested);

    res.status(200).send(workouts);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbWorkouts.truncateTableTest(req.appIsBeingTested);

    res.status(200).send(truncatedTable);
});

// Get workout by id
router.get('/:workoutId',
    validateIntegerParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const workout = await dbWorkouts.selectworkoutById(workoutId, req.appIsBeingTested);

        res.status(200).json(workout);
    });

// Get last workouts of a template by user
router.get('/last/:templateId/user/:userId/:numberOfWorkouts',
    validateIntegerParameter('templateId'),
    validateIntegerParameter('userId'),
    validateIntegerParameter('numberOfWorkouts'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { templateId, userId, numberOfWorkouts } = req.params;

        const workout = await dbWorkouts.selectLastNWorkoutsFromUser(templateId, userId, numberOfWorkouts, req.appIsBeingTested);

        res.status(200).json(workout);
    });

// Get last workout of a template by user
router.get('/last/:templateId/user/:userId',
    validateIntegerParameter('templateId'),
    validateIntegerParameter('userId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { templateId, userId } = req.params;

        const workout = await dbWorkouts.selectLastWorkoutFromUser(templateId, userId, req.appIsBeingTested);

        res.status(200).json(workout);
    });

// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout
router.post('/',
    workoutsValidators.validateCreateWorkoutParams,
    mw.authenticatedUser,
    async (req, res, next) => {
        const userId = req.user.id;

        try {
            const createdWorkout = await dbWorkouts.createWorkouts(
                userId, req.body, req.appIsBeingTested
            );
            return res.status(201).json(createdWorkout);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when creating workout"
            });
        }
    });

// Add exercise to workout
router.post('/:workoutId',
    workoutsValidators.validateAddExerciseToWorkoutParams,
    validateIntegerParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const exerciseData = {
            ...req.body,
            timeInSeconds: req.body.time_in_seconds,
            exerciseId: req.body.exerciseId,
            exerciseSet: req.body.exerciseSet,
            workoutId,
        };

        // TODO CHECK primary key is not duplicated
        try {
            const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData, req.appIsBeingTested);

            const capitalizedAddedExercise = {
                exerciseId: addedExercise.exerciseid,
                exerciseSet: addedExercise.exerciseset,
                reps: addedExercise.reps,
                weight: addedExercise.weight,
                time_in_seconds: addedExercise.time_in_seconds,
            };

            return res.status(201).json(capitalizedAddedExercise);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when adding exercise to workout"
            });
        }
    });

// ==================================
// ========== PUT requests ==========
// ==================================

// update workout by id
router.put('/:workoutId',
    workoutsValidators.validateUpdateWorkoutParams,
    validateIntegerParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;
        const { alias, description } = req.body;

        const updateWorkoutInfo = {
            alias,
            description,
        };

        const updatedWorkout = await dbWorkouts.updateWorkout(workoutId, updateWorkoutInfo, req.appIsBeingTested);

        res.status(200).json(updatedWorkout);
    }
);

// update exercise in workout
router.put('/:workoutId/exercises/:exerciseId',
    workoutsValidators.validateUpdateExerciseInWorkoutParams,
    validateIntegerParameter('workoutId'),
    validateIntegerParameter('exerciseId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId } = req.params;
        const { exerciseSet, reps, weight, time_in_seconds } = req.body;

        const exerciseInWorkoutExists = await dbWorkouts.checkExerciseInWorkoutExists(workoutId, exerciseId, req.appIsBeingTested);

        if (!exerciseInWorkoutExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist in workout with id ${workoutId}`,
            });
        }

        const updateExerciseInfo = {
            exerciseId,
            exerciseSet,
            reps,
            weight,
            time_in_seconds,
        };

        const updatedExercise = await dbWorkouts.updateExerciseFromWorkout(workoutId, updateExerciseInfo, req.appIsBeingTested);

        res.status(200).json(updatedExercise);
    }
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// delete workout by id
router.delete('/:workoutId',
    validateIntegerParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId, req.appIsBeingTested);

        res.status(200).json(deletedWorkout);
    }
);

// delete exercise from workout
router.delete('/:workoutId/exercises/:exerciseId',
    validateIntegerParameter('workoutId'),
    validateIntegerParameter('exerciseId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId } = req.params;

        const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(workoutId, exerciseId, req.appIsBeingTested);

        res.status(200).json(deletedExercise);
    }
);

// delete exercise set from workout
router.delete('/:workoutId/exercises/:exerciseId/:exerciseSet',
    validateIntegerParameter('workoutId'),
    validateIntegerParameter('exerciseId'),
    validateIntegerParameter('exerciseSet'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.checkExerciseSetExistsInWorkout,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId, exerciseSet } = req.params;

        const deletedExercise = await dbWorkouts.deleteSetFromExercise(workoutId, exerciseId, exerciseSet, req.appIsBeingTested);

        res.status(200).json(deletedExercise);
    }
);


module.exports = router;
