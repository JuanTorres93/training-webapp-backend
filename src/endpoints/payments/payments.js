const express = require("express");

const paymentController = require("../../controllers/paymentController.js");

const { validateUUIDParameter } = require("../../validators/generalPurpose.js");
const mw = require("../../utils/middleware.js");

const router = express.Router();

// TODO IMPORTANT protect this route
router.get(
  "/checkout-session/:subscriptionId",
  validateUUIDParameter("subscriptionId"),
  mw.authenticatedUser,
  mw.checkUserExistsById,
  paymentController.getCheckoutSession
);

module.exports = router;
