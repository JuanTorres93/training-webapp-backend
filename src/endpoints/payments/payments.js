const express = require("express");

const paymentController = require("../../controllers/paymentController.js");

const {
  validateUUIDParameter,
  validateStringParameter,
} = require("../../validators/generalPurpose.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

// TODO IMPORTANT protect this route
router.get(
  "/checkout-session/:subscriptionId/:lang",
  validateUUIDParameter("subscriptionId"),
  validateStringParameter("lang"),
  mw.checkSubscriptionExistsById,
  mw.authenticatedUser,
  mw.checkUserExistsById,
  paymentController.getCheckoutSession
);

module.exports = router;
