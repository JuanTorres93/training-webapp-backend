const AppError = require("../utils/appError.js");
const catchAsync = require("../utils/catchAsync.js");
const subscriptionsDb = require("../db/subscriptions.js");

exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Get all subscriptions for the user
  const subscriptions = await subscriptionsDb.selectAllSubscriptions(userId);

  // Check if the user has any subscriptions
  if (subscriptions.length === 0) {
    return next(new AppError("No subscriptions found", 404));
  }

  // Return the subscriptions
  return res.status(200).json(subscriptions);
});

exports.getSubscriptionForUser = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Get the subscription for the user
  const subscription = await subscriptionsDb.selectSubscriptionForUser(userId);

  // Check if the subscription exists
  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  // Return the subscription
  return res.status(200).json(subscription);
});
