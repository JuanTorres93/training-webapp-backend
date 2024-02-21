
const express = require('express');

const exerciseValidators = require('../validators/exercises.js');
const { validateIntegerParameter } = require('../validators/generalPurpose.js');
const dbExercises = require('../db/exercises.js');
const mw = require('../utils/middleware.js');

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all users
router.get('/', async (req, res, next) => {
    const exercises = await dbExercises.selectAllExercises(req.appIsBeingTested);

    res.status(200).send(exercises);
});

// Get exercise by id
router.get('/:exerciseId', validateIntegerParameter('exerciseId'), async (req, res, next) => {
    // TODO implement 403 response case
    const { exerciseId } = req.params;

    const exercise = await dbExercises.selectExerciseById(exerciseId, req.appIsBeingTested);

    if (exercise === undefined) {
        return res.status(404).json({
            msg: "Exercise not found",
        });
    }

    res.status(200).json(exercise);
});

// ===================================
// ========== POST requests ==========
// ===================================
router.post('/', exerciseValidators.validateCreateExerciseParams,
    async (req, res, next) => {
        // TODO implement 403 response
        const { alias, description } = req.body;

        try {
            const createdExercise = await dbExercises.createExercise(alias, 
                                                                     description, 
                                                                     req.appIsBeingTested);
            return res.status(201).json(createdExercise);
        } catch (error) {
            return res.status(400).json({
                msg: "Error when creating exercise in db"
            });
        }
});

module.exports = router;
