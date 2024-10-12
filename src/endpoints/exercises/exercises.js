const express = require('express');

const exerciseValidators = require('../../validators/exercises.js');
const { validateIntegerParameter } = require('../../validators/generalPurpose.js');
const dbExercises = require('../../db/exercises.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all exercises
router.get('/', async (req, res, next) => {
    const exercises = await dbExercises.selectAllExercises();

    res.status(200).send(exercises);
});

// Truncate test table
router.get('/truncate', async (req, res, next) => {
    const truncatedTable = await dbExercises.truncateTableTest();

    res.status(200).send(truncatedTable);
});

// Get all common exercises
router.get('/common',
    mw.authenticatedUser,
    async (req, res, next) => {

        const commonExercises = await dbExercises.selectCommonExercises();

        res.status(200).json(commonExercises);
    });

// Get exercise by id
router.get('/:exerciseId',
    validateIntegerParameter('exerciseId'),
    mw.checkExerciseExistsById,
    async (req, res, next) => {
        // TODO implement 403 response case
        const { exerciseId } = req.params;

        const exercise = await dbExercises.selectExerciseById(exerciseId);

        res.status(200).json(exercise);
    });

// Get all exercises from user
router.get('/all/:userId',
    validateIntegerParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    async (req, res, next) => {
        const { userId } = req.params;

        const exercises = await dbExercises.selectAllExercisesFromUser(userId);

        res.status(200).json(exercises);
    });

// ===================================
// ========== POST requests ==========
// ===================================
router.post('/',
    exerciseValidators.validateCreateExerciseParams,
    mw.authenticatedUser,
    async (req, res, next) => {
        const userId = req.user.id;

        try {
            const createdExercise = await dbExercises.createExercise(
                userId, req.body
            );
            return res.status(201).json(createdExercise);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when creating exercise in db"
            });
        }
    });

// ==================================
// ========== PUT requests ==========
// ==================================

// update exercise by id
router.put('/:exerciseId',
    exerciseValidators.validateUpdateExerciseParams,
    validateIntegerParameter('exerciseId'),
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.exerciseBelongsToLoggedInUser,
    async (req, res, next) => {
        const { exerciseId } = req.params;
        const { alias, description } = req.body;

        const newExerciseInfo = {
            alias,
            description,
        };

        const updatedExercise = await dbExercises.updateExercise(exerciseId, newExerciseInfo);

        res.status(200).json(updatedExercise);
    }
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// update user by id
router.delete('/:exerciseId',
    validateIntegerParameter('exerciseId'),
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.exerciseBelongsToLoggedInUser,
    async (req, res, next) => {
        const { exerciseId } = req.params;

        const deletedexercise = await dbExercises.deleteExercise(exerciseId);

        res.status(200).json(deletedexercise);
    }
);


module.exports = router;
