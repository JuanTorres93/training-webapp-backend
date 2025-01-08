const express = require('express');

const workoutsValidators = require('../../validators/workouts.js');
const {
    validateIntegerParameter,
    validateStringParameter,
    validateUUIDParameter,
} = require('../../validators/generalPurpose.js');
const dbWorkouts = require('../../db/workouts.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all workouts
router.get('/', async (req, res, next) => {
    // TODO modify spec and endpoint to need authenticated user
    const workouts = await dbWorkouts.selectAllWorkouts();

    res.status(200).send(workouts);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbWorkouts.truncateTableTest();

    res.status(200).send(truncatedTable);
});

// Get workout by id
router.get('/:workoutId',
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const workout = await dbWorkouts.selectworkoutById(workoutId);

        res.status(200).json(workout);
    });

// Get last workouts of a template by user
// TODO comprobar si este endpoint se usa. EN los tests no está. MIRAR EN LA APLICACIÓN DE REACT
router.get('/last/:templateId/user/:userId/:numberOfWorkouts',
    validateUUIDParameter('templateId'),
    validateUUIDParameter('userId'),
    validateIntegerParameter('numberOfWorkouts'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { templateId, userId, numberOfWorkouts } = req.params;

        const workout = await dbWorkouts.selectLastNWorkoutsFromUser(templateId, userId, numberOfWorkouts);

        res.status(200).json(workout);
    });

// Get last workout of a template by user
router.get('/last/:templateId/user/:userId',
    validateUUIDParameter('templateId'),
    validateUUIDParameter('userId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { templateId, userId } = req.params;
        let workout;
        try {
            workout = await dbWorkouts.selectLastWorkoutFromUser(templateId, userId);
        } catch (error) {
            console.log(error);
        }

        res.status(200).json(workout);
    });


// Update end date of workout
router.get('/addFinishDate/:workoutId',
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const workout = await dbWorkouts.addFinishDateToWorkout(workoutId);

        res.status(200).json(workout);
    });


// Get all workouts from a template
router.get('/all/:templateId',
    validateUUIDParameter('templateId'),
    mw.authenticatedUser,
    async (req, res, next) => {
        // TODO 403 and 404 responses? Maybe are not necesary

        // TODO test EP
        const { templateId } = req.params;
        const user = req.session.passport.user;

        const workoutsIds = await dbWorkouts.getAllWorkoutsIdsFromTemplateId(templateId, user.id);

        res.status(200).json(workoutsIds);
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
                userId, req.body
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
    validateUUIDParameter('workoutId'),
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
            const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData);

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
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;
        const { description } = req.body;

        const updateWorkoutInfo = {
            description,
        };

        const updatedWorkout = await dbWorkouts.updateWorkout(workoutId, updateWorkoutInfo);

        res.status(200).json(updatedWorkout);
    }
);

// update exercise in workout
router.put('/:workoutId/exercises/:exerciseId',
    workoutsValidators.validateUpdateExerciseInWorkoutParams,
    validateUUIDParameter('workoutId'),
    validateUUIDParameter('exerciseId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId } = req.params;
        const { exerciseSet, reps, weight, time_in_seconds } = req.body;

        const exerciseInWorkoutExists = await dbWorkouts.checkExerciseInWorkoutExists(workoutId, exerciseId);

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

        const updatedExercise = await dbWorkouts.updateExerciseFromWorkout(workoutId, updateExerciseInfo);

        res.status(200).json(updatedExercise);
    }
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// delete workout by id
router.delete('/:workoutId',
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId } = req.params;

        const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId);

        res.status(200).json(deletedWorkout);
    }
);

// delete exercise from workout
router.delete('/:workoutId/exercises/:exerciseId',
    validateUUIDParameter('workoutId'),
    validateUUIDParameter('exerciseId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId } = req.params;

        const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(workoutId, exerciseId);

        res.status(200).json(deletedExercise);
    }
);

// delete exercise set from workout
router.delete('/:workoutId/exercises/:exerciseId/:exerciseSet',
    validateUUIDParameter('workoutId'),
    validateUUIDParameter('exerciseId'),
    validateIntegerParameter('exerciseSet'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.checkExerciseSetExistsInWorkout,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    async (req, res, next) => {
        const { workoutId, exerciseId, exerciseSet } = req.params;

        const deletedExercise = await dbWorkouts.deleteSetFromExercise(workoutId, exerciseId, exerciseSet);

        res.status(200).json(deletedExercise);
    }
);


module.exports = router;
