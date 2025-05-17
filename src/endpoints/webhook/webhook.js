const express = require("express");
const paymentController = require("../../controllers/paymentController");

const webhookApp = express();
webhookApp.post(
  "/webhook-checkout",
  // Parse the body
  express.raw({ type: "application/json" }),
  paymentController.webhookCheckout
);

module.exports = webhookApp;
