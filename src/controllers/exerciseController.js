const catchAsync = require("../utils/catchAsync");
const dbExercises = require("../db/exercises");

///////////////////
// READ OPERATIONS

exports.getAllExercises = catchAsync(async (req, res, next) => {
  const exercises = await dbExercises.selectAllExercises();

  res.status(200).send(exercises);
});

exports.getAllCommonExercses = catchAsync(async (req, res, next) => {
  const commonExercises = await dbExercises.selectCommonExercises();

  res.status(200).json(commonExercises);
});

exports.getExerciseById = catchAsync(async (req, res, next) => {
  const { exerciseId } = req.params;

  const exercise = await dbExercises.selectExerciseById(exerciseId);

  res.status(200).json(exercise);
});

exports.getAllExercisesFromUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const exercises = await dbExercises.selectAllExercisesFromUser(userId);

  res.status(200).json(exercises);
});

///////////////////
// CREATE OPERATIONS
exports.createExercise = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const createdExercise = await dbExercises.createExercise(userId, req.body);

  return res.status(201).json(createdExercise);
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

  const updatedExercise = await dbExercises.updateExercise(
    exerciseId,
    newExerciseInfo
  );

  res.status(200).json(updatedExercise);
});

///////////////////
// DELETE OPERATIONS
exports.deleteExercise = catchAsync(async (req, res, next) => {
  const { exerciseId } = req.params;

  const deletedexercise = await dbExercises.deleteExercise(exerciseId);

  res.status(200).json(deletedexercise);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const truncatedTable = await dbExercises.truncateTableTest();

  res.status(200).send(truncatedTable);
});
