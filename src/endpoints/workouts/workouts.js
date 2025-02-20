const express = require('express');

const workoutController = require('../../controllers/workoutController.js');
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
// TODO modify spec and endpoint to need authenticated user
router.get('/', workoutController.getAllWorkouts);

// Truncate test table
router.get('/truncate', workoutController.truncateTestTable);

// Get workout by id
router.get('/:workoutId',
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    workoutController.getWorkoutById
);

// Get last workouts of a template by user
// TODO HACER TESTS. SE USA EN REACT, PERO NO ESTÁ TESTEADO
router.get('/last/:templateId/user/:userId/:numberOfWorkouts',
    validateUUIDParameter('templateId'),
    validateUUIDParameter('userId'),
    validateIntegerParameter('numberOfWorkouts'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    workoutController.getLastWorkoutsFromATemplateByUserId
);

// Get last workout of a template by user
// TODO HACER TESTS. SE USA EN REACT, PERO NO ESTÁ TESTEADO
router.get('/last/:templateId/user/:userId',
    validateUUIDParameter('templateId'),
    validateUUIDParameter('userId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    workoutController.getLastSingleWorkoutFromTemplateByUserId
);


// Update end date of workout
router.get('/addFinishDate/:workoutId',
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    workoutController.updateEndDateOfWorkout
);


// Get all workouts from a template
// TODO 403 and 404 responses? Maybe are not necesary
// TODO test EP
router.get('/all/:templateId',
    validateUUIDParameter('templateId'),
    mw.authenticatedUser,
    workoutController.getAllWorkoutsFromTemplate
);

// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout
router.post('/',
    workoutsValidators.validateCreateWorkoutParams,
    mw.authenticatedUser,
    workoutController.createWorkout
);

// Add exercise to workout
router.post('/:workoutId',
    workoutsValidators.validateAddExerciseToWorkoutParams,
    validateUUIDParameter('workoutId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    workoutController.addExerciseToWorkout
);

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
    workoutController.updateWorkout
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
    workoutController.updateExerciseInWorkout
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
    workoutController.deleteWorkout
);

// delete exercise from workout
router.delete('/:workoutId/exercises/:exerciseId',
    validateUUIDParameter('workoutId'),
    validateUUIDParameter('exerciseId'),
    mw.checkWorkoutExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutBelongsToLoggedInUser,
    workoutController.deleteExerciseFromWorkout
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
    workoutController.deleteExerciseSetFromWorkout
);


module.exports = router;
