const dbWorkouts = require("../db/workouts");

//////////////////////
// READ OPERATIONS

exports.getAllWorkouts = async (req, res, next) => {
  const workouts = await dbWorkouts.selectAllWorkouts();

  res.status(200).send(workouts);
};

exports.getWorkoutById = async (req, res, next) => {
  const { workoutId } = req.params;

  const workout = await dbWorkouts.selectworkoutById(workoutId);

  res.status(200).json(workout);
};

exports.getLastWorkoutsFromATemplateByUserId = async (req, res, next) => {
  const { templateId, userId, numberOfWorkouts } = req.params;

  const workout = await dbWorkouts.selectLastNWorkoutsFromUser(
    templateId,
    userId,
    numberOfWorkouts
  );

  res.status(200).json(workout);
};

exports.getLastSingleWorkoutFromTemplateByUserId = async (req, res, next) => {
  const { templateId, userId } = req.params;
  let workout;
  try {
    workout = await dbWorkouts.selectLastWorkoutFromUser(templateId, userId);
  } catch (error) {
    console.log(error);
  }

  res.status(200).json(workout);
};

exports.getAllWorkoutsFromTemplate = async (req, res, next) => {
  const { templateId } = req.params;
  const user = req.session.passport.user;

  const workoutsIds = await dbWorkouts.getAllWorkoutsIdsFromTemplateId(
    templateId,
    user.id
  );

  res.status(200).json(workoutsIds);
};

//////////////////////
// CREATE OPERATIONS

exports.createWorkout = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const createdWorkout = await dbWorkouts.createWorkouts(userId, req.body);
    return res.status(201).json(createdWorkout);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when creating workout",
    });
  }
};

//////////////////////
// UPDATE OPERATIONS

exports.updateEndDateOfWorkout = async (req, res, next) => {
  const { workoutId } = req.params;

  const workout = await dbWorkouts.addFinishDateToWorkout(workoutId);

  res.status(200).json(workout);
};

exports.updateWorkout = async (req, res, next) => {
  const { workoutId } = req.params;
  const { description } = req.body;

  const updateWorkoutInfo = {
    description,
  };

  const updatedWorkout = await dbWorkouts.updateWorkout(
    workoutId,
    updateWorkoutInfo
  );

  res.status(200).json(updatedWorkout);
};

exports.updateExerciseInWorkout = async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;
  const { exerciseSet, reps, weight, time_in_seconds } = req.body;

  const exerciseInWorkoutExists = await dbWorkouts.checkExerciseInWorkoutExists(
    workoutId,
    exerciseId
  );

  if (!exerciseInWorkoutExists) {
    return res.status(404).json({
      msg: `Exercise with id ${exerciseId} does not exist in workout with id ${workoutId}`,
    });
  }

  const updateExerciseInfo = {
    exerciseId,
    exerciseSet,
    reps,
    weight,
    time_in_seconds,
  };

  const updatedExercise = await dbWorkouts.updateExerciseFromWorkout(
    workoutId,
    updateExerciseInfo
  );

  res.status(200).json(updatedExercise);
};

exports.addExerciseToWorkout = async (req, res, next) => {
  const { workoutId } = req.params;

  const exerciseData = {
    ...req.body,
    timeInSeconds: req.body.time_in_seconds,
    exerciseId: req.body.exerciseId,
    exerciseSet: req.body.exerciseSet,
    workoutId,
  };

  // TODO CHECK primary key is not duplicated?
  try {
    const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData);

    const capitalizedAddedExercise = {
      exerciseId: addedExercise.exerciseid,
      exerciseSet: addedExercise.exerciseset,
      reps: addedExercise.reps,
      weight: addedExercise.weight,
      time_in_seconds: addedExercise.time_in_seconds,
    };

    return res.status(201).json(capitalizedAddedExercise);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when adding exercise to workout",
    });
  }
};

//////////////////////
// DELETE OPERATIONS

exports.deleteWorkout = async (req, res, next) => {
  const { workoutId } = req.params;

  const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId);

  res.status(200).json(deletedWorkout);
};

exports.deleteExerciseFromWorkout = async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;

  const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(
    workoutId,
    exerciseId
  );

  res.status(200).json(deletedExercise);
};

exports.deleteExerciseSetFromWorkout = async (req, res, next) => {
  const { workoutId, exerciseId, exerciseSet } = req.params;

  const deletedExercise = await dbWorkouts.deleteSetFromExercise(
    workoutId,
    exerciseId,
    exerciseSet
  );

  res.status(200).json(deletedExercise);
};

exports.truncateTestTable = async (req, res, next) => {
  const truncatedTable = await dbWorkouts.truncateTableTest();

  res.status(200).send(truncatedTable);
};
