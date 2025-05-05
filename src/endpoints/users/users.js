const express = require("express");

const {
  validateRegisterUserParams,
  validateUpdateUserParams,
} = require("../../validators/users.js");
const { validateUUIDParameter } = require("../../validators/generalPurpose.js");
const userController = require("../../controllers/userController.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

// ==================================
// ========== GET requests ==========
// ==================================

// Get all users
// TODO IMPORTANT: ADD AUTHORIZATION AND AUTHENTICATION If this endpoint is wanted
// router.get("/", userController.getAllUsers);

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
