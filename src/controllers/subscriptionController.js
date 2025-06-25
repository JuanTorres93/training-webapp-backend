const AppError = require("../utils/appError.js");
const catchAsync = require("../utils/catchAsync.js");
const { Subscription, User } = require("../models");

exports.getAllSubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await Subscription.findAll({
    where: {
      is_public: true, // Only return public subscriptions
    },
  });

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
  const subscription = await Subscription.findOne({
    include: [
      {
        model: User,
        as: "users",
        where: { id: userId },
      },
    ],
  });

  // Check if the subscription exists
  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  // Return the subscription
  return res.status(200).json(subscription);
});
