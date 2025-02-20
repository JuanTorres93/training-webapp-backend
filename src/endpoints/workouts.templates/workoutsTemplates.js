const express = require('express');

const templatesController = require('../../controllers/workoutTemplateController.js');
const workoutsTemplatesValidators = require('../../validators/workoutsTemplates.js');
const dbWorkoutsTemplates = require('../../db/workoutsTemplates.js');
const { validateIntegerParameter, validateUUIDParameter } = require('../../validators/generalPurpose.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================

// Get all workouts templates
// TODO modify spec to need authenticated user
router.get('/',
    mw.authenticatedUser,
    templatesController.getAllTemplates
);

// Truncate test table
router.get('/truncate', templatesController.truncateTestTable);

router.get('/common',
    mw.authenticatedUser,
    templatesController.getCommonTemplates
);

// Get workout template by id
router.get('/:templateId',
    validateUUIDParameter('templateId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    // mw.workoutTemplateBelongsToLoggedInUser,
    mw.workoutTemplateBelongsToLoggedInORCommonUser,
    templatesController.getTemplateById
);

router.get('/all/:userId',
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    templatesController.getAllTemplatesFromUser
);

// Last templates performed and finished by a user
router.get('/last/user/:userId/:numberOfWorkouts',
    validateUUIDParameter('userId'),
    validateIntegerParameter('numberOfWorkouts'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    templatesController.getLastTemplatesPerformedAndFinishedByUser
);

// ===================================
// ========== POST requests ==========
// ===================================

// Create new workout template
// TODO implement 403 response
router.post('/',
    workoutsTemplatesValidators.validateCreateWorkoutTemplateParams,
    mw.checkUserExistsById,
    mw.authenticatedUser,
    templatesController.createTemplate
);

// Add exercise to workout template
router.post('/:templateId',
    workoutsTemplatesValidators.validateAddExerciseToWorkoutTemplateParams,
    validateUUIDParameter('templateId'),
    mw.checkWorkoutTemplateExistsById,
    mw.checkExerciseExistsById,
    mw.authenticatedUser,
    mw.workoutTemplateBelongsToLoggedInUser,
    templatesController.addExerciseToTemplate
);


// ==================================
// ========== PUT requests ==========
// ==================================

// update workout template by id
router.put('/:templateId',
    workoutsTemplatesValidators.validateUpdateWorkoutTemplateParams,
    validateUUIDParameter('templateId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.workoutTemplateBelongsToLoggedInUser,
    templatesController.updateTemplate
);

// update exercise in workout template
router.put('/:templateId/exercises/:exerciseId/:exerciseOrder',
    workoutsTemplatesValidators.validateUpdateExerciseInWorkoutTemplateParams,
    validateUUIDParameter('templateId'),
    validateUUIDParameter('exerciseId'),
    validateIntegerParameter('exerciseOrder'),
    mw.checkExerciseExistsById,
    mw.checkWorkoutTemplateExistsById,
    mw.checkExerciseOrderExistsInWorkoutTemplate,
    mw.authenticatedUser,
    mw.workoutTemplateBelongsToLoggedInUser,
    templatesController.updateExerciseInTemplate
);


// =====================================
// ========== DELETE requests ==========
// =====================================

// delete workout by id
router.delete('/:templateId',
    validateUUIDParameter('templateId'),
    mw.checkWorkoutTemplateExistsById,
    mw.authenticatedUser,
    mw.workoutTemplateBelongsToLoggedInUser,
    templatesController.deleteTemplate
);

// delete exercise from workout template
router.delete('/:templateId/exercises/:exerciseId/:exerciseOrder',
    validateUUIDParameter('templateId'),
    validateUUIDParameter('exerciseId'),
    validateIntegerParameter('exerciseOrder'),
    mw.checkWorkoutTemplateExistsById,
    mw.checkExerciseExistsById,
    mw.checkExerciseOrderExistsInWorkoutTemplate,
    mw.authenticatedUser,
    mw.workoutTemplateBelongsToLoggedInUser,
    templatesController.deleteExerciseFromTemplate
);

module.exports = router;
