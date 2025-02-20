const dbExercises = require('../db/exercises');

///////////////////
// READ OPERATIONS

exports.getAllExercises = async (req, res, next) => {
  const exercises = await dbExercises.selectAllExercises();

  res.status(200).send(exercises);
};

exports.getAllCommonExercses = async (req, res, next) => {
  const commonExercises = await dbExercises.selectCommonExercises();

  res.status(200).json(commonExercises);
};

exports.getExerciseById = async (req, res, next) => {
  const { exerciseId } = req.params;

  const exercise = await dbExercises.selectExerciseById(exerciseId);

  res.status(200).json(exercise);
};

exports.getAllExercisesFromUser = async (req, res, next) => {
  const { userId } = req.params;

  const exercises = await dbExercises.selectAllExercisesFromUser(userId);

  res.status(200).json(exercises);
};

///////////////////
// CREATE OPERATIONS
exports.createExercise = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const createdExercise = await dbExercises.createExercise(
      userId, req.body
    );

    return res.status(201).json(createdExercise);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when creating exercise in db"
    });
  }
};

///////////////////
// UPDATE OPERATIONS
exports.updateExercise = async (req, res, next) => {
  const { exerciseId } = req.params;
  const { name, description } = req.body;

  const newExerciseInfo = {
    name,
    description,
  };

  const updatedExercise = await dbExercises.updateExercise(exerciseId, newExerciseInfo);

  res.status(200).json(updatedExercise);
};


///////////////////
// DELETE OPERATIONS
exports.deleteExercise = async (req, res, next) => {
  const { exerciseId } = req.params;

  const deletedexercise = await dbExercises.deleteExercise(exerciseId);

  res.status(200).json(deletedexercise);
};

exports.truncateTestTable = async (req, res, next) => {
  const truncatedTable = await dbExercises.truncateTableTest();

  res.status(200).send(truncatedTable);
};