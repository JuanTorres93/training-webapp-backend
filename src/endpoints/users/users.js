const express = require("express");

const {
  validateRegisterUserParams,
  validateUpdateUserParams,
} = require("../../validators/users.js");
const {
  validateUUIDParameter,
  validateEmailParameter,
  validateStringParameter,
  validateStrongPasswordParameter,
} = require("../../validators/generalPurpose.js");
const userController = require("../../controllers/userController.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

router.post(
  "/forgotPassword/:language",
  validateEmailParameter("email"),
  validateStringParameter("language"),
  userController.forgotPassword
);

router.patch(
  "/resetPassword/:token",
  validateStringParameter("token"),
  validateStrongPasswordParameter("password"),
  validateStrongPasswordParameter("passwordConfirm"),
  mw.passwordEqualsPasswordConfirm,
  userController.resetPassword
);

// ==================================
// ========== GET requests ==========
// ==================================

// Truncate test table
router.get("/truncate", userController.truncateTestTable);

// Get user by id
router.get(
  "/:userId",
  validateUUIDParameter("userId"),
  mw.checkUserExistsById,
  mw.authenticatedUser,
  mw.loggedUserIdEqualsUserIdInRequest,
  userController.getUserById
);

// Get everything from user by id (test db only)
router.get(
  "/:userId/allTest",
  validateUUIDParameter("userId"),
  userController.getEverythingFromUserInTestEnv
);

// ===================================
// ========== POST requests ==========
// ===================================

// Register new user
// DOC: Register user
router.post(
  "/",
  validateRegisterUserParams,
  mw.checkUserEmailAndAliasAlreadyExist,
  mw.hashPassword,
  userController.registerNewUser
);

// ==================================
// ========== PUT requests ==========
// ==================================

// update user by id
router.put(
  // TODO IMPORTANT: prevent updating subscription_id and test functionality
  "/:userId",
  validateUpdateUserParams,
  validateUUIDParameter("userId"),
  mw.checkUserEmailAndAliasAlreadyExist,
  mw.checkUserExistsById,
  mw.authenticatedUser,
  mw.hashPassword,
  mw.loggedUserIdEqualsUserIdInRequest,
  userController.updateUserById
);

// =====================================
// ========== DELETE requests ==========
// =====================================

// update user by id
router.delete(
  "/:userId",
  validateUUIDParameter("userId"),
  mw.checkUserExistsById,
  mw.authenticatedUser,
  mw.loggedUserIdEqualsUserIdInRequest,
  userController.deleteUserById
);

module.exports = router;
