const express = require('express');


const weightController = require('../../controllers/weightController.js');
const { validateUUIDParameter } = require('../../validators/generalPurpose.js');
const { validateRegisterWeightParams } = require('../../validators/weights.js');
const mw = require('../../utils/middleware.js');

const router = express.Router();


// ==================================
// ========== GET requests ==========
// ==================================


// Get all weights for a user
router.get('/:userId',
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    weightController.getAllWeightsForUserId
);


// ===================================
// ========== POST requests ==========
// ===================================

router.post('/:userId',
    validateRegisterWeightParams,
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    weightController.createNewWeightForUserId
);


// ===================================
// ========== PUT requests ==========
// ===================================

router.put('/:userId',
    validateRegisterWeightParams,
    validateUUIDParameter('userId'),
    mw.checkUserExistsById,
    mw.authenticatedUser,
    mw.loggedUserIdEqualsUserIdInRequest,
    weightController.updateWeightForUserId
);


module.exports = router;
