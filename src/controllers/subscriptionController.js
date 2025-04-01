const subscriptionsDb = require("../db/subscriptions.js");

exports.getAllSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all subscriptions for the user
    const subscriptions = await subscriptionsDb.selectAllSubscriptions(userId);

    // Check if the user has any subscriptions
    if (subscriptions.length === 0) {
      return res.status(404).json({ message: "No subscriptions found" });
    }

    // Return the subscriptions
    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSubscriptionForUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get the subscription for the user
    const subscription = await subscriptionsDb.selectSubscriptionForUser(
      userId
    );

    // Check if the subscription exists
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Return the subscription
    return res.status(200).json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
