// TODO DELETE THESE DEBUG LOGS
// console.log("process.env");
// console.log(process.env);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const subscriptionsDb = require("../db/subscriptions.js");

// TODO Handle error. I used to use catchAsync, but don't have that error handling in this project
exports.getCheckoutSession = async (req, res, next) => {
  try {
    // 1) Get the subscription type
    const subscription = await subscriptionsDb.selectSuscriptionByType("PAID");
    if (!subscription) {
      //   return next(new AppError("No tour found with that ID", 404));
      // TODO handle
    }

    // 2) Create checkout session
    // DOC: Create a new stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      // REQUIRED
      payment_method_types: ["card"],
      // REQUIRED when using prices
      mode: "subscription",
      // REQUIRED URL that will be called once the payment is successful
      // IMPORTANT NOTE: The query params are just a workaround until the
      // page has been deployed. THIS IS NOT SECURE.
      //success_url: `${req.protocol}://${req.get('host')}/?tour=${
      //  req.params.tourId
      //}&user=${req.user.id}&price=${tour.price}`,
      success_url: `${process.env.CLIENT_URL}/?payment=success`,
      // REQUIRED URL that the user goes if he decides to cancel the payment
      cancel_url: `${process.env.CLIENT_URL}/?payment=failed`,
      // This is called in a protected route, so we have access to the user object
      customer_email: req.user.email,
      // Allows to pass some data to the session. Once the payment is successful,
      // we will have access to the session again, so when can use the info for
      // database operations. This is the last step in the diagram shown by JONAS and
      // it will only work in deployed applications.
      client_reference_id: req.params.tourId,
      // Details about the product itself
      line_items: [
        // IMPORTANT: The keys of the objects comes from stripe, so we can't
        // make our own keys.
        {
          // The quantity of the product
          quantity: 1,
          price_data: {
            // The currency to use
            currency: "eur",
            // unit_amount is the price IN CENTS of the product being purchased
            unit_amount: subscription.base_price_in_eur_cents,
            recurring: {
              // How often the subscription will be charged
              interval: "month",
            },
            product_data: {
              // Name of the product
              name: `${subscription.type} subscription`,
              // Description of the product
              description: subscription.description,
              // images must be light weight and hosted. (Deployed application)
              images: [
                `${req.protocol}://${req.get("host")}/img/tours/${
                  subscription.imageCover
                }`,
              ],
            },
          },
        },
      ],
    });

    // 3) Send it to the client
    res.status(200).json({
      status: "success",
      session,
    });
  } catch (error) {
    // TODO DELETE THESE DEBUG LOGS
    console.log("error");
    console.log(error);

    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
