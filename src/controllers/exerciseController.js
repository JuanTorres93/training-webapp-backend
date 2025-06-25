const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const { sequelize, User, Exercise } = require("../models");

///////////////////
// READ OPERATIONS

//exports.getAllExercises = catchAsync(async (req, res, next) => {
//  const exercises = await Exercise.findAll();
//
//  res.status(200).send(exercises);
//});

exports.getAllCommonExercses = catchAsync(async (req, res, next) => {
  const commonExercises = await Exercise.findAll({
    include: [
      {
        model: User,
        as: "users",
        where: {
          email: process.env.DB_COMMON_USER_EMAIL,
        },
      },
    ],
  });

  res.status(200).json(commonExercises);
});

exports.getExerciseById = catchAsync(async (req, res, next) => {
  const { exerciseId } = req.params;

  const exercise = await Exercise.findByPk(exerciseId);

  res.status(200).json(exercise);
});

exports.getAllExercisesFromUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const userWithExercises = await User.findOne({
    where: {
      id: userId,
    },
    include: [
      {
        model: Exercise,
        as: "exercises",
      },
    ],
    order: [[{ model: Exercise, as: "exercises" }, "id", "ASC"]],
  });

  if (!userWithExercises) {
    return next(new AppError(`User with ID ${userId} not found`, 404));
  }

  res.status(200).json(userWithExercises.exercises);
});

///////////////////
// CREATE OPERATIONS
exports.createExercise = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Get user
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError(`User with ID ${userId} not found`, 404));
  }

  // Create new exercise
  const newExercise = await Exercise.create({
    ...req.body,
  });

  // Associate the new exercise with the user
  await user.addExercise(newExercise);

  return res.status(201).json(newExercise);
});

///////////////////
// UPDATE OPERATIONS
exports.updateExercise = catchAsync(async (req, res, next) => {
  const { exerciseId } = req.params;
  const { name, description } = req.body;

  const newExerciseInfo = {
    name,
    description,
  };

  const updatedExercise = await Exercise.update(newExerciseInfo, {
    where: {
      id: exerciseId,
    },
    returning: true,
  });

  // updatedExercise is an array where:
  // - updatedExercise[0] is the number of affected rows
  // - updatedExercise[1] is an array of the updated instances
  // - updatedExercise[1][0] is the first updated instance (the only one in this case)
  res.status(200).json(updatedExercise[1][0]);
});

///////////////////
// DELETE OPERATIONS
exports.deleteExercise = catchAsync(async (req, res, next) => {
  const { exerciseId } = req.params;

  const deletedExercise = await Exercise.findByPk(exerciseId);
  // const deletedexercise = await dbExercises.deleteExercise(exerciseId);
  await sequelize.transaction(async (t) => {
    // Delete related associations
    await deletedExercise.setUsers([], { transaction: t }); // Removes all associations with users

    // Delete the exercise
    await deletedExercise.destroy({ transaction: t });
  });

  res.status(200).json(deletedExercise);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  if (!appIsBeingTested) {
    // Generic response for attackers
    return res.status(200).json({
      status: "success",
      message: "Truncated exercises.",
    });
  }

  await sequelize.transaction(async (t) => {
    await sequelize.query(
      "TRUNCATE TABLE users_exercises RESTART IDENTITY CASCADE"
    );
    await sequelize.query("TRUNCATE TABLE exercises RESTART IDENTITY CASCADE");
  });

  res
    .status(200)
    .send("Table exercises and users_exercises truncated in test db.");
});
