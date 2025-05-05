const express = require("express");

const subscriptionController = require("../../controllers/subscriptionController.js");

const { validateUUIDParameter } = require("../../validators/generalPurpose.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

router.get(
  "/",
  mw.authenticatedUser,
  mw.checkUserExistsById,
  subscriptionController.getAllSubscriptions
);

// Get subscription for user
router.get(
  "/user/:userId",
  validateUUIDParameter("userId"),
  mw.authenticatedUser,
  mw.checkUserExistsById,
  mw.loggedUserIdEqualsUserIdInRequest,
  subscriptionController.getSubscriptionForUser
);

module.exports = router;
