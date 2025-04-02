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
      success_url: `${process.env.CLIENT_URL}/app`,
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
              // TODO IMPORTANT DELETE BELOW AND UNCOMMENT ABOVE
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
  nextPaymentDate
) => {
  await paymentsDb.createPayment({
    userId,
    subscriptionId,
    amountInEur,
    nextPaymentDate,
  });
};

// Función para obtener los detalles de la suscripción
async function getSubscriptionNextPaymentDate(subscriptionId) {
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

    // Extraer la fecha del próximo cobro
    const currentPeriodEnd = subscriptionData.current_period_end;
    console.log("Fecha del próximo cobro (timestamp UNIX):", currentPeriodEnd);

    // Convertir el timestamp a una fecha legible
    const nextPaymentDate = new Date(currentPeriodEnd * 1000).toISOString();
    console.log("Fecha del próximo cobro (formato legible):", nextPaymentDate);
  } catch (error) {
    console.error(
      "Error al obtener los detalles de la suscripción:",
      error.message
    );
  }
}

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
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  // The type is specified in the Stripe webapp,
  // when creating the webhook

  if (event.type === "invoice.payment_succeeded") {
    // This if runs when the payment is successful. Either on subscription creation
    // or on subscription renewal
    const payment = event.data.object;

    // Aquí accedemos a los metadatos
    const userId = payment.subscription_details.metadata.userId;
    const subscriptionId = payment.subscription_details.metadata.subscriptionId;

    const stripeSubscriptionId = payment.suscription;
    const nextPaymentDate = await getSubscriptionNextPaymentDate(
      stripeSubscriptionId
    );
    const amountInEur = payment.amount_paid / 100;

    try {
      await createPayment(userId, subscriptionId, amountInEur, nextPaymentDate);
    } catch (error) {
      console.log("error");
      console.log(error);
      return res.status(400).json({
        status: "fail",
        message: error.message,
      });
    }
  }
  // TODO process cancel and update subscription events

  res.status(200).json({ received: true });
};
