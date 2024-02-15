const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');

const checkoutRouter = express.Router();
checkoutRouter.use(bodyParser.json());

// TODO update stripe for real payments
// DOCS youtube stripe tutorial:  https://www.youtube.com/watch?v=0Kd0LeAMGf4&ab_channel=FaztCode
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

checkoutRouter.post('/', async (req, res, next) => {
    const { id, amount } = req.body;

    const payment = await stripe.paymentIntents.create({
        amount,
        currency: 'USD', // TODO cambiar?
        description: 'Conseguir de la base de datos', // TODO connect to DB to get info
        payment_method: id,
        confirm: true,   // Confirm and register payment
        return_url: process.env.CLIENT_URL,
    });
    // TODO research about confirming and registering the payment
    // TODO update database
    // TODO Manage errors with test cards

    // TODO Delete?
    console.log(payment);

    res.json({
        msg: "Payment succesfull",
    });
});

module.exports = checkoutRouter;
