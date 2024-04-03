
const express = require('express');

const workoutsValidators = require('../validators/workouts.js');
const { validateIntegerParameter } = require('../validators/generalPurpose.js');
const dbWorkouts = require('../db/workouts.js');
const dbExercises = require('../db/exercises.js');
const mw = require('../utils/middleware.js');

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
    validateIntegerParameter('workoutId'), async (req, res, next) => {
    // TODO implement 401 and 403 response cases
    const { workoutId } = req.params;

    const workout = await dbWorkouts.selectworkoutById(workoutId, req.appIsBeingTested);

    if (workout === undefined) {
        return res.status(404).json({
            msg: "workout not found",
        });
    }

    res.status(200).json(workout);
});

// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout
router.post('/', workoutsValidators.validateCreateWorkoutParams,
    async (req, res, next) => {
        // TODO implement 401 response

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
    async (req, res, next) => {
        // TODO implement 401 and 403 response
        const { workoutId } = req.params;

        const exerciseData = {
            ...req.body,
            timeInSeconds: req.body.time_in_seconds,
            exerciseId: req.body.exerciseId,
            exerciseSet: req.body.exerciseSet,
            workoutId,
        };

        const workoutIdExists = await dbWorkouts.checkWorkoutByIdExists(workoutId, req.appIsBeingTested);

        if (!workoutIdExists) {
            return res.status(404).json({
                msg: `Workout with id ${workoutId} does not exist`,
            });
        }

        const exerciseIdExists = await dbExercises.checkExerciseByIdExists(exerciseData.exerciseId, req.appIsBeingTested);

        if (!exerciseIdExists) {
            return res.status(404).json({
                msg: `Exercise with id ${exerciseData.exerciseId} does not exist`,
            });
        }

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

// update exercise by id
router.put('/:workoutId', 
    workoutsValidators.validateUpdateWorkoutParams,
    validateIntegerParameter('workoutId'), 
    async (req, res, next) => {
        // TODO implement 403 and 401 response cases
        const { workoutId } = req.params;
        const { alias, description } = req.body;

        const updateWorkoutInfo = {
            alias,
            description,
        };

        const updatedWorkout = await dbWorkouts.updateWorkout(workoutId, updateWorkoutInfo, req.appIsBeingTested);

        if (updatedWorkout === undefined) {
            return res.status(404).json({
                msg: "Workout not found",
            });
        }

        res.status(200).json(updatedWorkout);
    }
);

//// =====================================
//// ========== DELETE requests ==========
//// =====================================
//
//// update user by id
//router.delete('/:exerciseId', 
//    validateIntegerParameter('exerciseId'), 
//    async (req, res, next) => {
//        // TODO implement 403 and 401 response cases
//        const { exerciseId } = req.params;
//
//        const deletedexercise = await dbExercises.deleteExercise(exerciseId, req.appIsBeingTested);
//
//        if (deletedexercise === undefined) {
//            return res.status(404).json({
//                msg: "exercise not found",
//            });
//        }
//
//        res.status(200).json(deletedexercise);
//    }
//);


module.exports = router;
