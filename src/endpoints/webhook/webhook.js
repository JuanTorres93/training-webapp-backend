const express = require("express");
const paymentController = require("../../controllers/paymentController");

const webhookApp = express();
webhookApp.post(
  "/webhook-checkout",
  // Parse the body
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // TODO DELETE THESE DEBUG LOGS
    console.log("REACHES WEBHOOK in new ROUTER");
    next();
  },
  paymentController.webhookCheckout
);

module.exports = webhookApp;
