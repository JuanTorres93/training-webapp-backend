const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbWeights = require("../db/weights");

/////////////////////
// READ OPERATIONS
exports.getAllWeightsForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const user = await dbWeights.selectAllWeightsForUser(userId);

  if (user === undefined) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json(user);
});

/////////////////////
// CREATE OPERATIONS
exports.createNewWeightForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const weightExists = await dbWeights.weightExists(userId, req.body.date);

  if (weightExists) {
    return next(new AppError("Weight already exists for that date", 409));
  }

  const newWeight = await dbWeights.addNewWeight(userId, req.body);
  return res.status(201).json(newWeight);
});

/////////////////////
// UPDATE OPERATIONS
exports.updateWeightForUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const weightExists = await dbWeights.weightExists(userId, req.body.date);

  if (!weightExists) {
    return next(new AppError("Weight does not exist for that date", 404));
  }

  const updatedWeight = await dbWeights.updateWeight(userId, req.body);
  return res.status(200).json(updatedWeight);
});

/////////////////////
// DELETE OPERATIONS
