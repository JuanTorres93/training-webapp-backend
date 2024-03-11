
const express = require('express');

const workoutsValidators = require('../validators/workouts.js');
const { validateIntegerParameter } = require('../validators/generalPurpose.js');
const dbWorkouts = require('../db/workouts.js');
const mw = require('../utils/middleware.js');

const router = express.Router();

//// ==================================
//// ========== GET requests ==========
//// ==================================
//
//// Get all exercises
//router.get('/', async (req, res, next) => {
//    const exercises = await dbExercises.selectAllExercises(req.appIsBeingTested);
//
//    res.status(200).send(exercises);
//});
//
//// Get exercise by id
//router.get('/:exerciseId', validateIntegerParameter('exerciseId'), async (req, res, next) => {
//    // TODO implement 403 response case
//    const { exerciseId } = req.params;
//
//    const exercise = await dbExercises.selectExerciseById(exerciseId, req.appIsBeingTested);
//
//    if (exercise === undefined) {
//        return res.status(404).json({
//            msg: "Exercise not found",
//        });
//    }
//
//    res.status(200).json(exercise);
//});

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

        try {
            const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData, req.appIsBeingTested);

            const capitalizedAddedExercise = {
                exerciseId: addedExercise.exerciseid,
                exerciseSet: addedExercise.exerciseset,
                reps: addedExercise.reps,
                weight: addedExercise.weight,
                time_in_seconds: addedExercise.time_in_seconds,
            };

            // TODO DELETE THESE DEBUG LOGS
            console.log('capitalizedAddedExercise');
            console.log(capitalizedAddedExercise);

            return res.status(201).json(capitalizedAddedExercise);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when adding exercise to workout"
            });
        }
});

//// ==================================
//// ========== PUT requests ==========
//// ==================================
//
//// update exercise by id
//router.put('/:exerciseId', 
//    exerciseValidators.validateUpdateExerciseParams,
//    validateIntegerParameter('exerciseId'), 
//    async (req, res, next) => {
//        // TODO implement 403 and 401 response cases
//
//        const { exerciseId } = req.params;
//        const { alias, description } = req.body;
//
//        const newExerciseInfo = {
//            alias,
//            description,
//        };
//
//        const updatedExercise = await dbExercises.updateExercise(exerciseId, newExerciseInfo, req.appIsBeingTested);
//
//        if (updatedExercise === undefined) {
//            return res.status(404).json({
//                msg: "User not found",
//            });
//        }
//
//        res.status(200).json(updatedExercise);
//    }
//);
//
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
