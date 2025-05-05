const express = require("express");

const exerciseController = require("../../controllers/exerciseController.js");

const exerciseValidators = require("../../validators/exercises.js");
const { validateUUIDParameter } = require("../../validators/generalPurpose.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all exercises
// TODO protect this route?
router.get("/", exerciseController.getAllExercises);

// Truncate test table
router.get("/truncate", exerciseController.truncateTestTable);

// Get all common exercises
router.get(
  "/common",
  mw.authenticatedUser,
  exerciseController.getAllCommonExercses
);

// Get exercise by id
// TODO TEST 401 response case
router.get(
  "/:exerciseId",
  validateUUIDParameter("exerciseId"),
  mw.authenticatedUser,
  mw.checkExerciseExistsById,
  mw.exerciseBelongsToLoggedInORCommonUser,
  exerciseController.getExerciseById
);

// Get all exercises from user
router.get(
  "/all/:userId",
  validateUUIDParameter("userId"),
  mw.checkUserExistsById,
  mw.authenticatedUser,
  mw.loggedUserIdEqualsUserIdInRequest,
  exerciseController.getAllExercisesFromUser
);

// ===================================
// ========== POST requests ==========
// ===================================
router.post(
  "/",
  exerciseValidators.validateCreateExerciseParams,
  mw.authenticatedUser,
  exerciseController.createExercise
);

// ==================================
// ========== PUT requests ==========
// ==================================

// update exercise by id
router.put(
  "/:exerciseId",
  exerciseValidators.validateUpdateExerciseParams,
  validateUUIDParameter("exerciseId"),
  mw.checkExerciseExistsById,
  mw.authenticatedUser,
  mw.exerciseBelongsToLoggedInUser,
  exerciseController.updateExercise
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// update user by id
router.delete(
  "/:exerciseId",
  validateUUIDParameter("exerciseId"),
  mw.checkExerciseExistsById,
  mw.authenticatedUser,
  mw.exerciseBelongsToLoggedInUser,
  exerciseController.deleteExercise
);

module.exports = router;
