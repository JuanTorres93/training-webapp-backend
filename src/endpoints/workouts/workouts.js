const express = require('express');

const workoutsValidators = require('../../validators/workouts.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const dbWorkouts = require('../../db/workouts.js');
const dbExercises = require('../../db/exercises.js');
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
    async (req, res, next) => {
    // TODO implement 403 response cases
    const { workoutId } = req.params;

    const workout = await dbWorkouts.selectworkoutById(workoutId, req.appIsBeingTested);

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
        try {
            const createdWorkout = await dbWorkouts.createWorkouts(req.body, req.appIsBeingTested);
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
    async (req, res, next) => {
        // TODO implement 403 response
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
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
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
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
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

        if (updatedExercise === undefined) {
            return res.status(404).json({
                msg: "Workout or exercise not found",
            });
        }

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
    async (req, res, next) => {
        // TODO implement 403 response cases
        const { workoutId } = req.params;

        const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId, req.appIsBeingTested);

        res.status(200).json(deletedWorkout);
    }
);

// delete exercise from workout
router.delete('/:workoutId/exercises/:exerciseId', 
    validateIntegerParameter('workoutId'), 
    validateIntegerParameter('exerciseId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { workoutId, exerciseId } = req.params;

        const workoutIdExists = await dbWorkouts.checkWorkoutByIdExists(workoutId, req.appIsBeingTested);

        if (!workoutIdExists) {
            return res.status(404).json({
                msg: `Workout with id ${workoutId} does not exist`,
            });
        }

        const exerciseIdExists = await dbExercises.checkExerciseByIdExists(exerciseId, req.appIsBeingTested);

        if (!exerciseIdExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist`,
            });
        }

        const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(workoutId, exerciseId, req.appIsBeingTested);

        if (deletedExercise === undefined) {
            return res.status(404).json({
                msg: "Workout not found",
            });
        }

        res.status(200).json(deletedExercise);
    }
);


// delete exercise set from workout
router.delete('/:workoutId/exercises/:exerciseId/:exerciseSet', 
    validateIntegerParameter('workoutId'), 
    validateIntegerParameter('exerciseId'), 
    validateIntegerParameter('exerciseSet'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { workoutId, exerciseId, exerciseSet } = req.params;

        const workoutIdExists = await dbWorkouts.checkWorkoutByIdExists(workoutId, req.appIsBeingTested);

        if (!workoutIdExists) {
            return res.status(404).json({
                msg: `Workout with id ${workoutId} does not exist`,
            });
        }

        const exerciseIdExists = await dbExercises.checkExerciseByIdExists(exerciseId, req.appIsBeingTested);

        if (!exerciseIdExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not exist`,
            });
        }

        const workout = await dbWorkouts.selectworkoutById(workoutId, req.appIsBeingTested)
        const exercises = workout.exercises;

        const setExists = exercises.filter((ex) => {
            return (ex.set === exerciseSet) && (ex.id === exerciseId);
        }).length > 0

        if (!setExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseId} does not contain set ${exerciseSet}`,
            });
        }

        const deletedExercise = await dbWorkouts.deleteSetFromExercise(workoutId, exerciseId, exerciseSet, req.appIsBeingTested);

        if (deletedExercise === undefined) {
            return res.status(404).json({
                msg: "Workout not found",
            });
        }

        res.status(200).json(deletedExercise);
    }
);


module.exports = router;
