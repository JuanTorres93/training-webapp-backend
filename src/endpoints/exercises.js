
const express = require('express');

const exerciseValidators = require('../validators/exercises.js');
const { validateIntegerParameter } = require('../validators/generalPurpose.js');
const dbExercises = require('../db/exercises.js');
const mw = require('../utils/middleware.js');

const router = express.Router();

// ===================================
// ========== POST requests ==========
// ===================================
router.post('/', exerciseValidators.validateCreateExerciseParams,
    async (req, res, next) => {
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
