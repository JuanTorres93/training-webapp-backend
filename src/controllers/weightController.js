const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { Weight, User } = require("../models");

/////////////////////
// READ OPERATIONS
exports.getAllWeightsForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId, {
    include: {
      model: Weight,
      as: "weights",
    },
    order: [[{ model: Weight, as: "weights" }, "date", "ASC"]],
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json(user.weights);
});

/////////////////////
// CREATE OPERATIONS
exports.createNewWeightForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const currentWeight = await Weight.findOne({
    where: {
      user_id: user.id,
      date: req.body.date,
    },
  });

  if (currentWeight) {
    return next(new AppError("Weight already exists for that date", 409));
  }

  const newWeight = await Weight.create({
    user_id: user.id,
    date: req.body.date,
    weight: req.body.weight,
  });

  return res.status(201).json(newWeight);
});

/////////////////////
// UPDATE OPERATIONS
exports.updateWeightForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const currentWeight = await Weight.findOne({
    where: {
      user_id: user.id,
      date: req.body.date,
    },
  });
  if (!currentWeight) {
    return next(new AppError("Weight does not exist for that date", 404));
  }
  const updatedWeight = await Weight.update(req.body, {
    where: {
      user_id: user.id,
      date: req.body.date,
    },
    returning: true,
  });

  return res.status(200).json(updatedWeight[1][0]);
});

/////////////////////
// DELETE OPERATIONS
