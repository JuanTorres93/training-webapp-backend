const express = require("express");
const router = express.Router();
const paymentController = require("./controllers/paymentController");

router.post(
  "/webhook-checkout",
  (req, res, next) => {
    // TODO DELETE THESE DEBUG LOGS
    console.log("REACHES WEBHOOK");
    next();
  },
  // Parse the body
  express.raw({ type: "application/json" }),
  paymentController.webhookCheckout
);

module.exports = router;
