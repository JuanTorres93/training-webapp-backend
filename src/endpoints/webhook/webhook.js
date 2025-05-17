const express = require("express");
const paymentController = require("../../controllers/paymentController");

const webhookApp = express();
webhookApp.post(
  "/webhook-checkout",
  (req, res, next) => {
    // TODO DELETE THESE DEBUG LOGS
    console.log("REACHES WEBHOOK in new ROUTER");
    next();
  },
  // Parse the body
  express.raw({ type: "application/json" }),
  paymentController.webhookCheckout
);

module.exports = webhookApp;
