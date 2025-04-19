const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const subscriptionsDb = require("../db/subscriptions.js");
const paymentsDb = require("../db/payments.js");
const { langSeparator } = require("../config.js");

// TODO Handle error. I used to use catchAsync, but don't have that error handling in this project
exports.getCheckoutSession = async (req, res, next) => {
  try {
    // 1) Get the subscription type
    const subscription = await subscriptionsDb.selectSuscriptionById(
      req.params.subscriptionId
    );

    if (!subscription) {
      //   return next(new AppError("No tour found with that ID", 404));
      // TODO handle
    }

    const lang = req.params.lang || "en";
    let subscriptionName = "";
    let subscriptionDescription = "";
    if (!lang || lang.trim() !== "es") {
      subscriptionName = subscription.name.split(langSeparator)[0];
      subscriptionDescription =
        subscription.description.split(langSeparator)[0];
    } else {
      subscriptionName = subscription.name.split(langSeparator)[1];
      subscriptionDescription =
        subscription.description.split(langSeparator)[1];
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
      success_url: `${process.env.CLIENT_URL}/app/?createdSubscription=true`, // NOTE: param used to fetch next payment date in front
      // REQUIRED URL that the user goes if he decides to cancel the payment
      cancel_url: `${process.env.CLIENT_URL}/app/subscriptions`,
      // This is called in a protected route, so we have access to the user object
      customer_email: req.user.email,
      // Allows to pass some data to the session. Once the payment is successful,
      // we will have access to the session again, so when can use the info for
      // database operations. This is the last step in the diagram shown by JONAS and
      // it will only work in deployed applications.
      // client_reference_id: subscription.id, NOTE: Commented in preference of metadata
      locale: lang || "en",
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
              // interval: "month",
              // TODO DELETE BELOW AND UNCOMMENT ABOVE
              interval: "day",
            },
            product_data: {
              // Name of the product
              name: `${subscriptionName}`,
              // Description of the product
              description: subscriptionDescription,
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
      // Info to retrieve when the webhook is called
      subscription_data: {
        metadata: {
          userId: req.user.id,
          subscriptionId: subscription.id,
        },
      },
    });

    // 3) Send it to the client
    res.status(200).json({
      status: "success",
      session,
    });
  } catch (error) {
    console.log("error");
    console.log(error);

    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

const createPayment = async (
  userId,
  subscriptionId,
  amountInEur,
  nextPaymentDate,
  stripeSubscriptionId
) => {
  await paymentsDb.createPayment({
    userId,
    subscriptionId,
    amountInEur,
    nextPaymentDate,
    stripeSubscriptionId,
  });
};

// Función para obtener los detalles de la suscripción
const getSubscriptionNextPaymentDate = async (subscriptionId) => {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const subscriptionData = await response.json();

    const currentPeriodEnd = subscriptionData.current_period_end;
    const nextPaymentDate = new Date(currentPeriodEnd * 1000).toISOString();

    return nextPaymentDate;
  } catch (error) {
    console.error(
      "Error al obtener los detalles de la suscripción:",
      error.message
    );
  }
};

exports.webhookCheckout = async (req, res, next) => {
  // When stripe calls a webhook, it will add a header
  // containing a signature for our webhook
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    // DOC: body needs to be in raw format
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log("error");
    console.log(error);
    // Send error to Stripe
    return res.status(400).send(`Webhook error`);
  }

  // The type is specified in the Stripe webapp,
  // when creating the webhook

  if (event.type === "customer.subscription.created") {
    // This if runs when the subscription is created
    const subscription = event.data.object;

    // access metadata specified in the checkout session
    const userId = subscription.metadata.userId;
    const subscriptionId = subscription.metadata.subscriptionId;

    // Update the subscription in the database
    try {
      await subscriptionsDb.updateUserSubscription(userId, subscriptionId);
    } catch (error) {
      console.log("error");
      console.log(error);

      console.log(
        `IMPORTANT: User ${userId} has created a subscription ${subscriptionId} but it has not been updated in the database. RUN THE NECESARY SQL QUERY TO UPDATE IT`
      );

      return res.status(400).json({
        status: "fail",
        message: "Error updating subscription in database",
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    // This if runs when the payment is successful. Either on subscription creation
    // or on subscription renewal
    const payment = event.data.object;

    // Access metadata specified in the checkout session
    const userId = payment.subscription_details.metadata.userId;
    const subscriptionId = payment.subscription_details.metadata.subscriptionId;

    const stripeSubscriptionId = payment.subscription;
    const nextPaymentDate = await getSubscriptionNextPaymentDate(
      stripeSubscriptionId
    );
    const amountInEur = payment.amount_paid / 100;

    try {
      await createPayment(
        userId,
        subscriptionId,
        amountInEur,
        nextPaymentDate,
        stripeSubscriptionId
      );
    } catch (error) {
      console.log("error");
      console.log(error);
      return res.status(400).json({
        status: "fail",
        message: "Error creating payment",
      });
    }
  }

  if (event.type === "customer.subscription.updated") {
    // Mark subscription for cancellation
    const data = event.data;
    const cancelationRequested =
      data.object.cancel_at_period_end === true &&
      data.previous_attributes?.cancel_at_period_end === false;

    // TODO DELETE THESE DEBUG LOGS
    console.log("cancelationRequested");
    console.log(cancelationRequested);

    if (cancelationRequested) {
      const stripeSubscriptionId = data.object.id;

      try {
        // TODO DELETE THESE DEBUG LOGS
        console.log("Marking subscription for cancellation");
        await paymentsDb.markStripeSubscriptionAsCancelled(
          stripeSubscriptionId
        );
      } catch (error) {
        console.log("error");
        console.log(error);
        return res.status(400).json({
          status: "fail",
          message: "Error canceling subscription",
        });
      }
    }
  }

  // Delete subscription
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    // access metadata specified in the checkout session
    const userId = subscription.metadata.userId;
    try {
      const expiredSubscriptionId = (
        await subscriptionsDb.selectExpiredSubscription()
      ).id;
      // Add payment of 0; and null stripeSubscriptionId and nextPaymentDate
      await createPayment(userId, expiredSubscriptionId, 0, null, null);

      // Update the user subscription in the database to expired
      await subscriptionsDb.updateUserSubscription(
        userId,
        expiredSubscriptionId
      );
    } catch (error) {
      console.log("error");
      console.log(error);
      return res.status(400).json({
        status: "fail",
        message: "Error updating subscription in database",
      });
    }
  }

  // Notify Stripe that the webhook was received successfully
  res.status(200).json({ received: true });
};

exports.getLastPaymentForLoggedUser = async (req, res, next) => {
  const userId = req.session.passport.user.id;

  try {
    const payment = await paymentsDb.getUserLastPayment(userId);

    if (!payment) {
      return res.status(404).json({
        status: "fail",
        message: "No payment found for this user",
      });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.log("error");
    console.log(error);
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.cancelSubscription = async (req, res, next) => {
  const userId = req.session.passport.user.id;

  // Get the subscription for the user
  const stripeSubscriptionId = await paymentsDb.getUserStripeSubscriptionId(
    userId
  );

  if (!stripeSubscriptionId) {
    return res.status(404).json({
      status: "fail",
      message: "No subscription found for this user",
    });
  }

  // Cancel the subscription in Stripe
  try {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    res.status(200).json({
      status: "success",
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.log("error");
    console.log(error);
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
