const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbWorkouts = require("../db/workouts");

//////////////////////
// READ OPERATIONS

exports.getWorkoutById = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const workout = await dbWorkouts.selectworkoutById(workoutId);

  res.status(200).json(workout);
});

exports.getLastWorkoutsFromATemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId, numberOfWorkouts } = req.params;

    const workout = await dbWorkouts.selectLastNWorkoutsFromUser(
      templateId,
      userId,
      numberOfWorkouts
    );

    res.status(200).json(workout);
  }
);

exports.getLastSingleWorkoutFromTemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId } = req.params;
    const workout = await dbWorkouts.selectLastWorkoutFromUser(
      templateId,
      userId
    );

    res.status(200).json(workout);
  }
);

exports.getAllWorkoutsFromTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const user = req.session.passport.user;

  const workoutsIds = await dbWorkouts.getAllWorkoutsIdsFromTemplateId(
    templateId,
    user.id
  );

  res.status(200).json(workoutsIds);
});

//////////////////////
// CREATE OPERATIONS

exports.createWorkout = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const createdWorkout = await dbWorkouts.createWorkouts(userId, req.body);
  return res.status(201).json(createdWorkout);
});

//////////////////////
// UPDATE OPERATIONS

exports.updateEndDateOfWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const workout = await dbWorkouts.addFinishDateToWorkout(workoutId);

  res.status(200).json(workout);
});

exports.updateWorkout = catchAsync(async (req, res, next) => {
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
});

exports.updateExerciseInWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;
  const { exerciseSet, reps, weight, time_in_seconds } = req.body;

  const exerciseInWorkoutExists = await dbWorkouts.checkExerciseInWorkoutExists(
    workoutId,
    exerciseId
  );

  if (!exerciseInWorkoutExists) {
    return next(
      new AppError(
        `Exercise with id ${exerciseId} does not exist in workout with id ${workoutId}`,
        404
      )
    );
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
});

exports.addExerciseToWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const exerciseData = {
    ...req.body,
    timeInSeconds: req.body.time_in_seconds,
    exerciseId: req.body.exerciseId,
    exerciseSet: req.body.exerciseSet,
    workoutId,
  };

  // TODO CHECK primary key is not duplicated?
  const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData);

  const capitalizedAddedExercise = {
    exerciseId: addedExercise.exerciseid,
    exerciseSet: addedExercise.exerciseset,
    reps: addedExercise.reps,
    weight: addedExercise.weight,
    time_in_seconds: addedExercise.time_in_seconds,
  };

  return res.status(201).json(capitalizedAddedExercise);
});

//////////////////////
// DELETE OPERATIONS

exports.deleteWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId);

  res.status(200).json(deletedWorkout);
});

exports.deleteExerciseFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;

  const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(
    workoutId,
    exerciseId
  );

  res.status(200).json(deletedExercise);
});

exports.deleteExerciseSetFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId, exerciseSet } = req.params;

  const deletedExercise = await dbWorkouts.deleteSetFromExercise(
    workoutId,
    exerciseId,
    exerciseSet
  );

  res.status(200).json(deletedExercise);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const truncatedTable = await dbWorkouts.truncateTableTest();

  res.status(200).send(truncatedTable);
});
